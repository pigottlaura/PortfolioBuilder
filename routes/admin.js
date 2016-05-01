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
  console.log("ADMIN - in admin section");
  Portfolio.findOne({ owner: req.session._userId }).populate("pages.home.mediaItems owner").exec(function (err, portfolio) {
    if (err) {
      console.log("Index - Could not check if this portfolio exists - " + err);
    } else {
      if (portfolio == null) {
        console.log("Index - This portfolio does not exist");
        res.render("noportfolio", { title: "/ " + req.params.portfolioURL + " does not exist" });
      } else {
        console.log("This user has " + portfolio.pages.home.mediaItems.length + " media items");

        portfolio.sortMediaItems(function () {
          res.render("admin", {
            title: "Admin Section",
            websiteURL: websiteURL + "portfolio/",
            portfolioURL: portfolio.portfolioURL,
            user: portfolio.owner,
            mediaItems: portfolio.pages.home.mediaItems,
            contactPage: portfolio.pages.contact,
            categories: portfolio.pages.home.categories
          });
        });
      }
    }
  });
});

// Upload media to admin
router.post("/uploadMedia", function (req, res, next) {
  var newMediaItems = [];
  var totalFilesSaved = 0;

  for (var i = 0; i < req.files.length; i++) {
    console.log("ADMIN - file successfully uploaded");
    
    var newMediaItemTitle = req.body.mediaItemTitle.length > 0 ? req.body.mediaItemTitle : req.files[i].originalname;
    
    var newMediaItem = new MediaItem({
      owner: req.session._userId,
      file: req.files[i],
      mediaType: req.files[i].mediaType,
      filePath: "../" + req.files[i].path.split("public\\")[1],
      fileTitle: newMediaItemTitle
    });

    newMediaItems.push(newMediaItem);
  }

  for (var i = 0; i < newMediaItems.length; i++) {
    newMediaItems[i].save(function (err, newMediaItem) {
      if (err) {
        console.log("ADMIN - Could not save media item to database - " + err);
        res.redirect("/admin");
      } else {
        console.log("ADMIN - Media item successfully saved to database");
        totalFilesSaved++;
        
        if(totalFilesSaved == newMediaItems.length){
          console.log("ADMIN - All media items saved. Returning to admin panel");
          res.redirect("/admin");
        }
      }
    });
  }
});

// Change admin's portfolio URL
router.post("/changePortfolioURL", function (req, res, next) {
  console.log("ADMIN - requested portfolioURL to be changed - " + req.body.newPortfolioURL);

  Portfolio.update({ owner: req.session._userId }, { $set: { portfolioURL: req.body.newPortfolioURL.toLowerCase() } }, function (err, portfolio) {
    if (err) {
      console.log("ADMIN - Could not check if this portfolio exists - " + err);
    } else {
      console.log("ADMIN - updated portfolio URL");
      res.send();
    }
  });
});

router.post("/deleteMedia", function (req, res, next) {

  console.log("ADMIN - delete media request received");

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
        }
      });
      res.json({ mediaId: mediaItem._id });
      mediaItem.remove();
    }
  });
});

router.post("/changeMediaTitle", function (req, res, next) {
  MediaItem.update({ "_id": ObjectId(req.body.mediaId) }, { $set: { fileTitle: req.body.newTitle } }, function (err, mediaItem) {
    if (err) {
      console.log("ADMIN - Unable to change media item title - " + err);
    } else {
      console.log("ADMIN - Media item title updated");
      res.send();
    }
  });
});

router.post("/changeMediaOrder", function (req, res, next) {
  var newMediaOrder = JSON.parse(req.body.newOrder);
  var totalFilesSaved = 0;
  res.send();

  for (var i = 0; i < newMediaOrder.length; i++) {
    MediaItem.update({ "_id": ObjectId(newMediaOrder[i].mediaId) }, { $set: { indexPosition: newMediaOrder[i].indexPosition } }, function (err, docsEffected) {
      if (err) {
        console.log("ADMIN - Could not update media item position updated in the database - " + err);
      } else {
        console.log("ADMIN - Media item position successfully updated in the database");
        totalFilesSaved++;
        
        if(totalFilesSaved == newMediaOrder.length){
          console.log("ADMIN - All media items order updated in the database");
        }
      }
    });
  }
});

router.post("/changeContactDetails", function (req, res, next) {
  Portfolio.update({ owner: req.session._userId }, {
    $set: { "pages.contact.contactDetails.name": req.body.name, "pages.contact.contactDetails.email": req.body.email, "pages.contact.contactDetails.phone": req.body.phone, "pages.contact.info": req.body.info }
  }, function (err, docsEffected) {
    if (err) {
      console.log("ADMIN - Could not update portfolio contact details - " + err);
    } else {
      console.log("ADMIN - Contact details successfully updated");
      res.send();
    }
  });
});

router.post("/changeContactPicture", function (req, res, next) {
  var newPictureFilePath = req.files[0].path.split("public\\")[1];

  Portfolio.findOne({ owner: req.session._userId }, {}, function (err, portfolio) {
    if (err) {
    } else {
      if (portfolio.pages.contact.picture) {
        fs.unlink("./public/" + portfolio.pages.contact.picture, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("ADMIN - Contact Picture Deleted");
          }
        });
      }

      portfolio.pages.contact.picture = newPictureFilePath;
      portfolio.save(function (err, portfolio) {
        if (err) {
          console.log("ADMIN - could not save new contact picture");
        } else {
          console.log("ADMIN - new contact picture saved");
          res.redirect("/admin");
        }
      });
    }
  });
});

router.post("/addNewCategory", function (req, res, next) {
  var newCategory = req.body.newCategory;
  
  Portfolio.findOne({ owner: req.session._userId }, {}, function (err, portfolio) {
    if (err) {

    } else {
      portfolio.pages.home.categories.push(req.body.newCategory);
      portfolio.save(function (err, portfolio) {
        if (err) {
          console.log("ADMIN - could not save new category to database");
        } else {
          console.log("ADMIN - new category saved to database");
          res.send({ newCategory: newCategory });
        }
      });
    }
  });
});

router.post("/deleteCategory", function (req, res, next) {
  var deleteCategory = req.body.deleteCategory;

  Portfolio.findOne({ owner: req.session._userId }, {}, function (err, portfolio) {
    if (err) {

    } else {
      for (var i = 0; i < portfolio.pages.home.categories.length; i++) {
        if (portfolio.pages.home.categories[i] == deleteCategory) {
          portfolio.pages.home.categories.splice(i, 1);
          portfolio.save(function (err, portfolio) {
            if (err) {
              console.log("ADMIN - could not delete category from database");
            } else {
              console.log("ADMIN - category deleted from database");
              res.send({ deletedCategory: deleteCategory })
            }
          });
        }
      }
    }
  });
});

router.post("/changeMediaCategory", function (req, res, next) {
  MediaItem.update({ owner: req.session._userId, "_id": ObjectId(req.body.mediaItem) }, { $set: { category: req.body.category } }, function (err, docsEffected) {
    if (err) {
      console.log("ADMIN - Could not update media item category - " + err);
    } else {
      console.log("ADMIN - media item's category successfully updated");
      res.send();
    }
  });
});

module.exports = router;
