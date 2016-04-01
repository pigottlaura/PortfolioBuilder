var express = require('express');
var router = express.Router();
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;

router.get("/", function(req, res, next) {
    // If the current session does not contain a username property, then
    // this user is not yet logged in
    if (req.session.username == null) {
        console.log("Auth - User not yet logged in");
        res.redirect("/login");
    } else {
        // This user's session contains a username, hence they must be a logged
        // in user
        console.log("Auth - This user is already logged in");
        next();
    }

});

router.post("/", function(req, res, next) {
    User.findOne({ username: req.body.username.toLowerCase() }, {}, function(err, users) {
        if (err) {
            console.log("Auth - Could not check if this username exists - " + err);
            res.render("login", { title: "Login", warning: "There was an unexpected error - please try again"});
        } else {
            if(users == null){
                console.log("Auth - This user does not exist");
                res.render("login", { title: "Login", warning: "This username does not exist"});
            } else {
                if (req.body.username.toLowerCase() == users.username && req.body.password == users.password) {
                    req.session.username = req.body.username.toLowerCase();
                    console.log("Auth - correct username/password");
                    res.redirect("/admin");
                } else {
                    console.log("Auth - wrong username/password");
                    res.render("login", { title: "Login", warning: "Wrong username/password" });
                }
            }
        }
    });
});

module.exports = router;