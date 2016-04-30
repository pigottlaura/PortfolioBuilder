var express = require('express');
var router = express.Router();
var googlePassport = require("../custom_modules/googlePassport");

var cryptoEncryption = require("../custom_modules/cryptoEncryption");
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;

// Catching all request to the admin panel (GET, POST etc). Having to specify the main
// admin route, as well as routes that begin with admin, as up until now any requests
// to /admin/somethingelse were slipping through the router without ever being checked
// for authentication in this route. I would prefer to specify "*" as the route, but this
// would mean all google authentication requests, as well as errors (such as 404) would be
// caught in here aswell.
router.all(["/admin", "/admin/*"], function (req, res, next) {
    // If the current session does not contain a username property, then
    // this user is not yet logged in
    if (req.session._userId == null) {
        console.log("AUTH - User not yet logged in");
        res.redirect("/");
    } else {
        // This user's session contains a username, hence they must be a logged
        // in user
        console.log("AUTH - This user is already logged in");
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
        req.session._userId = req.user._id;
        console.log(req.session._userId);
        res.redirect('/admin');
    }
);

module.exports = router;