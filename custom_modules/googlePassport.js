// Requiring my custom module (databaseModels) which returns an object which
// contains all of the models (document templates) for the database, so that
// I can then access the relevant models within this module
var databaseModels = require("../custom_modules/databaseModels");

// Accessing the User and Portfolio models, from the custom databaseModels module above, 
// so that I can use them to query, add, update and remove documents from their collections
// within the MongoDB database
var User = databaseModels.User;
var Portfolio = databaseModels.Portfolio;

// Requiring the passport module, so that I can set up passport middleware, including
// the Google OAuth2 one below, to allow for alternative methods of creating/logging in
// to accounts on this app
var passport = require('passport');

// Accessing the OAuth2Strategy object from the passport-google-oath exports object,
// so that I can set up Google authorisation functionality, so that users can login/create
// an account on this app using their Google account.
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Setting up the credentials for requesting authorisation from users Google accounts for
// this app. Passing in a new Google strategy, which contains the client ID and client
// secret keys I have generated on my Google developer console, so that this app will
// be recognises, and authorised to make these requests (storing this values in environment
// variable in my .vscode/launch.json file, as well as in environment variables on the Azure
// server, for security purposes). Specifying the callback URL i.e. where the user should
// be redirected to once they have authorised this app to access our account. This URL will
// send the user into the authentication route of this app, so that they can be authorised
// to access the admin section in the same way as all other users for the app (although their
// User document will have slightly different properties, as they will have a googleID etc)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/admin/authentication/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        // Setting up the callback function for when a user returns from authorising the app through Google

        // Checking to see if this user already exists i.e. if they have already created an account
        // on this app using this Google account        
        User.findOne({ googleId: profile.id }, {}, function (err, user) {
            if (err) {
                console.log("GOOGLE - Cannot check if this Google users already exists - " + err);

                // Returning the error to the function(as specified in the passport API)
                return done(err);
            } else {
                // Checking if any users were returned form this query i.e. if the user already exists
                if (user == null) {
                    console.log("GOOGLE - " + profile.name + " is a new user");

                    // Creating a new user document, based on the user model (sourced from the exports
                    // of the databaseModels module)
                    var newUser = new User({
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        googleId: profile.id,
                        profilePicture: profile._json.image.url
                    });

                    // Saving the new user to the database
                    newUser.save(function (err, newUser) {
                        if (err) {
                            console.log("GOOGLE - Could not save new user to the database - " + err);
                            
                            // Returning the error to the function(as specified in the passport API)
                            return done(err);
                        } else {
                            console.log("GOOGLE - New user successfully saved to the database");
                            
                            // Creating a new portfolio for the user, based on the portfolio model.
                            // The reason I am waiting until this point to create the portfolio, is that if
                            // there is any reason why a user cannot be created i.e. due to a missing field etc,
                            // then I don't want to create a new portfolio, as without an owner id it would be useless
                            var newPortfolio = new Portfolio({
                                owner: newUser._id,
                                portfolioURL: "GoogleUser-" + profile.id,
                                pages: {
                                    contact: {
                                        contactDetails: {
                                            name: profile.name.givenName + " " + profile.name.familyName,
                                            email: profile.emails[0].value
                                        }
                                    }
                                }
                            })
                            ;
                            // Saving the new portfolio to the database
                            newPortfolio.save(function (err, newPortfolio) {
                                if (err) {
                                    console.log("GOOGLE - Could not save new portfolio to the database - " + err);
                                } else {
                                    console.log("GOOGLR - New portfolio successfully saved to the database");
                                    
                                    // Returning no error, along with the newUser to the function(as specified in the passport API)
                                    return done(null, newUser);
                                }
                            });
                        }
                    });
                } else {
                    // This user already exists in the database, and hence is a returning user
                    console.log("GOOGLE - " + profile.name.givenName + " " + profile.name.familyName + " is an existing user");
                    // Returning no error, along with the existing user to the function(as specified in the passport API)
                    return done(null, user);
                }
            }
        });
    }
));

// Exporting the passport object, so that it can be required from other routes when needed
// i.e. in the authentication.js route
module.exports = passport;