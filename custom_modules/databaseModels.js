var mongoose = require("mongoose");

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
        fileType: {
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

module.exports = databaseModels;