var express = require('express');
var router = express.Router();

var cryptoEncryption = require("../custom_modules/cryptoEncryption");
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;
var Portfolio = databaseModels.Portfolio;

var websiteURL = process.env.WEBSITE_URL || "http://localhost:3000/";


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: "Portfolio Builder" });
});

router.post("/checkCredentialsAvailable", function (req, res, next) {
  var credentials = {
    usernameAvailable: false,
    portfolioURLAvailable: false,
    url: websiteURL
  };

  User.findOne({ username: req.body.requestedUsername }, {}, function (err, user) {
    if (user == null) {
      credentials.usernameAvailable = true;
      credentials.username = req.body.requestedUsername;
    }

    Portfolio.findOne({ portfolioURL: req.body.requestedPortfolioURL }, {}, function (err, portfolio) {
      if (portfolio == null) {
        credentials.portfolioURLAvailable = true;
        credentials.portfolioURL = req.body.requestedPortfolioURL;

        console.log("INDEX - Username available = " + credentials.usernameAvailable);
        console.log("INDEX - URL available = " + credentials.portfolioURLAvailable);
        res.json(credentials);
      }
    });
    
  });
});

router.post("/login", function (req, res, next) {
  User.findOne({ username: req.body.username }, {}, function (err, user) {
    if (err) {
      console.log("INDEX - Could not check if this username exists - " + err);
      res.redirect("/");
    } else {
      if (user == null) {
        console.log("INDEX - This user does not exist");
        res.render("index", { title: "Login", warning: "This username does not exist" });
      } else {
        if (req.body.username.toLowerCase() == user.username && req.body.password == cryptoEncryption.decrypt(user.password)) {
          req.session._userId = user._id;

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

        req.session._userId = newUser._id;

        newUser.save(function (err, newUser) {
          if (err) {
            console.log("INDEX - Could not save new user to the database - " + err);
          } else {
            console.log("INDEX - New user successfully saved to the database");
          }
          res.redirect("/admin");
        });

        var newPortfolio = new Portfolio({
          owner: newUser._id
        });
        newPortfolio.pages.contact.contactDetails.name = newUser.firstName + " " + newUser.lastName;

        newPortfolio.save(function (err, newPortfolio) {
          if (err) {
            console.log("INDEX - Could not save new portfolio to the database - " + err);
          } else {
            console.log("INDEX - New portfolio successfully saved to the database");
          }
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
