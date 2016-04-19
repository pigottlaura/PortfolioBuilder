var express = require('express');
var router = express.Router();
var googlePassport = require("../custom_modules/googlePassport");

var cryptoEncryption = require("../custom_modules/cryptoEncryption");
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;

router.get("/admin", function (req, res, next) {
    // If the current session does not contain a username property, then
    // this user is not yet logged in
    if (req.session.username == null) {
        console.log("Auth - User not yet logged in");
        res.redirect("/");
    } else {
        // This user's session contains a username, hence they must be a logged
        // in user
        console.log("Auth - This user is already logged in");
        next();
    }
});

router.get('/authentication/google', googlePassport.authenticate(
    'google',
    {
        scope: ['https://www.googleapis.com/auth/userinfo.email']
    }
));

router.get('/authentication/google/callback', googlePassport.authenticate(
    'google',
    {
        failureRedirect: '/'
    }),
    function (req, res, next) {
        req.session.username = req.user.googleId;
        req.session.profilePicture = req.session.passport.user.profilePicture;
        req.session.firstName = req.session.passport.user.firstName;
        req.session.portfolioURL = req.session.passport.user.portfolioURL;
        console.log(req.session.username);
        res.redirect('/admin');
    });

module.exports = router;