var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/authentication/google/callback"
},
    function(accessToken, refreshToken, profile, done) {
        /*
        for (var p in profile) {
            console.log(profile[p]);
        }
        */
        User.findOne({ googleId: profile.id }, {}, function(err, user) {
            if (err) {
                console.log("Cannot check if this Google users already exists - " + err);
                return done(err);
            } else {
                if (user == null) {
                    console.log(profile.name + " is a new user");
                    var newUser = new User({
                        username: profile.id,
                        portfolioURL: "googleuser-" + profile.id,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        googleId: profile.id
                    });

                    newUser.save(function(err, newUser) {
                        if (err) {
                            console.log("Index - Could not save new user to the database - " + err);
                            return done(err);
                        } else {
                            console.log("Index - New user successfully saved to the database");
                            return done(null, newUser);
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

module.exports = passport;