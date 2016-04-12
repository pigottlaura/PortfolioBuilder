// Requiring the mongoose module, so that I can begin setting up templates
// for the documents which will be stored in this database i.e. Users and 
// MediaItems
var mongoose = require("mongoose");

// Creating an object, which contains all of the database models (templates for 
// documents in the database) so that it can be used as the module export, and
// so any route that requires this module can then access these modules directly
// from the object that is returned to them.
var databaseModels = {
    User: mongoose.model("User", {
        username: String,
        password: String,
        googleId: String,
        portfolioURL: String,
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        profilePicture: {
            type: String,
            default: "../images/profilePicture.jpg"
        }, dateJoined: {
            type: Date,
            default: Date.now
        }
    }),
    MediaItem: mongoose.model("MediaItem", {
        file: {
            size: Number,
            path: String,
            filename: String,
            destination: String,
            mimetype: String,
            encoding: String,
            originalname: String,
            fieldname: String
        },
        owner: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        mediaType: {
            type: String,
            required: true
        },
        fileTitle: {
            type: String,
            required: false
        },
        filePath: {
            type: String,
            required: true
        },
    })
}

// Setting the module exports to be equal to the object created above,
// which contains all of the database models (document templates for the
// database), so that they can be shared throughout multiple routes
module.exports = databaseModels;