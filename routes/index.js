var express = require('express');
var router = express.Router();

var cryptoEncryption = require("../custom_modules/cryptoEncryption");
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: "Portfolio Builder" });
});

router.post("/checkCredentialsAvailable", function (req, res, next) {
  var credentials = {
    usernameAvailable: true,
    portfolioURLAvailable: true
  };
  console.log(req.body.requestedPortfolioURL);

  User.find({ $or: [{ username: req.body.requestedUsername }, { portfolioURL: req.body.requestedPortfolioURL }] }, {}, function (err, users) {
    if (users.length > 0) {
      users.forEach(function (user) {
        if (user.username == req.body.requestedUsername) {
          console.log("INDEX - Matched username");
          credentials.usernameAvailable = false;
        } else {
          credentials.username = req.body.requestedUsername;
        }

        if (user.portfolioURL == req.body.requestedPortfolioURL) {
          console.log("INDEX - Matched url");
          credentials.portfolioURLAvailable = false;
        } else {
          credentials.portfolioURL = req.body.requestedPortfolioURL;
        }
      });
    }
    console.log("INDEX - Username available = " + credentials.usernameAvailable);
    console.log("INDEX - URL available = " + credentials.portfolioURLAvailable);
    res.json(credentials);
  });
});

router.post("/login", function (req, res, next) {
    User.findOne({ username: req.body.username }, {}, function (err, users) {
        if (err) {
            console.log("INDEX - Could not check if this username exists - " + err);
            res.render("login", { title: "Login", warning: "There was an unexpected error - please try again" });
        } else {
            if (users == null) {
                console.log("INDEX - This user does not exist");
                res.render("login", { title: "Login", warning: "This username does not exist" });
            } else {
                if (req.body.username.toLowerCase() == users.username && req.body.password == cryptoEncryption.decrypt(users.password)) {
                    req.session.username = req.body.username.toLowerCase();
                    req.session.profilePicture = users.profilePicture;
                    req.session.firstName = users.firstName;
                    req.session.portfolioURL = users.portfolioURL;
                    console.log("INDEX - correct username/password");
                    res.redirect("/admin");
                } else {
                    console.log("INDEX - wrong username/password");
                    res.render("index", { title: "Portfolio Builder", warning: "Wrong username/password" });
                }

            }
        }
    });
});

router.post('/createAccount', function (req, res, next) {
  User.findOne({ username: req.body.username }, {}, function (err, users) {
    if (err) {
      console.log("INDEX - Could not check if this username exists - " + err);
      res.redirect("/");
    } else {
      if (users == null) {
        // This user does not exist so this username is available
        var newUser = new User({
          username: req.body.username.toLowerCase(),
          password: cryptoEncryption.encrypt(req.body.password),
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          portfolioURL: req.body.portfolioURL
        });

        req.session.username = newUser.username;
        req.session.profilePicture = newUser.profilePicture;
        req.session.firstName = newUser.firstName;
        req.session.portfolioURL = newUser.portfolioURL;

        newUser.save(function (err, newUser) {
          if (err) {
            console.log("INDEX - Could not save new user to the database - " + err);
          } else {
            console.log("INDEX - New user successfully saved to the database");
          }
          res.redirect("/admin");
        });
      } else {
        console.log("INDEX - This username already exists");
        res.redirect("/");
      }
    }
  });
});

router.get("/logout", function (req, res, next) {
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

module.exports = router;
