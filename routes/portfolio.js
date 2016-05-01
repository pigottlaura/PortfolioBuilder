var express = require('express');
var router = express.Router();

// Requiring the databaseModels custom module, which returns and object containing all the 
// models for documents inthe database i.e. User, MediaItem and Portfolio. Storing the User
// MediaItem, and Portfolio models in their own variables so they can be accessed in this module i.e.
// to query, add, remove and update documents in their relevant collections of the database
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;
var Portfolio = databaseModels.Portfolio;
var MediaItem = databaseModels.MediaItem;

// All requests to view a user's portfolio. Visitors to the site do not need to be logged in to access
// this section of the app
router.get("/:portfolioURL", function (req, res, next) {

    // Using the params property of the request object to determine which portfolio URL the user is looking for.
    // Then querying the Portfolio module to find a portfolio with a matching URL.  Using the
    // .populate() method to return the media items and owner, whose ObjectId's are referenced within the relevant
    // properties of the portfolio document (similar to a SQL table JOIN)
    Portfolio.findOne({ portfolioURL: req.params.portfolioURL }).populate("pages.home.mediaItems owner").exec(function (err, portfolio) {
        if (err) {
            console.log("Index - Could not check if this portfolio exists - " + err);
        } else {
            if (portfolio == null) {
                
                // This portfolio does not exist (it may never have existed, or the user may have changed
                // the URL)
                console.log("Index - This portfolio does not exist");
                
                // Rendering the noportfolio view to let the user know this portfolio does not exist
                res.render("noportfolio", { title: "/ " + req.params.portfolioURL + " does not exist" });
            } else {
                console.log("INDEX - portfolio exists");

                // Calling the sortMediaItems() function I created on the modules object of the Portfolio schema
                // in the databaseModels module. This method sorts the media items of the database according to
                // index position and date. Once the sort is complete, the portfolio page can then be rendered. 
                // Passing the relevant data needed to set up the page. Thanks to the populate() method, I can access
                // all Portfolio, Owner and MediaItems data relating to this protfolio from the one result object - portfolio
                portfolio.sortMediaItems(function () {
                    console.log("PORTFOLIO - media items sorted");
                    res.render("portfolio", {
                        title: "Welcome to " + portfolio.owner.firstName + "'s Portfolio",
                        mediaItems: portfolio.pages.home.mediaItems,
                        contactPage: portfolio.pages.contact,
                        categories: portfolio.pages.home.categories
                    });
                });
            }
        }
    });
});

module.exports = router;