var express = require('express');
var router = express.Router();
var databaseModels = require("../custom_modules/databaseModels");
var ObjectId = require('mongodb').ObjectID;
var MediaItem = databaseModels.MediaItem;
var User = databaseModels.User;
var Portfolio = databaseModels.Portfolio;
var fs = require("fs");
var websiteURL = process.env.WEBSITE_URL || "http://localhost:3000/";

// Get main admin dashboard
router.get('/', function (req, res, next) {
  console.log("Admin - in admin section");
  Portfolio.findOne({ owner: req.session._userId }).populate("pages.home.mediaItems owner").exec(function (err, portfolio) {
    if (err) {
      console.log("Index - Could not check if this portfolio exists - " + err);
    } else {
      if (portfolio == null) {
        console.log("Index - This portfolio does not exist");
        res.render("noportfolio", { title: "/ " + req.params.portfolioURL + " does not exist" });
      } else {
        console.log("This user has " + portfolio.pages.home.mediaItems.length + " media items");

        portfolio.sortMediaItems(portfolio, function (sortedMediaItems) {
          res.render("admin", {
            title: "Admin Section",
            websiteURL: websiteURL + "portfolio/",
            portfolioURL: portfolio.portfolioURL,
            user: portfolio.owner,
            mediaItems: sortedMediaItems,
            contactPage: portfolio.pages.contact
          });
        });
      }
    }
  });
});

// Upload media to admin
router.post("/uploadMedia", function (req, res, next) {
  Portfolio.findOne({ owner: req.session._userId }, function (err, portfolio) {
    if (err) {
      console.log("ADMIN - Could not check if portfolio exists - " + err);
    } else {
      if (portfolio == null) {
        console.log(("ADMIN - This portfolio does not exist"));
      } else {
        for (var i = 0; i < req.files.length; i++) {
          console.log("Admin - file successfully uploaded");
          var newMediaItemTitle = req.body.mediaItemTitle.length > 0 ? req.body.mediaItemTitle : req.files[i].originalname;
          var newMediaItem = new MediaItem({
            owner: req.session._userId,
            file: req.files[i],
            mediaType: req.files[i].mediaType,
            filePath: "../" + req.files[i].path.split("public\\")[1],
            fileTitle: newMediaItemTitle
          });
          newMediaItem.save(function (err, newMediaItem) {
            if (err) {
              console.log("Admin - Could not save media item to database - " + err);
            } else {
              console.log("Admin - Media item successfully saved to database");
            }
          });
        }

        res.redirect("/admin");
      }
    }
  });
});

// Change admin's portfolio URL
router.post("/changePortfolioURL", function (req, res, next) {
  console.log("ADMIN - requested portfolioURL to be changed - " + req.body.newPortfolioURL);

  Portfolio.update({ owner: req.session._userId }, { $set: { portfolioURL: req.body.newPortfolioURL.toLowerCase() } }, function (err, portfolio) {
    if (err) {
      console.log("ADMIN - Could not check if this portfolio exists - " + err);
    } else {
      console.log("ADMIN - updated portfolio URL");
    }
  });
});

router.post("/deleteMedia", function (req, res, next) {
  MediaItem.findOne({ "_id": ObjectId(req.body.mediaId) }, function (err, mediaItem) {
    if (err) {
      console.log("ADMIN-Cannot find file to delete - " + err);
    } else {
      console.log("ADMIN - Successfully found file to delete - " + mediaItem.file.filename);

      fs.unlink(mediaItem.file.path, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("ADMIN - File Deleted");
          res.json({ mediaId: mediaItem._id });
          mediaItem.remove();
        }
      });
    }
  });
});

router.post("/changeMediaTitle", function (req, res, next) {
  console.log("ID = " + req.body.mediaId);
  console.log("NEW TITLE - " + req.body.newTitle);
  MediaItem.update({ "_id": ObjectId(req.body.mediaId) }, { $set: { fileTitle: req.body.newTitle } }, function (err, mediaItem) {
    if (err) {
      console.log("ADMIN - Unable to change media item title - " + err);
    } else {
      console.log("ADMIN - Media item title updated");
    }
  });
});

router.post("/changeMediaOrder", function (req, res, next) {
  var newMediaOrder = JSON.parse(req.body.newOrder);
  for (var i = 0; i < newMediaOrder.length; i++) {
    console.log(newMediaOrder[i].indexPosition);

    MediaItem.update({ "_id": ObjectId(newMediaOrder[i].mediaId) }, { $set: { indexPosition: newMediaOrder[i].indexPosition } }, function (err, docsEffected) {
      if (err) {
        console.log(err);
      } else {
        console.log(docsEffected);
      }
    });
  }
});

module.exports = router;
