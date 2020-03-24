const isRoot = process.getuid && process.getuid() === 0;
const fs = require('fs');
const download = require('download-file');
const targz = require('targz');

if (!isRoot) return console.log("You must be root to excecute this command!");
if (!fs.existsSync("/etc/ew")) fs.mkdirSync("/etc/ew");
if (!fs.existsSync("/etc/ew/installed")) fs.mkdirSync("/etc/ew/installed");
//if (fs.existsSync("/etc/ew/lock")) return console.log("/etc/ew/lock exists, cancelling.");
//fs.writeFileSync('/etc/ew/lock', 'ew package manager lock\n');
//console.log("Created lock file.");
if (!fs.existsSync("/etc/ew/packages.json")) { updatePackageList(); fs.writeFileSync('/etc/ew/packages.json', '{}') };

if (process.argv[2] === '-r') updatePackageList();
if (process.argv[2] === '-i') install(process.argv[3]);
if (process.argv[2] === '-u') uninstall(process.argv[3]);

function updatePackageList() {
    process.stdout.write("Updating package list... ");
    download("https://ew.cumbox.best/packages.json", { directory: "/etc/ew", filename: "packages.json" }, function (err) {
        if (err) throw err;
        process.stdout.write("Done!\n");
    });
};

function install(package) {
    var packageList = require("/etc/ew/packages.json");
    var packageURL = packageList[package]
    console.log(packageURL);
    process.stdout.write(`Downloading ${package}... `);
    download(packageURL, { directory: "/tmp", filename: `${package}.ew.tar.gz` }, function(){
        targz.decompress({ src: `/tmp/${package}.ew.tar.gz`, dest: '/'}, function(){
            fs.unlinkSync(`/tmp/${package}.ew.tar.gz`);
        });
        process.stdout.write("Done!\n");
        console.log(`Installed ${package}!`);
    });
    download(`https://ew.cumbox.best/packageInfo/${package}.json`, { directory: "/etc/ew/installed", filename: `${package}.json` });
};

function uninstall(package) {
    console.log(package)
}

//fs.unlinkSync('/etc/ew/lock');
