var express = require('express');
var router = express.Router();
var databaseModels = require("../custom_modules/databaseModels");
var MediaItem = databaseModels.MediaItem;
var User = databaseModels.User;

// Get main admin dashboard
router.get('/', function (req, res, next) {
  console.log("Admin - in admin section");
  res.render("admin", {
    title: "Admin Section",
    user: {
      firstName: req.session.firstName,
      profilePicture: req.session.profilePicture,
      portfolioURL: req.session.portfolioURL
    }
  });

});

// Upload media to admin
router.post("/uploadMedia", function (req, res, next) {
  console.log("Admin - file successfully uploaded");
  var newMediaItem = new MediaItem({
    file: req.files[0],
    mediaType: req.mediaType,
    owner: req.session.username,
    filePath: "../" + req.files[0].path.split("public\\")[1],
    fileTitle: req.body.mediaItemTitle
  });
  newMediaItem.save(function (err, newMediaItem) {
    if (err) {
      console.log("Admin - Could not save media item to database - " + err);
    } else {
      console.log("Admin - Media item successfully saved to database");
      res.redirect("/admin");
    }
  });
});

// Change admin's portfolio URL
router.post("/changePortfolioURL", function (req, res, next) {
  console.log("Admin - requested portfolioURL to be changed");
  req.session.portfolioURL = req.body.newPortfolioURL.toLowerCase();
  res.redirect("/admin");
  
  User.update({ username: req.session.username }, { $set: { portfolioURL: req.session.portfolioURL} }, function (err, user) {
    if (err) {
      console.log("Admin - Could not check if this username exists - " + err);
    } else {
      console.log("Admin - updated portfolio URL to " + req.session.portfolioURL);
    }
  });
});

module.exports = router;
