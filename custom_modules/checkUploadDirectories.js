// Accessing the File System Module and storing it so I can
// access the methods of it later
var fs = require("fs");

// Specifying the root path of the uploads directories, so that it
// can be prepened to each of the subdirectories below
var mainDirectory = './file_uploads/';

// Creating an array to store all of the directories required for storing
// file uploads, including the main directory (as declared above). Prepending
// each of the subdirectories with the main directory path, so that they will
// appear as a folder hierarchy.
var allDirectories = [
    mainDirectory,
    mainDirectory + "audio",
    mainDirectory + "images",
    mainDirectory + "other"
];

// Creating the checkAll funciton, which will server as the export for this module
// so that when this module is required, it is just a funciton (which takes no parametres)
// which is returned. This was, the variable containing this module can be called at any
// time to make sure all folder still exist on the server, without having to specify each one
var checkAll = function() {
    console.log("Checking that the file uploads folder hierarchy exists");
    
    // Looping through each of the required directories, to check if they already exist, and
    // if they don't, then creating them. Passing each directory into the function as "pathName".
    // Also passing the index, although not utilising it currently in this loop.
    allDirectories.forEach(function(pathName, index) {
        
        // Using the file system module's exists() method to check if this directory already exists.
        // The result of this will be a boolean value (as defined by the dirExists parametre).
        fs.exists(pathName, function(dirExists) {
            
            // Checking if the result was that this directory exists
            if (dirExists) {
                // This directory already exists. No need to create it again.
                console.log("The " + pathName + " directory already exists");
            } else {
                // This directory does not currently exist. Need to create it.
                console.log("The " + pathName + " directory does not already exist");
                
                // Using the file system module's mkdir() method to create this directory,
                // as it does not yet exist.
                fs.mkdir(pathName, function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        // Since there was no error, this directory has now successfully been
                        // created.
                        console.log("New directory " + pathName + " created");
                    }
                });
            }
        });
    });
}

// Returning the checkAll function as the export when this module is required
module.exports = checkAll;