var mongoose = require("mongoose");

var databaseModels = {
    User: mongoose.model("User", {
        username: {
            type: String,
            required: true,
            index: {
                unique: true
            }
        },
        password: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        portfolioURL: {
            type: String,
            required: true
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
        }
    })
}

module.exports = databaseModels;