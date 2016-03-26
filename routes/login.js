var express = require('express');
var router = express.Router();

// This router deals with all get requests for the Admin section of the website
router.get('/', function(req, res, next) {
    if (req.session.username == null) {
        // This user is not yet logged in
        res.render("login", { title: "Login"});
    } else {
        // This user is already logged in
        console.log("Login - This user is already logged in. Redirecting them to the admin panel");
        res.redirect("/admin");
    }
    
});

// This router deals with all post request to the login or admin section of the website
router.post('/', function(req, res, next) {
    console.log("Login - Login request received");
    if(req.body.username.length > 0 && req.body.password.length > 0)
    {
       console.log("Login - username/password present - passing onto authentication");
       next();
    } else {
       console.log("No username/password provided");
       res.render("login", { title: "Login", warning: "Please provide a username and a password" });
    }
});

module.exports = router;