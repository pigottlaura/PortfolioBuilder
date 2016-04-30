var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Additional Modules
var multer = require('multer');
var mongoose = require('mongoose');
var session = require('express-session');

// Custom Modules
var checkDirectories = require('./custom_modules/checkDirectories');
var db = require("./custom_modules/database");

var databaseModels = require("./custom_modules/databaseModels");
var User = databaseModels.User;
var googlePassport = require("./custom_modules/googlePassport");


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
    mainUploadDirectory + "audio",
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

var routes = require('./routes/index');
var admin = require('./routes/admin');
var authentication = require('./routes/authentication');
var portfolio = require('./routes/portfolio');

var app = express();

var multerFileFilter = function(req, file, cb) {
    if (req.session._userId == null) {
        console.log("MULTER FILTER - No user is currently logged in. Rejecting this file upload");
        cb(null, false);
    } else {
        console.log("MULTER FILTER - This user is currently logged in. Accepting this file upload");

        // Getting the media type of this file by splitting the mimetype (e.g. image) at
        // the "/" and then taking the first half of this new array of strings i.e. image.
        // Storing the second half of this string, i.e. file type (e.g. jpg)
        file.mediaType = file.mimetype.split("/")[0];
        file.fileType = file.mimetype.split("/")[1] == "x-shockwave-flash" ? "swf" : file.mimetype.split("/")[1];

        // Logging out the file type to the console (testing purposes)
        console.log("MULTER FILTER - This file is a " + file.mediaType + " file. More specifically, a " + file.fileType + " file.");

        if (file.mediaType == "image" || file.mediaType == "audio" || file.mediaType == "video" || file.fileType == "swf") {
            console.log("MULTER FILTER - This is a supported filetype for this application - accepting this file");
            cb(null, true);
        } else {
            console.log("MULTER FILTER This is not a supported filetype for this application - rejecting this file");
            cb(null, false);
        }
    }
}

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
            // Setting the pathname so that multer knows where to store all other video, audio and image files
            pathName = mainUploadDirectory + "/" + file.mediaType;
        }

        console.log("MULTER STORAGE - " + pathName);
        
        // Using the destination function's callback to pass the required pathname back
        // so that multer knows where to store this file
        cb(null, pathName);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

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
app.use(session({
    secret: 'sessionSecret',
    resave: false,
    saveUninitialized: false
}));
app.use(googlePassport.initialize());
app.use(googlePassport.session());

googlePassport.serializeUser(function (user, done) {
    console.log("SERIALIZING USER");
    done(null, user);
});

googlePassport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        console.log("DESERIALIZING USER");
        done(err, user);
    });
});

app.use("/", multerUpload.any());


app.use('/', routes);
app.use("/portfolio", portfolio);

// Passing all requests for admin, to ensure that user which is not logged in
// can not get into the admin secion.
// Passing all requests for authentication (which will only be called in Google callback
// functions, when a user is logging in with their account)
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
