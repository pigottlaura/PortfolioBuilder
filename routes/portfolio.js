var express = require('express');
var router = express.Router();
var databaseModels = require("../custom_modules/databaseModels");
var User = databaseModels.User;
var MediaItem = databaseModels.MediaItem;

router.get("/:portfolioURL", function(req, res, next) {
    User.findOne({ portfolioURL: req.params.portfolioURL }, {}, function(err, users) {
        if (err) {
            console.log("Index - Could not check if this portfolio exists - " + err);
            res.redirect("/");
        } else {
            if (users == null) {
                console.log("Index - This portfolio does not exist");
                res.redirect("/");
            } else {
                MediaItem.find({_ownerId: users._id }).sort({ mediaType: 1, indexPosition: 1, uploadedAt: -1 }).exec(function(err, mediaItems) {
                    if (err) {
                        console.log("Index - Could not check if there are any media items - " + err);
                        res.redirect("/");
                    } else {
                        if (mediaItems == null) {
                            res.redirect("/");
                        } else {
                            console.log("This user has " + mediaItems.length + " media items");
                            res.render("portfolio", {title: "Welcome to " + users.firstName + "'s Portfolio", mediaItems: mediaItems});
                        }
                    }
                });
            }
        }
    });
});

module.exports = router;