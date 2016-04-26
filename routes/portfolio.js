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
                portfolio.pages.home.mediaItems.sort(function(a, b){
                    return a.indexPosition-b.indexPosition;
                });
                res.render("portfolio", {title: "Welcome to " + portfolio.owner.firstName + "'s Portfolio", mediaItems: portfolio.pages.home.mediaItems});
            }
        }
    });
});

module.exports = router;