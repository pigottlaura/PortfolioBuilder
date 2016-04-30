// Requiring my custom module (databaseModels) which returns an object which
// contains all of the models (document templates) for the database, so that
// I can then access the relevant models within this module
var databaseModels = require("../custom_modules/databaseModels");

// Accessing the User model, from the custom databaseModels module above, so that
// I can use it to query, add, update and remove documents from the User collection
// within the MongoDB database
var User = databaseModels.User;
var Portfolio = databaseModels.Portfolio;

// Requiring the passport module, so that I can set up the relevant modules, including
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
        
        // Looping through the profile object that was returned from the google authorisation,
        // to see what properties are available to me
        for (var p in profile) {
            // Logging out every property of the profile object
            console.log(p + " = " + profile[p]);
        }
        

        // Checking to see if this user already exists i.e. if they have already created an account
        // on this app using this Google account        
        User.findOne({ googleId: profile.id }, {}, function (err, user) {
            if (err) {
                console.log("Cannot check if this Google users already exists - " + err);
                return done(err);
            } else {
                if (user == null) {
                    console.log(profile.name + " is a new user");
                    var newUser = new User({
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        googleId: profile.id,
                        profilePicture: profile._json.image.url
                    });
                    
                    newUser.save(function (err, newUser) {
                        if (err) {
                            console.log("Google - Could not save new user to the database - " + err);
                            return done(err);
                        } else {
                            console.log("Google - New user successfully saved to the database");
                            return done(null, newUser);
                        }
                    });

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
                    });

                    newPortfolio.save(function (err, newPortfolio){
                        if (err) {
                            console.log("Google - Could not save new portfolio to the database - " + err);
                        } else {
                            console.log("Google - New portfolio successfully saved to the database");
                        }
                    });
                    
                } else {
                    console.log(profile.name + " is an existing user");
                    return done(null, user);
                }
            }
        });
    }
));

// Exporting the 
module.exports = passport;