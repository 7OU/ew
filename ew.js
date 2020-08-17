const isRoot = process.getuid && process.getuid() === 0;
const fs = require('fs-extra');
const download = require('download-file');
const download2 = require('download-file-sync');
const targz = require('targz');

if (!isRoot) return console.log("You must be root to excecute this command!");
if (!fs.exists("/etc/ew")) fs.mkdir("/etc/ew");
if (!fs.exists("/etc/ew/installed")) fs.mkdir("/etc/ew/installed");

if (fs.existsSync("/etc/ew/lock")) return console.log("/etc/ew/lock exists, cancelling.");
fs.writeFileSync('/etc/ew/lock', 'ew package manager lock\n');

if (!fs.exists("/etc/ew/packages.json")) {
    updatePackageList();
    fs.writeFile('/etc/ew/packages.json', '{}')
};


switch (process.argv[2]) {
    case ('reload'):
    case ('-r'):
        updatePackageList();
        break;
    case ('-i'):
    case ('install'):
        install(process.argv[3]);
        break;
    case ('-u'):
    case ('remove'):
        uninstall(process.argv[3]);
        break;
    case ('-h'):
    case ('help'):
        console.log("list of commands available for ew package manager:\n \n -r: reload package list\n -i: installs a package\n -u: uninstalls a package\n -pl: shows the list of packages that can be installed\n -h: prints list of commands\n");
        break;
    case ('-pl'):
    case ('packagelist'):
        packagelist();
        break;
    default:
        console.log("list of commands available for ew package manager:\n \n -r: reload package list\n -i: installs a package\n -u: uninstalls a package\n -pl: shows the list of packages that can be installed\n -h: prints list of commands\n");
        break;
}

function updatePackageList() {
    process.stdout.write("Updating package list... ");
    download("https://ew.cumbox.best/packages.json", { directory: "/etc/ew", filename: "packages.json" }, function(err) {
        if (err) throw err;
        process.stdout.write("Done!\n");
    });
};

function install(package) {
    //check if the package arg exists
    if (!process.argv[3]) return console.log("Please specify a package to install.");
    const packageList = require("/etc/ew/packages.json");

    let packageURL = packageList[package];
    //check if its a valid package aswell..
    if (!packageURL) return console.log("Invalid package specified, try doing sudo ew -r and see if it resolves the issue.");

    process.stdout.write(`Downloading ${package}... `);
    //use download-file module to store the archive of the package in tmp

    download(packageURL, { directory: "/tmp", filename: `${package}.ew.tar.gz` }, function() {
        targz.decompress({ src: `/tmp/${package}.ew.tar.gz`, dest: '/' }, function() {

            //sometimes the archive may or may not exist here, so we should check first if it does.
            if (fs.existsSync(`/tmp/${package}.ew.tar.gz`)) fs.unlinkSync(`/tmp/${package}.ew.tar.gz`);
        });
    });
    //curl the package json file for future use
    let jsond = download2(`https://ew.cumbox.best/packageInfo/${package}.json`);

    //create and write the contents of the curl to the package json file
    fs.writeFileSync(`/etc/ew/installed/${package}.json`, jsond);

    process.stdout.write("done!\n");
    process.stdout.write(`Successfully installed ${package}!\n`);
    //do some dependency checking
    const json = require(`/etc/ew/installed/${package}.json`);

    //the name of the object key for dependencies is depends
    if (json["depends"]) {
        let dependscount = json.depends.length;
        switch (dependscount) {
            case 1:
                console.log(`this package requires ${dependscount} dependency, installing now...`);
                break;
            case dependscount > 1:
                console.log(`this package requires ${dependscount} dependencies, installing them now...`);
        }
        let depens = dependscount;

        //do a for loop to install the package
        for (let dependencies = json.depends; dependscount > 0; dependscount--) {
            //get the first result of the array and shift the next dependency to the first result
            var ndependencies = dependencies.shift();
            //convert that object from the array into a single string
            ndependencies = ndependencies.toString();
            //do a check to see if the package is already installed

            if (fs.existsSync(`/etc/ew/installed/${ndependencies}.json`)) {
                console.log(`${ndependencies} is already installed!`);
                //delete the object from the array
                delete(ndependencies[0]);
                //continue the for loop for the other dependencies
                continue;
            }

            //install the dependency
            install(ndependencies);
            //clear the array for another object 
            delete(ndependencies[0]);
        }

        console.log(`Successfully installed ${package} with ${depens} dependencies!`);
    }
};

function uninstall(package) {
    //check if a package to remove has been specified and return if it wasnt 
    if (!process.argv[3]) return console.log("Please specify a package to uninstall.");
    process.stdout.write(`removing ${package}....`);

    //check if the package json file is present, if not, the package does not exist.
    if (!fs.existsSync(`/etc/ew/installed/${package}.json`)) return console.log("the specified package has already been removed or not installed.");

    //load the json file to read the dirs to delete
    let json = require(`/etc/ew/installed/${package}.json`);

    //assign a variable to the json object key named directoriesToDelete
    //this is required for all packages.
    let directories = json.directoriesToDelete;
    let directorycount = directories.length;
    for (let file = directories; directorycount > 0; directorycount--) {
        var newfile = file.shift();
        newfile = newfile.toString();
        fs.removeSync(newfile);
        delete(newfile[0]);
    }
    fs.unlinkSync(`/etc/ew/installed/${package}.json`);
    process.stdout.write(`done!\n`);
    process.stdout.write(`Successfully uninstalled ${package}!\n`);
}

function packagelist() {
    //get the packages json file 
    const json = require('/etc//ew/packages.json');

    //print the number of packages available
    console.log(Object.keys(json).length + ' packages are available to be downloaded: ');

    //print the package list
    console.log(Object.keys(json));

}

fs.unlink('/etc/ew/lock');