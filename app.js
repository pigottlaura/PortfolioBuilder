var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Requiring Multer (to parse multi-part form data)
var multer = require('multer');

// Requiring Mongoose (to set up the connection to the Mongo database)
var mongoose = require('mongoose');

// Requiring Express-Session (to handle sessions)
var session = require('express-session');

// Requiring MongoStore (to create storage in the database for sessions)
var MongoStore = require('connect-mongo')(session);

// Requiring checkDirectories, so that I can pass the array of directories I need
// for this app to it, and if they don't exist they will be created
var checkDirectories = require('./custom_modules/checkDirectories');

// Requiring databaseConnection, which is the module in which I have set up
// the mongoose connection to the database. The exports of this module
// returns the connection, and so it can now be shared between routes. In this
// file, it will be used to share the connection with the MongoStore (to store
// sessions in the database)
var databaseConnection = require("./custom_modules/database");


// Requiring the databaseModels custom module, which returns and object containing all the 
// models for documents in the database i.e. User, MediaItem and Portfolio.
var databaseModels = require("./custom_modules/databaseModels");
var User = databaseModels.User;


// Specifying the root path of the uploads directories, so that it
// can be prepened to each of the subdirectories below. Checking if
// the application is in the development environment (by checking
// if the NODE_ENV connection string is accessible) or in the Azure
// environment (as the site will be running in a the /bin folder
// and so the public directory will be one level up from the site)
var mainUploadDirectory = process.env.NODE_ENV == "development" ? './public/media_uploads/' : "../public/media_uploads/";

// Creating an array to store all of the directories required for storing
// file uploads, including the main directory (as declared above). Prepending
// each of the subdirectories with the main directory path, so that they will
// appear as a folder hierarchy.
var uploadsDirectories = [
    mainUploadDirectory,
    mainUploadDirectory + "image",
    mainUploadDirectory + "swf",
    mainUploadDirectory + "video",
    mainUploadDirectory + "contactPicture"
];

// Using the custom module I created to check that all of the folders required
// within the uploads directory exist. If they don't, then they will be created.
// Only calling this function when the server starts up, as there should be no 
// reason that this directories would end up being deleted after this point. 
// If I were to check/create these directories each time a file were uploaded, 
// it would significantly increase the time required to store the files. Passing
// the array which contains each of the directories for this file structure
console.log("Checking if the upload directories exist");
checkDirectories(uploadsDirectories);

// Setting up variables to store the four main routes of my app, so that they can be passed to the
// middleware functions below
var routes = require('./routes/index');
var admin = require('./routes/admin');
var authentication = require('./routes/authentication');
var portfolio = require('./routes/portfolio');

var app = express();

// Creating a fileter for Multer, so that only certain file types, uploaded by logged in users,
// will be accepted for upload to the server. All other files will be rejected and will never reach
// the routes of the app
var multerFileFilter = function (req, file, cb) {
    
    // Checking if a user is currently logged in (based on having a _userId on their request object)
    if (req.session._userId == null) {
        console.log("MULTER FILTER - No user is currently logged in. Rejecting this file upload");
        
        // No error, but rejecting this file as their is no user currently logged in
        cb(null, false);
    } else {
        console.log("MULTER FILTER - This user is currently logged in. Accepting this file upload");

        // Getting the media type of this file by splitting the mimetype (e.g. image) at
        // the "/" and then taking the first half of this new array of strings i.e. image.
        // Storing the second half of this string, i.e. file type (e.g. jpg)
        file.mediaType = file.mimetype.split("/")[0];
        file.fileType = file.mimetype.split("/")[1];
        
        // If the file type is "x-shockwave-flash" then just storing it as a "swf"
        if (file.fileType == "x-shockwave-flash") {
            
            // Setting both the mediaType and fileType to be equal to "swf"(the original mimetype will
            // still exist in the file object)
            file.mediaType = file.fileType = "swf";
        }

        // Logging out the file type to the console (testing purposes)
        console.log("MULTER FILTER - This file is a " + file.mediaType + " file. More specifically, a " + file.fileType + " file.");

        if (file.mediaType == "image" || file.mediaType == "video" || file.fileType == "swf") {
            console.log("MULTER FILTER - This is a supported filetype for this application - accepting this file");
            
            // Accepting these files. There is a user logged in, and these are files the portfolios can display
            cb(null, true);
        } else {
            console.log("MULTER FILTER This is not a supported filetype for this application - rejecting this file");
            
            // Rejecting these files. These are not files that the portfolio is able to display
            cb(null, false);
        }
    }
}

// Creating diskStorage options for the multer middleware, to determine the destination and filename
// of each file before it is stored on the server
var multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        
        // Creating a pathName variable, to store the path to the directory that this file
        // should be stored in (this will be decided based on the filetype). This variable
        // will then be passed to the destination function's callback, to pass the required
        // pathName back so that multer knows where to store the file
        var pathName;


        // Deciding which folder to store the file in, depending on it's file type
        if (file.fieldname == "contactPictureFile") {
            pathName = mainUploadDirectory + "/contactPicture"
        } else if (file.fileType == "swf") {
            // Setting the pathname so that multer knows where to store swf files
            pathName = mainUploadDirectory + '/swf';
        } else {
            // Setting the pathname so that multer knows where to store all other video and image files
            pathName = mainUploadDirectory + "/" + file.mediaType;
        }

        console.log("MULTER STORAGE - " + pathName);

        // Increasing the time out for the request, as file uploads take a long time on Azure - not really
        // improving the issue for videos through
        req.setTimeout(30000, function (err) {
            console.log("MULTER - Server timed out " + err);
        });

        // Using the destination function's callback to pass the required pathname back
        // so that multer knows where to store this file
        cb(null, pathName);
    },
    filename: function (req, file, cb) {
        
        // Setting the filename of this file to be equal to the current data stamp plus it's original filename
        // i.e. so it will have a unique name on the server. Returning this name to the callback
        cb(null, Date.now() + "_" + file.originalname);
    }
});

// Setting up Multer, passing in the file fileter and disk storage options, which will both be called on every
// file that gets uploaded to the server (even if they are uploaded in the one request, they will each be
// dealt with seperatley)
var multerUpload = multer({
    fileFilter: multerFileFilter,
    storage: multerStorage
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Creating a new instance of the Mongo, setting it's mongoose connection to share the 
// same connection to the database as the rest of the app (as exported from the database module)
// module)
var mongoStore = new MongoStore({
    mongooseConnection: databaseConnection
});

// Setting the app to use sessions for all requests to the server. Setting resave to false (so if there is no change to 
// a session object, it won't have to be resaved). Not saving uninitialised sessions i.e. ones that have had no
// new properties added to them. Setting the store to equal the new MongoStore created above. Finally, if a session
// is unset (destroyed) then removing it from the database aswell
app.use(session({
    secret: 'sessionSecret',
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    unset: "destroy"
}));

app.use("/", multerUpload.any());


// Specifying the routes for each of the paths specified.

// This middleware deals with general request such as the home page, logging in /out etc
app.use('/', routes);

// This middleware deals with users wanting to see other users portfolios (no login required)
app.use("/portfolio", portfolio);

// Passing all requests for admin, to ensure that user which is not logged in
// can not get into the admin secion.
app.use("/admin", authentication);

// If a request has made it through the above, then the user must be logged in, and can
// be granted access to the admin section
app.use('/admin', admin);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
