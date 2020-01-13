const isRoot = process.getuid && process.getuid() === 0;
const fs = require('fs');
const download = require('download-file');

is (!isRoot) return console.log("You must be root to excecute this command!");
if (!fs.existsSync("/etc/ew")) fs.mkdirSync("/etc/ew");
//if (fs.existsSync("/etc/ew/lock")) return console.log("/etc/ew/lock exists, cancelling.");
//fs.writeFileSync('/etc/ew/lock', 'ew package manager lock\n');
//console.log("Created lock file.");
if (!fs.existsSync("/etc/ew/packages.json")) { updatePackageList(); fs.writeFileSync('/etc/ew/packages.json', '{}') };


if (process.argv[2]) updatePackageList();
if (process.argv[2]) install(process.argv[2]);
if (process.argv[2]) uninstall(process.argv[2]);

function updatePackageList() {
    process.stdout.write("Updating package list... ");
    download("https://ew.cumbox.best/packages.json", { directory: "/etc/ew", filename: "packages.json" }, function (err) {
        if (err) throw err
        process.stdout.write(Done!\n);
    });
};

function install(package) {
    console.log(package);
};

function uninstall(package) {
    console.log(package);
};

fs.unlinkSync('/etc/ew/lock');
