const isRoot = process.getuid && process.getuid() === 0;
const fs = require('fs-extra');
const download = require('download-file');
const download2 = require(`download-file-sync`);
const targz = require('targz');
if (!isRoot) return console.log("You must be root to excecute this command!");
if (!fs.existsSync("/etc/ew")) fs.mkdirSync("/etc/ew");
if (!fs.existsSync("/etc/ew/installed")) fs.mkdirSync("/etc/ew/installed");
//make an archive to help with other functions
//if (fs.existsSync("/etc/ew/lock")) return console.log("/etc/ew/lock exists, cancelling.");
//fs.writeFileSync('/etc/ew/lock', 'ew package manager lock\n');
//console.log("Created lock file.");
if (!fs.existsSync("/etc/ew/packages.json")) {
    updatePackageList();
    fs.writeFileSync('/etc/ew/packages.json', '{}')
};
if (process.argv[2] === '-r') updatePackageList();
if (process.argv[2] === '-i') install(process.argv[3]);
if (process.argv[2] === '-u') uninstall(process.argv[3]);
if (process.argv[2] === '-h') help();
if (process.argv[2] === '-pl') packagelist();
if (!process.argv[2]) help();

function updatePackageList() {
    process.stdout.write("Updating package list... ");
    download("https://ew.cumbox.best/packages.json", { directory: "/etc/ew", filename: "packages.json" }, function(err) {
        if (err) throw err;
        process.stdout.write("Done!\n");
    });
};

function help() {
    console.log("list of commands available for ew package manager:\n \n -r: reload package list\n -i: installs a package\n -u: uninstalls a package\n -pl: shows the list of packages that can be installed\n -h: prints list of commands\n");
}

function install(package) {
    //check if the package arg exists
    if (!process.argv[3]) return console.log("Please specify a package to install.");
    var packageList = require("/etc/ew/packages.json");
    var packageURL = packageList[package];
    //check if its a valid package aswell..
    if (!packageURL) return console.log("Invalid package specified.");
    process.stdout.write(`Downloading ${package}... `);
    download(packageURL, { directory: "/tmp", filename: `${package}.ew.tar.gz` }, function() {
        targz.decompress({ src: `/tmp/${package}.ew.tar.gz`, dest: '/' }, function() {
            if (fs.existsSync(`/tmp/${package}.ew.tar.gz`)) fs.unlinkSync(`/tmp/${package}.ew.tar.gz`);
        });
    });
    let jsond = download2(`https://ew.cumbox.best/packageInfo/${package}.json`);
    fs.writeFileSync(`/etc/ew/installed/${package}.json`, jsond);
    process.stdout.write("done!\n");
    process.stdout.write(`Successfully installed ${package}!\n`);
    const json = require(`/etc/ew/installed/${package}.json`);
    if (json["depends"]) {
        let dependscount = json.depends.length;
        if (dependscount === 1) console.log("this package requires " + dependscount + " dependency, installing now...");
        else if (dependscount === 0) return console.log("Warning: json file has a depends field, but its empty.");
        else console.log("this package requires" + dependscount + "dependencies");
        for (let dependencies = json.depends; dependscount > 0; dependscount--) {
            dependencies = JSON.stringify(dependencies);
            dependencies = dependencies.replace(/[\[\]"]/g, "")
            install(dependencies);
        }
    }
};

function uninstall(package) {
    if (!process.argv[3]) return console.log("Please specify a package to uninstall.");
    process.stdout.write(`removing ${package}....`);
    if (!fs.existsSync(`/etc/ew/installed/${package}.json`)) return console.log("the specified package has already been removed or not installed.");
    let json = require(`/etc/ew/installed/${package}.json`);
    let directories = json.directoriesToDelete;
    let directorycount = directories.length;
    for (let file = directories; directorycount > 0; directorycount--) {
        let newfile = JSON.stringify(file);
        newfile = newfile.replace(/[\[\]"]/g, "");
        fs.removeSync(newfile);
    }
    fs.unlinkSync(`/etc/ew/installed/${package}.json`);
    process.stdout.write(`done!\n`);
    process.stdout.write(`Successfully  uninstalled ${package}!\n`);
}

function packagelist() {
    const json = require('/etc//ew/packages.json');
    var packagecount = Object.keys(json).length;
    console.log(packagecount + ' packages are available to be downloaded: ');
    console.log(Object.keys(json));
}
//fs.unlinkSync('/etc/ew/lock');