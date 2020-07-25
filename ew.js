const isRoot = process.getuid && process.getuid() === 0;
const fs = require('fs-extra');
const download = require('download-file');
const download2 = require(`download-file-sync`);
const targz = require('targz');
if (!isRoot) return console.log("You must be root to excecute this command!");
if (!fs.existsSync("/etc/ew")) fs.mkdirSync("/etc/ew");
if (!fs.existsSync("/etc/ew/installed")) fs.mkdirSync("/etc/ew/installed");
//if (fs.existsSync("/etc/ew/lock")) return console.log("/etc/ew/lock exists, cancelling.");
//fs.writeFileSync('/etc/ew/lock', 'ew package manager lock\n');
//console.log("Created lock file.");
if (!fs.existsSync("/etc/ew/packages.json")) {
    updatePackageList();
    fs.writeFileSync('/etc/ew/packages.json', '{}')
};
switch(process.argv[2]) {
    case ('-r'): updatePackageList();
    case (-'i'): install(process.argv[3]);
    case ('-u'): uninstall(process.argv[3]);
    case ('-h'): return console.log("list of commands available for ew package manager:\n \n -r: reload package list\n -i: installs a package\n -u: uninstalls a package\n -pl: shows the list of packages that can be installed\n -h: prints list of commands\n");
    default: return console.log("list of commands available for ew package manager:\n \n -r: reload package list\n -i: installs a package\n -u: uninstalls a package\n -pl: shows the list of packages that can be installed\n -h: prints list of commands\n");
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
    var packageList = require("/etc/ew/packages.json");
    var packageURL = packageList[package];
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
        if (dependscount === 1) console.log("this package requires " + dependscount + " dependency, installing now...");
        else if (dependscount === 0) return console.log("Warning: json file has a depends field, but its empty.");
        else console.log("this package requires" + dependscount + "dependencies");
        //do a for loop to install the package
        for (let dependencies = json.depends; dependscount > 0; dependscount--) {
            dependencies = JSON.stringify(dependencies);
            dependencies = dependencies.replace(/[\[\]"]/g, "")
                //install the specified package after making it a valid string
            install(dependencies);
        }
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
    //for loop the removal of files
    for (let file = directories; directorycount > 0; directorycount--) {
        let newfile = JSON.stringify(file);
        newfile = newfile.replace(/[\[\]"]/g, "");
        fs.removeSync(newfile);
    }
    //after we are done, remove the json file
    fs.unlinkSync(`/etc/ew/installed/${package}.json`);
    process.stdout.write(`done!\n`);
    process.stdout.write(`Successfully  uninstalled ${package}!\n`);
}

function packagelist() {
    //get the packages json file 
    const json = require('/etc//ew/packages.json');
    //print the number of packages available
    console.log(Object.keys(json).length + ' packages are available to be downloaded: ');
    //print the package list
    console.log(Object.keys(json));
}
//fs.unlinkSync('/etc/ew/lock');
