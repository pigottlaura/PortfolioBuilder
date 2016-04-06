// Accessing the File System Module and storing it so I can
// access the methods of it later
var fs = require("fs");

// Creating the checkDirectories funciton, which will server as the export for this module
// so that when this module is required, it returns a funciton,which accepts one parametre,
// the array of directorys that should be checked/created by this function. 
// The variable containing this module can be called at any time to check if a directory (or
// series of directories) still exist on the server, without having to specify each one individually
// and creates them if they don't exist
var checkDirectories = function(directories) { 
    
    // Looping through each of the required directories, as passed to the checkAll function,
    // to check if they already exist, and if they don't, then creating them. Passing each 
    // directory into the function as "pathName". Also passing the index, although not utilising 
    // it currently in this loop. The reason for using the forEach() method is that it acts asynchronously,
    // but in an incremental way i.e. it does not hold up the server, but it does process each directory
    // in the order they are passed in, which is vital as the main directory must be created before the
    // sub directories can be created within it, or it will return an error.
    directories.forEach(function(pathName, index) {
        
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
                        // There was an error creating this directory
                        console.log("Could not create the " + pathName + " directory - " + err);
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

// Returning the checkDirectories function as the export when this module is required
module.exports = checkDirectories;