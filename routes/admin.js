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
  if (req.session.portfolio == null) {
    console.log("ADMIN - User does not have portfolio on session");
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
            req.session.portfolio = portfolio;
            req.session.sortedMediaItems = sortedMediaItems;

            console.log("ADMIN - User portfolio added to session - redirecting to admin");
            res.redirect("/admin");
          });

        }
      }
    });
  } else {
    console.log("ADMIN - User has portfolio on session - rendering");
    res.render("admin", {
      title: "Admin Section",
      websiteURL: websiteURL + "portfolio/",
      portfolioURL: req.session.portfolio.portfolioURL,
      user: req.session.portfolio.owner,
      mediaItems: req.session.sortedMediaItems,
      contactPage: req.session.portfolio.pages.contact,
      categories: req.session.portfolio.pages.home.categories
    });
  }
});

// Upload media to admin
router.post("/uploadMedia", function (req, res, next) {
  var owner = req.session._userId;
  var newMediaItems = [];

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

    req.session.sortedMediaItems.unshift(newMediaItem);
    newMediaItems.push(newMediaItem);
  }

  console.log("ADMIN - Redirecting user back to admin panel");
  res.redirect("/admin");

  for (var i = 0; i < newMediaItems.length; i++) {
    newMediaItems[i].save(function (err, newMediaItem) {
      if (err) {
        console.log("ADMIN - Could not save media item to database - " + err);
      } else {
        console.log("ADMIN - Media item successfully saved to database");
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
    }
  });
});

router.post("/deleteMedia", function (req, res, next) {

  console.log("ADMIN - delete media request received");

  for (var i = 0; i < req.session.sortedMediaItems.length; i++) {
    if (ObjectId(req.body.mediaId).equals(req.session.sortedMediaItems[i]._id)) {
      req.session.sortedMediaItems.splice(i, 1);
      break;
    }
  }
  console.log("ADMIN - media item removed from session - returning user to admin panel");
  res.json({ mediaId: req.body.mediaId });

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
      mediaItem.remove();
    }
  });
});

router.post("/changeMediaTitle", function (req, res, next) {
  console.log("ID = " + req.body.mediaId);
  console.log("NEW TITLE - " + req.body.newTitle);

  for (var i = 0; i < req.session.sortedMediaItems.length; i++) {
    if (ObjectId(req.body.mediaId).equals(req.session.sortedMediaItems[i]._id)) {
      req.session.sortedMediaItems[i].fileTitle = req.body.newTitle;
      break;
    }
  }
  console.log("ADMIN - media item title changed on session - returning user to admin panel");
  res.send();

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
  
  for (var n = 0; n < newMediaOrder.length; n++) {

    for (var s = 0; s < req.session.sortedMediaItems.length; s++) {
      if (ObjectId(newMediaOrder[n].mediaId).equals(req.session.sortedMediaItems[s]._id)) {
        req.session.sortedMediaItems[s].indexPosition = newMediaOrder[n].indexPosition;
        break;
      }
    }
  }
  console.log("ADMIN - media item order changed on session - returning user to admin panel");
  res.send();

  for (var i = 0; i < newMediaOrder.length; i++) {
    MediaItem.update({ "_id": ObjectId(newMediaOrder[i].mediaId) }, { $set: { indexPosition: newMediaOrder[i].indexPosition } }, function(err, docsEffected){
      if(err){
        console.log("ADMIN - Could not update media item position updated in database - " + err);
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

      portfolio.pages.contact.picture = req.files[0].path.split("public\\")[1];
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
      portfolio.pages.home.categories.push(newCategory);
      portfolio.save(function (err, portfolio) {
        if (err) {
          console.log("ADMIN - could not save new category to database");
        } else {
          console.log("ADMIN - new category saved to database");
          res.send({ newCategory: newCategory })
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
