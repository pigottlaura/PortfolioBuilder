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
// of models of this schema can call the sortMediaItems method upon themselves, and have the
// contents of their media items sorted first by indexPosition, and then by the date/time they
// were uploaded (i.e. so that the specified order of the owner is reflected, and newer items 
// appear first by default)
PortfolioSchema.methods.sortMediaItems = function (cb) {

    // Calling the JS sort() method on the media items of the portfolio document which called the
    // method. Passing in a custom sort function, which takes in a and b i.e. will take in two
    // media items at a time, to determine which way to move them in the array (based on the result
    // returned)
    this.pages.home.mediaItems.sort(function (a, b) {
        // Creating a temporary variable to store the value that will be returned from this method.
        // This will either be 0 (no change), -1 (move back) or 1 (move forward)
        var returnVal = 0;

        if (a.indexPosition > b.indexPosition) {
            // If the indexPostion of the first media item, is greater than the index position of the second
            // media item, then the first media item needs to move forward
            returnVal = 1;
        } else if (a.indexPosition < b.indexPosition) {

            // Else if the index position of the first media item is less than the index position of the second
            // media item, then the first media item needs to move backward
            returnVal = -1;
        } else {
            // Otherwise, these two media items have the same index position, and so we will need to look at their
            // upload dates to decided which (if any) way they need to be sorted. NOTE - It would not be uncommon
            // for multiple media items to have the same index position, but it would usually only be "0", as when
            // media items are uploaded, this is their default, and if the user doesn't sort the media items between
            // uploads, then there may be multiple items with the same index.

            if (a.uploadedAt > b.uploadedAt) {

                // If the upload date of the first item is greater than the upload date of the second item, then the first
                // item is newer and hence should be moved backward
                returnVal = -1;
            } else if (a.uploadedAt < b.uploadedAt) {

                // Else if the upload date of the first item is less than the upload date of the second item, then the second
                // item is newer, and the first one needs to move forward
                returnVal = 1;
            }
        }

        // Returing the result of this method, so that the relevant media items can be sorted accordingly
        return returnVal;
    });

    // Once the sorting has completed, calling the callback passed in earlier, to notify the route that this
    // process has completed (no need to pass back any data, as it was the array within the database which was
    // sorted)
    cb();
};


// Creating the media item schema, from which all media item documents will be based upon. Documents based on the
// model of this schema will contain all of the properties listed below. Again, referencing the owner of this media
// item by their ObjectId, so that if I ever need to get information on them, I can use .populate() on the query to
// the media items collection, to return the owner document aswell (much like an SQL table JOIN) 
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

// Adding middleware to the media item schema, so that all instances of the models created from this schema
// will inherit these. Immediatley after a media item is saved to the database, this middleware will be envoked,
// so as to ensure it's ID is also added to the portfolio of the owner which uploaded it. This middleware takes in 
// no req, res or next parameters, as it occurs after the event has occurred.
MediaItemSchema.post('save', function (mediaItem) {

    // Finding the portfolio document which belongs to the user that uploaded this media item, by accessing
    // it's owner property.
    PortfolioModel.findOne({ owner: this.owner }, {}, function (err, portfolio) {
        if (err) {
            console.log("MODELS - Could not find the portfolio of this user");
        } else {
            // Adding the id of this media item to the media items array of this users portfolio
            portfolio.pages.home.mediaItems.push(mediaItem._id);

            // Resaving this portfolio to the database, with it's updated media items array
            portfolio.save(function (err) {
                if (err) {
                    console.log("MODEL - could not add this media item to the users portfolio");
                } else {
                    console.log("MODEL - successfully saved media item to the users portfolio")
                }
            });
        }
    });
});

// Adding middleware to the media item schema, so that all instances of the models created from this schema
// will inherit these. This method occurs just before a media items is removed from the database. The purpose
// of this is that I want to remove the id of this media item from the array of media items in the portfolio, so
// that the next time the page is loaded, the server does not look for this media item
MediaItemSchema.pre('remove', function (next) {

    // Finding the portfolio document which belongs to the user that uploaded this media item, by accessing
    // it's owner property.
    PortfolioModel.findOne({ owner: this.owner }, {}, function (err, portfolio) {
        
        // Looping through all of the media items of this owner's portfolio, to find the one that was just deleted
        for (var i = 0; i < portfolio.pages.home.mediaItems.length; i++) {
            
            // Checking if the current media item id is equal to the id of the media item that is about to be 
            // removed from the database
            if (portfolio.pages.home.mediaItems[i].equals(this._id)) {
                
                // Found the id of the media item that is being deleted. Removing it from the mediaItems array
                // of the portfolio by splicing it at it's index and overwritting one
                portfolio.pages.home.mediaItems.splice(i, 1);
                
                // Resaving this portfolio to the database, with it's updated media items array
                portfolio.save(function (err) {
                    if (err) {
                        console.log("MODELS - could not remove media item from portfolio - " + err);
                    } else {
                        console.log("MODELS - Media item removed from portfolio");
                    }
                });
            }
        }
        
        // Calling the next() method of the middleware, as passed in above, so that the router
        // can continue dealing with the request in other routes
        next();
    });
});

// Generating models for each of the schemas created above
var UserModel = mongoose.model("User", UserSchema);
var PortfolioModel = mongoose.model("Portfolio", PortfolioSchema);
var MediaItemModel = mongoose.model("MediaItem", MediaItemSchema);

// Creating an object, which contains all of the database models (templates for 
// documents in the database) so that it can be used as the module export, and
// so any route that requires this module can then access these modules directly
// from the object that is returned to them. These models can then be used to generate
// new documents instances, or to query the relevant collections to add, update, remove 
// and view the data within them.
var databaseModels = {
    User: UserModel,
    MediaItem: MediaItemModel,
    Portfolio: PortfolioModel
}

// Setting the module exports to be equal to the object created above,
// which contains all of the database models (document templates for the
// database), so that they can be shared throughout multiple routes
module.exports = databaseModels;