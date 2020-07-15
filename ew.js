const isRoot = process.getuid && process.getuid() === 0;
const fs = require('fs-extra');
const download = require('download-file');
const targz = require('targz');

if (!isRoot) return console.log("You must be root to excecute this command!");
if (!fs.existsSync("/etc/ew")) fs.mkdirSync("/etc/ew");
if (!fs.existsSync("/etc/ew/installed")) fs.mkdirSync("/etc/ew/installed");

if (!fs.existsSync("/etc/ew/source")) {
    fs.mkdirSync("/etc/ew/source");
    fs.writeFileSync("/etc/ew/sources.list");
}

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
if (process.argv[2] === '-a') addsrc(process.argv[3]);
if (process.argv[2] === '-h') help();
if (process.argv[2] === '-l') update();

function updatePackageList() {
    process.stdout.write("Updating package list... ");
    download("https://ew.cumbox.best/packages.json", { directory: "/etc/ew", filename: "packages.json" }, function(err) {
        if (err) throw err;
        process.stdout.write("Done!\n");
    });
};

function help() {
    console.log("here are the list of commands available for ew package manager:");
    console.log(" ");
    console.log("-r: reload package list");
    console.log("-i: installs a package");
    console.log("-u: uninstalls a package");
    console.log("-a: add a source");
    console.log("-h: prints list of commands");
    console.log("-l: update ew");
}

function install(package) {
    var packageList = require("/etc/ew/packages.json");
    var packageURL = packageList[package];
    console.log(packageURL);
    process.stdout.write(`Downloading ${package}... `);
    download(packageURL, { directory: "/tmp", filename: `${package}.ew.tar.gz` }, function() {
        targz.decompress({ src: `/tmp/${package}.ew.tar.gz`, dest: '/' }, function() {

            fs.unlinkSync(`/tmp/${package}.ew.tar.gz`);

        });
        process.stdout.write("Done!\n");
        console.log(`Installed ${package}!`);
    });
    download(`https://ew.cumbox.best/packageInfo/${package}.json`, { directory: "/etc/ew/installed", filename: `${package}.json` });
};

function uninstall(package) {
    process.stdout.write(`removing ${package}....`);
    if (!fs.existsSync(`/etc/ew/installed/${package}.json`) && !fs.existsSync(`/etc/ew/archive/${package}.ew.tar.gz`)) return console.log("package already removed!");
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

function addsrc(src) {
    return console.log("this function is unfinished");
}

//fs.unlinkSync('/etc/ew/lock');