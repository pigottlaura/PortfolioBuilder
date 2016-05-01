var express = require('express');
var router = express.Router();

// Requiring the custom googlePassport module I created earlier, which has the basis of the 
// auth process set up. Using it here so I can use the middleware components of it to redirect
// the user to the google oAuth login page, and then receive their response (after their new
// User document has been created in the googlePassport module)
var googlePassport = require("../custom_modules/googlePassport");

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

// Step 1 of the Google authenticaton process. This middleware is activated when a user clicks the "Sign in 
// with Google" button on the home page of the site. The authenticate method sets up the strategy to 
// be used, in this case Google, and the scope which it should attempt to access. I have changed this to 
// userinfo.email, as this returned a much larger result along with the user access token e.g. profile picture,
// email address etc 
router.get('/authentication/google', googlePassport.authenticate(
    'google',
    {
        scope: ['https://www.googleapis.com/auth/userinfo.email']
    }
));

// Step 2 - of the Google authentication process. This middleware is activated when the user is redirected back to
// the app, after logging in to their google account. Again, specifying the strategy, Gooogle, and then setting the 
// failure redirect to take the user back to the home page if the login is unsuccessful. Setting session to false, as
// I am not utilising google sessions, as I am managing all sessions on the app using express-session
router.get('/authentication/google/callback', googlePassport.authenticate(
    'google',
    {
        failureRedirect: '/',
        session: false
    }),
    function (req, res, next) {
        // The new user document has now been created in the custom googlePassport module, and so I can access
        // it on the request object.
        // These login details match this user. Storing the ObjectId of the User document on the session, so that
        // it can be accessed later for authentication as well as querying other database models
        req.session._userId = req.user._id;

        // Redirecting the user to the admin route. They will first have to pass back through the authentication route to 
        // ensure they are logged in (as does every request to the "/admin" route)   
        res.redirect('/admin');
    }
);

// Catching all other requests to the admin panel (GET, POST etc)
router.all("*", function (req, res, next) {
    // If the current session does not contain a username property, then this user is not yet logged in
    if (req.session._userId == null) {
        console.log("AUTH - User not yet logged in");
        
        // Redirecting the user back to the home page
        res.redirect("/");
    } else {
        // This user's session contains a username, hence they must be a logged in user
        console.log("AUTH - This user is already logged in");
        
        // Passing this request to the next level of middleware, which is the admin route
        next();
    }
});

module.exports = router;