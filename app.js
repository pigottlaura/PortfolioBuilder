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
var mongoose = require("./custom_modules/database");

// Specifying the root path of the uploads directories, so that it
// can be prepened to each of the subdirectories below
var mainUploadDirectory = './file_uploads/';

// Creating an array to store all of the directories required for storing
// file uploads, including the main directory (as declared above). Prepending
// each of the subdirectories with the main directory path, so that they will
// appear as a folder hierarchy.
var uploadsDirectories = [
    mainUploadDirectory,
    mainUploadDirectory + "audio",
    mainUploadDirectory + "images",
    mainUploadDirectory + "other"
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
var login = require('./routes/login');
var authentication = require('./routes/authentication');
var portfolio = require('./routes/portfolio');

var app = express();

var multerStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Getting the file type of this file by splitting the mimetype (e.g. image/jpg) at
        // the "/" and then taking the first half of this new array of strings i.e. image
        var fileType = file.mimetype.split("/")[0];

        // Logging out the file type to the console (testing purposes)
        console.log("This file is an " + fileType + " file");

        // Creating a pathName variable, to store the path to the directory that this file
        // should be stored in (this will be decided based on the filetype). This variable
        // will then be passed to the destination function's callback, to pass the required
        // pathName back so that multer knows where to store the file
        var pathName;

        // Deciding which folder to store the file in, depending on it's file type
        if (fileType == "image") {
            // Setting the pathname so that multer knows where to store image files
            pathName = './file_uploads/images';
        } else if (fileType == "audio") {
            // Setting the pathname so that multer knows where to store audio files
            pathName = './file_uploads/audio';
        } else {
            // Setting the pathname so that multer knows where to store all other files
            pathName = './file_uploads/other';
        }

        req.fileType = fileType;
        
        // Using the destination function's callback to pass the required pathname back
        // so that multer knows where to store this file
        cb(null, pathName);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

var multerUpload = multer({
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

app.use("/", multerUpload.any());

app.use('/', routes);
app.use("/login", login);
app.use(["/createAccount", "/login", "/admin"], authentication);
app.use('/admin', admin);
app.use("/portfolio", portfolio);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
