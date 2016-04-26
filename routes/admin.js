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
  User.findOne({ "_id": req.session._userId }, {}, function (err, users) {
    if (err) {
      console.log("ADMIN - Could not check if this user exists - " + err);
      res.redirect("/");
    } else {
      if (users == null) {
        console.log("ADMIN - This user does not exist");
        res.redirect("/");
      } else {
        MediaItem.find({ _ownerId: users._id }).sort({ mediaType: 1, indexPosition: 1, uploadedAt: -1 }).exec(function (err, mediaItems) {
          if (err) {
            console.log("ADMIN - Could not check if there are any media items - " + err);
            res.redirect("/");
          } else {
            if (mediaItems == null) {
              res.redirect("/");
            } else {
              console.log("This user has " + mediaItems.length + " media items");
              res.render("admin", {
                title: "Admin Section",
                url: websiteURL,
                user: users,
                mediaItems: mediaItems
              });
            }
          }
        });
      }
    }
  });
});

// Upload media to admin
router.post("/uploadMedia", function (req, res, next) {
  for (var i = 0; i < req.files.length; i++) {
    console.log("Admin - file successfully uploaded");
    var newMediaItemTitle = req.body.mediaItemTitle.length > 0 ? req.body.mediaItemTitle : req.files[i].originalname;
    var newMediaItem = new MediaItem({
      _ownerId: req.session._userId,
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
  
  Portfolio.findOne({ _ownerId: ObjectId(req.session._userId) }, function (err, portfolio) {
    if(err){
      console.log("ADMIN - Could not check if portfolio exists - " + err);
    } else {
      if(portfolio == null){
        console.log(("ADMIN - This portfolio does not exist"));
      } else {
        portfolio.pages.home.mediaItems.push({_mediaId: newMediaItem._id});
        console.log(("ADMIN - New Media item added to portfolio - " + newMediaItem._id));
        console.log(portfolio.pages.home.mediaItems);
      }
    }
  });
  res.redirect("/admin");
});

// Change admin's portfolio URL
router.post("/changePortfolioURL", function (req, res, next) {
  console.log("Admin - requested portfolioURL to be changed - " + req.body.newPortfolioURL);
  
  User.update({ "_id": req.session._userId }, { $set: { portfolioURL: req.body.newPortfolioURL.toLowerCase() } }, function (err, user) {
    if (err) {
      console.log("Admin - Could not check if this username exists - " + err);
    } else {
      console.log("Admin - updated portfolio URL");
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
          res.json({mediaId: mediaItem._id});
          mediaItem.remove();
        }
      });
    }
  });
});

router.post("/changeMediaTitle", function(req, res, next){
  console.log("ID = " + req.body.mediaId);
  console.log("NEW TITLE - " + req.body.newTitle);
  MediaItem.update({"_id" : ObjectId(req.body.mediaId)}, { $set: {fileTitle: req.body.newTitle}}, function(err, mediaItem){
    if(err){
      console.log("ADMIN - Unable to change media item title - " + err);
    } else {
      console.log("ADMIN - Media item title updated - " + mediaItem.fileTitle);
    }
  });
});

router.post("/changeMediaOrder", function(req, res, next){
  var newMediaOrder = JSON.parse(req.body.newOrder);
  for(var i = 0; i < newMediaOrder.length; i++){
    
    MediaItem.update({"_id": ObjectId(newMediaOrder[i].mediaId)}, { $set: {indexPosition: newMediaOrder[i].indexPosition}}, function(err, docsEffected){
      if(err){
        console.log(err);
      }
    });
    Portfolio.update({ _ownerId: ObjectId(req.session._userId) }, function (err, portfolio) {
    if(err){
      console.log("ADMIN - Could not check if portfolio exists - " + err);
    } else {
      if(portfolio == null){
        console.log(("ADMIN - This portfolio does not exist"));
      } else {
        for(var i = 0; i < portfolio.pages.home.mediaItems.length; i++){
          
        }
      }
    }
  });
  }
  
});

module.exports = router;
