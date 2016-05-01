var express = require('express');
var router = express.Router();

// Requiring the custom encryption module, which returns and object containing two
// methods - one for encrytion, one for decryption. This will be used to store passwords
// in the database, and later test them against a user's login credentials
var cryptoEncryption = require("../custom_modules/cryptoEncryption");

// Requiring the databaseModels custom module, which returns and object containing all the 
// models for documents inthe database i.e. User, MediaItem and Portfolio. Storing the User
// and Portfolio models in their own variables so they can be accessed in this module i.e.
// to query, add, remove and update documents in their relevant collections of the database
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;
var Portfolio = databaseModels.Portfolio;

// Determining where the site is currently running, so I can provide the user will a full link to 
// their portfolio. On Azure, the web address will be stored in the WEBSITE_URL environment variable,
// otherwise the site is running locally
var websiteURL = process.env.WEBSITE_URL || "http://localhost:3000/";

// All requests to get the home page
router.get('/', function (req, res, next) {

  // Checking if this user is already logged in i.e. do they have a _userId property on their session
  if (req.session._userId == null) {

    // This user is not yet logged in, rendering the home page so they can login/create an account
    console.log("INDEX - this user is not yet logged in");
    res.render('index', { title: "Portfolio Builder", websiteURL: websiteURL + "portfolio/" });
  } else {

    // This user is already logged in, redirecting them back to the admin panel
    console.log("INDEX - this user is already logged in");
    res.redirect("/admin");
  }
});

// All AJAX POST requests to check if user credentials are available i.e. before a user creates a new
// account, or if they want to edit their current portfolio URL
router.post("/checkCredentialsAvailable", function (req, res, next) {

  // Creating an object that will be returned in the response to the client. Defaulting the 
  // credentials to be unavailable (unless proven otherwise by the below query to the Users and
  // Portfolio models). Also passing the websiteURL (as defined above) so that the new portfolio
  // URL can also have a full path (so the user can share it with others)
  var credentials = {
    usernameAvailable: false,
    portfolioURLAvailable: false,
    url: websiteURL + "portfolio/"
  };

  // Querying the User model, to see if there are any users with the requested username
  User.findOne({ username: req.body.requestedUsername }, {}, function (err, user) {
    if (user == null) {
      // Since no users were returned from the query, this username must be available. Setting the 
      // availablility of this property to be true, and passing back the requested username to the client
      // (to confirm this was the username that was checked)
      credentials.usernameAvailable = true;
      credentials.username = req.body.requestedUsername;
    }

    // Regardless of whether or not the username is available, querying the Portfolio model to see if any
    // portfolio currently exists with the requested portfolio URL
    Portfolio.findOne({ portfolioURL: req.body.requestedPortfolioURL }, {}, function (err, portfolio) {
      if (portfolio == null) {
        // Since no portfolios were returned from the query, this URL must be available. Setting the 
        // availablility of this property to be true, and passing back the requested URL to the client
        // (to confirm this was the portfolio URL that was checked)
        credentials.portfolioURLAvailable = true;
        credentials.portfolioURL = req.body.requestedPortfolioURL;
      }

      console.log("INDEX - Username available = " + credentials.usernameAvailable);
      console.log("INDEX - URL available = " + credentials.portfolioURLAvailable);

      // Returning the credentials object to the client in the response object, stringifying the database
      // through the JSON response method
      res.json(credentials);
    });

  });
});

// All requests to log in to the server (excluding Google OAuth logins)
router.post("/login", function (req, res, next) {

  // Ensuring a username and password have both been provided. Also validating this client-side.
  if (req.body.loginUsername.length > 0 && req.body.loginPassword.length > 0) {

    // Querying the User model to find a user with this username
    User.findOne({ username: req.body.loginUsername }, {}, function (err, user) {
      if (err) {
        console.log("INDEX - Could not check if this username exists - " + err);
        res.redirect("/");
      } else {
        if (user == null) {
          console.log("INDEX - This user does not exist");
          res.render("index", { title: "Login", warning: "This username does not exist" });
        } else {

          // Comparing the stored username and password with the username and password passed in with the login form.
          // Using the decrypt() method from the cryptoEncryption module, to temporarily decrypt the password to see if
          // it matches with the password passed in
          if (req.body.loginUsername.toLowerCase() == user.username && req.body.loginPassword == cryptoEncryption.decrypt(user.password)) {

            console.log("INDEX - correct username/password");

            // These login details match this user. Storing the ObjectId of the User document on the session, so that
            // it can be accessed later for authentication as well as querying other database models
            req.session._userId = user._id;

            // Redirecting the user to the admin route. They will first have to pass through the authentication route to 
            // ensure they are logged in (as does every request to the "/admin" route)            
            res.redirect("/admin");
          } else {

            console.log("INDEX - wrong username/password");

            // These login details are incorrect. Rendering the home page for the user, passing back a warning that these
            // details were incorrect
            res.render("index", { title: "Portfolio Builder", warning: "Wrong username/password" });
          }

        }
      }
    });
  } else {

    // All required fields were not supplied. Validating this server side as well. Redirecting user back to home page so
    // they can attempt to login again.
    console.log("Not enough login details provided");
    res.redirect("/");
  }
});

// All request to create an account (excluding Google OAuth logins)
router.post('/createAccount', function (req, res, next) {

  // Confirming that all the required fields have been supplied. Validating this server side aswell
  if (req.body.username.length > 0 && req.body.password.length > 0 && req.body.confirmPassword.length > 0 && req.body.firstName.length > 0 && req.body.lastName.length > 0 && req.body.portfolioURL.length > 0) {

    // Confirming that the password and confirm password fields match. Validating this server side aswell
    if (req.body.password == req.body.confirmPassword) {

      // Quering the User model to check if there are any users currently with this name. Validating this server side aswell
      User.findOne({ username: req.body.username }, {}, function (err, users) {
        if (err) {
          console.log("INDEX - Could not check if this username exists - " + err);
          res.redirect("/");
        } else {
          if (users == null) {

            // Since the results were empty, this user does not exist so this username is available

            // Creating a new User document based on the User model. Encrpting the users password
            // before it is stored tot he database
            var newUser = new User({
              username: req.body.username.toLowerCase(),
              password: cryptoEncryption.encrypt(req.body.password),
              firstName: req.body.firstName,
              lastName: req.body.lastName
            });

            // Creating a new Portfolio document based on the Portfolio model. Setting the owner property
            // to equal the id of the new user above. In the schema of the Portfolio model, this field
            // references the User model by default
            var newPortfolio = new Portfolio({
              owner: newUser._id,
              portfolioURL: req.body.portfolioURL,
              pages: {
                contact: {
                  contactDetails: {
                    name: newUser.firstName + " " + newUser.lastName
                  }
                }
              }
            });

            // Saving the new user to the database
            newUser.save(function (err, newUser) {
              if (err) {
                console.log("INDEX - Could not save new user to the database - " + err);
                res.redirect("/");
              } else {
                console.log("INDEX - New user successfully saved to the database");

                // Only saving the new portfolio once the user has successfully been saved, as if 
                // there was an issue saving the user, then there would be no need for a portfolio
                newPortfolio.save(function (err, newPortfolio) {
                  if (err) {
                    console.log("INDEX - Could not save new portfolio to the database - " + err);
                    res.redirect("/");
                  } else {
                    console.log("INDEX - New portfolio successfully saved to the database");

                    // These login details match this user. Storing the ObjectId of the User document on the session, so that
                    // it can be accessed later for authentication as well as querying other database models
                    req.session._userId = newUser._id;
                    
                    // Redirecting the user to the admin route. They will first have to pass through the authentication route to 
                    // ensure they are logged in (as does every request to the "/admin" route)   
                    res.redirect("/admin");
                  }
                });
              }
            });

          } else {
            console.log("INDEX - This username already exists");
            res.redirect("/");
          }
        }
      });
    } else {
      console.log("INDEX - These passwords do not match");
      res.redirect("/");
    }
  } else {
    console.log("INDEX - not enough details supplied to create an account");
    res.redirect("/");
  }
});

// All request to log out of the app
router.get("/logout", function (req, res, next) {
  
  // Destroying the user's current session object and returning them to the home page. When a session object
  // is destroyed, it is also removed from the MongoStore sessions collection of the database (as setup in 
  // the options for express-session in app.js)
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

// Catching all GET requests for the following routes, as they only accept POST requests. Redirecting
// users that try to access these back to the home page
router.get(["/login", "/createAccount", "/checkCredentialsAvailable"], function (req, res, next) {
  res.redirect("/");
});

module.exports = router;
