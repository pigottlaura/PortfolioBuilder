// Requiring the mongoose module, so that I can begin setting up templates
// for the documents which will be stored in this database i.e. Users, Portfolios
// and MediaItems
var mongoose = require("mongoose");

// Requiring the Schema constructor from the mongoose object, so that I can create
// custom schemas for each of the models in the database. Originally I declared these
// schemas withing the .model() method, but I found that by creating them seperately first,
// I could then add middleware to them, which could be shared with all instances of that
// schema i.e. using a .post() middleware on the MediaItemSchema, so that every time a media
// item is saved to the database, it's id will also be added to the owners portfolio document
var Schema = mongoose.Schema;

// Creating the users schema, from which all users documents will be based upon. Not all users
// will have all of these properties (i.e. google logins will not result in a username and password,
// but in a google id).
var UserSchema = new Schema({
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
    },
    dateJoined: {
        type: Date,
        default: Date.now
    }
});

// Creating the portfolio schema, from which all portfolio documents will be based upon. The purpose of 
// this schema is to provide a link between users and media items. The id of the owner, and any media
// items they have, will be stored within instances of this document as ObjectId's. When retrieving a portfolio
// from the database, I call the .populate() method of mongoose as part of the query, so that all object id's
// which reference other documents will also be returned in the result (much like an SQL table JOIN)
var PortfolioSchema = new Schema({
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
            ],
            categories: [String]
        },
        contact: {
            picture: String,
            info: String,
            contactDetails: {
                name: String,
                email: String,
                phone: String
            }
        }
    }
});

// Adding a function to the methods object of the Portfolio schema, so that all instances
// of models of this schema can call the sortMediaItems method upon themselves, and hae
PortfolioSchema.methods.sortMediaItems = function (cb) {
    this.pages.home.mediaItems.sort(function (a, b) {
        var returnVal = 0;
        if (a.indexPosition > b.indexPosition) {
            returnVal = 1;
        } else if (a.indexPosition < b.indexPosition) {
            returnVal = -1;
        } else {
            if (a.uploadedAt > b.uploadedAt) {
                returnVal = -1;
            } else if (a.uploadedAt < b.uploadedAt) {
                returnVal = 1;
            } else {
                returnVal = 0;
            }
        }
        return returnVal;
    });
    cb();
};

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
    },
    category: {
        type: String,
        default: "none"
    }
});

MediaItemSchema.post('save', function (mediaItem) {
    var mediaItemId = mediaItem._id;

    PortfolioModel.findOne({ owner: this.owner }, {}, function (err, portfolio) {
        portfolio.pages.home.mediaItems.push(mediaItemId);
        portfolio.save(function (err) {
            if (err) {
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

var UserModel = mongoose.model("User", UserSchema);
var PortfolioModel = mongoose.model("Portfolio", PortfolioSchema);
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