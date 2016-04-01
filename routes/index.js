var express = require('express');
var router = express.Router();
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: "Portfolio Builder" });
});

router.post("/checkCredentialsAvailable", function(req, res, next) {
    var credentials = {
        usernameAvailable: true,
        portfolioURLAvailable: true
    };

    User.find({ $or: [{username: req.body.requestedUsername}, {portfolioURL: req.body.requestedPortfolioURL}] }, {}, function(err, users) {
        if (users.length > 0) {
            users.forEach(function(user) {
                if (user.username == req.body.requestedUsername) {
                    console.log("Matched username");
                    credentials.usernameAvailable = false;
                }

                if (user.portfolioURL == req.body.requestedPortfolioURL) {
                    console.log("Matched url");
                    credentials.portfolioURLAvailable = false;
                }
            });
        }
        console.log("Username available = " + credentials.usernameAvailable);
        console.log("URL available = " + credentials.portfolioURLAvailable);
        res.json(credentials);
    });
});


router.post('/createAccount', function(req, res, next) {
    User.findOne({ username: req.body.username }, {}, function(err, users) {
        if (err) {
            console.log("Index - Could not check if this username exists - " + err);
            res.redirect("/");
        } else {
            if (users == null) {
                // This user does not exist so this username is available
                var newUser = new User({
                    username: req.body.username.toLowerCase(),
                    password: req.body.password,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    portfolioURL: req.body.portfolioURL
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
                console.log("Index - This username already exists");
                res.redirect("/");
            }
        }
    });
});

module.exports = router;
