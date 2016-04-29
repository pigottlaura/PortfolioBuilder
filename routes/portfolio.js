var express = require('express');
var router = express.Router();
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;
var Portfolio = databaseModels.Portfolio;
var MediaItem = databaseModels.MediaItem;

router.get("/:portfolioURL", function (req, res, next) {
    Portfolio.findOne({ portfolioURL: req.params.portfolioURL }).populate("pages.home.mediaItems owner").exec(function (err, portfolio) {
        if (err) {
            console.log("Index - Could not check if this portfolio exists - " + err);
        } else {
            if (portfolio == null) {
                console.log("Index - This portfolio does not exist");
                res.render("noportfolio", { title: "/ " + req.params.portfolioURL + " does not exist" });
            } else {
                console.log("INDEX - portfolio exists");
                portfolio.sortMediaItems(portfolio, function (sortedMediaItems) {
                    console.log("PORTFOLIO - media items sorted");
                    res.render("portfolio", {
                        title: "Welcome to " + portfolio.owner.firstName + "'s Portfolio",
                        mediaItems: sortedMediaItems,
                        contactPage: portfolio.pages.contact,
                        categories: portfolio.pages.home.categories
                    });
                });
            }
        }
    });
});

module.exports = router;