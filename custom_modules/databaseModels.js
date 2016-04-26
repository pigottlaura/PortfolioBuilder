// Requiring the mongoose module, so that I can begin setting up templates
// for the documents which will be stored in this database i.e. Users and 
// MediaItems
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserModel = mongoose.model("User", {
    username: String,
    password: String,
    googleId: String,
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
});

var PortfolioModel = mongoose.model("Portfolio", {
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    portfolioURL: String,
    pages: {
        home: {
            mediaItems: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'MediaItem'
                }
            ]
        },
        contact: {
            picture: String,
            contactDetails: {
                name: String,
                email: String,
                phone: Number
            }
        }
    }
});

var MediaItemSchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
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
    indexPosition: {
        type: Number,
        default: 0
    }
});

MediaItemSchema.post('save', function (mediaItem) {
    var mediaItemId = mediaItem._id;
    
    PortfolioModel.findOne({ owner: this.owner }, {}, function (err, portfolio) {
        portfolio.pages.home.mediaItems.push(mediaItemId);
        portfolio.save(function (err) {
            if(err){
                console.log("MODEL - could not add this media item to the users portfolio");
            } else {
                console.log("MODEL - successfully saved media item to the users portfolio")
            }
        });
    });
});

MediaItemSchema.pre('remove', function (next) {
    var _deleteId = this._id;

    PortfolioModel.findOne({ owner: this.owner }, {}, function (err, portfolio) {
        for (var i = 0; i < portfolio.pages.home.mediaItems.length; i++) {
            if (portfolio.pages.home.mediaItems[i].equals(_deleteId)) {
                portfolio.pages.home.mediaItems.splice(i, 1);
                portfolio.save(function (err) {
                    if (err) {
                        console.log("MODELS - could not remove media item from portfolio - " + err);
                    } else {
                        console.log("MODELS - Media item removed from portfolio");
                    }
                });
            }
        }
        next();
    });
});

var MediaItemModel = mongoose.model("MediaItem", MediaItemSchema);

// Creating an object, which contains all of the database models (templates for 
// documents in the database) so that it can be used as the module export, and
// so any route that requires this module can then access these modules directly
// from the object that is returned to them.
var databaseModels = {
    User: UserModel,
    MediaItem: MediaItemModel,
    Portfolio: PortfolioModel
}

// Setting the module exports to be equal to the object created above,
// which contains all of the database models (document templates for the
// database), so that they can be shared throughout multiple routes
module.exports = databaseModels;