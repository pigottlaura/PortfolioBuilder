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
var databaseModels = require("./custom_modules/databaseModels");
var User = databaseModels.User;


// Specifying the root path of the uploads directories, so that it
// can be prepened to each of the subdirectories below
var mainUploadDirectory = './media_uploads/';

// Creating an array to store all of the directories required for storing
// file uploads, including the main directory (as declared above). Prepending
// each of the subdirectories with the main directory path, so that they will
// appear as a folder hierarchy.
var uploadsDirectories = [
    mainUploadDirectory,
    mainUploadDirectory + "audio",
    mainUploadDirectory + "image",
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
            pathName = mainUploadDirectory + '/image';
        } else if (fileType == "audio") {
            // Setting the pathname so that multer knows where to store audio files
            pathName = mainUploadDirectory + '/audio';
        } else {
            // Setting the pathname so that multer knows where to store all other files
            pathName = mainUploadDirectory + '/other';
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
app.use(express.static(path.join(__dirname, 'media_uploads')));

app.use(session({
    secret: 'sessionSecret',
    resave: false,
    saveUninitialized: false
}));

app.use("/", multerUpload.any());

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
},
    function(accessToken, refreshToken, profile, done) {
        for (var p in profile) {
            console.log(profile[p]);
        }
        User.findOne({ googleId: profile.id }, {}, function(err, users) {
            if (err) {
                console.log("Cannot check if this Google users already exists - " + err);
            } else {
                if (users == null) {
                    
                    console.log(profile.name + " is a new user");
                    var newUser = new User({
                        portfolioURL: profile.emails[0].value.split("@")[0],
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        googleId: profile.id
                    });

                    newUser.save(function(err, newUser) {
                        if (err) {
                            console.log("Index - Could not save new user to the database - " + err);
                        } else {
                            console.log("Index - New user successfully saved to the database");
                        }
                        next();
                    });
                } else {
                    console.log(profile.name + " is an existing user");
                }
            }
        });
    }
));

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });

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
