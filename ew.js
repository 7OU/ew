const isRoot = process.getuid && process.getuid() === 0;
const fs = require('fs');
const download = require('download-file')
const repoOptions = {
    directory: "/etc/ew/",
    filename: "packages.json"
}
var packageDL;

// Check for ioot
if (!isRoot) { return console.log("You must be root to excecute this command!") }
// Check for lock file
if (!fs.existsSync("/etc/ew")) fs.mkdirSync("/etc/ew");
if (fs.existsSync("/etc/ew/lock")) { return console.log("/etc/ew/lock exists, cancelling.") }
// Create lock file
fs.writeFileSync('/etc/ew/lock', 'ew package manager lock\n');
console.log("Created lock file.")
// Download package list
function updatePackageList(){
    process.stdout.write("Updating Package List...")
    download("https://ew.cumbox.best/packages.json", dlOptions, function(err){
        if (err) throw err;
    process.stdout.write(" Done!\n");
    });
};
// Updates packages, and then creates the variable for the package list json.
if (!fs.existsSync("/etc/ew/packages.json")) updatePackageList();
const packageList = require ("/etc/ew/packages.json");
// Updates package list if the argument is -r
if (process.argv[2] === '-r') updatePackageList();

if (process.argv[2] === '-i') {
    console.log(packageList.process.argv[3]);
    if (packageList.[process.argv[3]] === undefined) return console.log("no");
}

fs.unlinkSync('/etc/ew/lock')
