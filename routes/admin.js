var express = require('express');
var router = express.Router();

// Requiring the file system module so that I can delete files from the server i.e if the user wants to
// delete a media item or contact picture
var fs = require("fs");

// Requiring the databaseModels custom module, which returns and object containing all the 
// models for documents inthe database i.e. User, MediaItem and Portfolio. Storing the User
// MediaItem, and Portfolio models in their own variables so they can be accessed in this module i.e.
// to query, add, remove and update documents in their relevant collections of the database
var databaseModels = require("../custom_modules/databaseModels");
var MediaItem = databaseModels.MediaItem;
var User = databaseModels.User;
var Portfolio = databaseModels.Portfolio;

// Requiring the ObjectId method of the mongodb module, so that I can compare string ObjectId's
// with ones that are stored in the database
var ObjectId = require('mongodb').ObjectID;

// Determining where the site is currently running, so I can provide the user will a full link to 
// their portfolio. On Azure, the web address will be stored in the WEBSITE_URL environment variable,
// otherwise the site is running locally
var websiteURL = process.env.WEBSITE_URL || "http://localhost:3000/";

// All request to get the main admin panel
router.get('/', function (req, res, next) {

  // If a request has made it this far, it has passed through authentication at least once, and a user
  // is definately logged in
  console.log("ADMIN - in admin section");

  // Quering the Portfolio model to find the user with the same ObjectId as the user requesting the page. Using the
  // .populate() method to return the media items and owner, whose ObjectId's are referenced within the relevant
  // properties of the portfolio document (similar to a SQL table JOIN)
  Portfolio.findOne({ owner: req.session._userId }).populate("pages.home.mediaItems owner").exec(function (err, portfolio) {
    if (err) {
      console.log("Index - Could not check if this portfolio exists - " + err);
    } else {
      if (portfolio == null) {
        console.log("Index - This portfolio does not exist");

        res.redirect("/");
      } else {
        console.log("This user has " + portfolio.pages.home.mediaItems.length + " media items");

        // Calling the sortMediaItems() function I created on the modules object of the Portfolio schema
        // in the databaseModels module. This method sorts the media items of the database according to
        // index position and date. Once the sort is complete, the portfolio page can then be rendered. 
        // Passing the relevant data needed to set up the page. Thanks to the populate() method, I can access
        // all Portfolio, Owner and MediaItems data relating to this protfolio from the one result object - portfolio
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

// Admin request to upload a new media item. Before reaching this middleware, the request will
// have already have gone throught the Multer filter and Multer storage middleware I set up in the
// app.js file. The filter will have rejected any file types which I am not currently supporting
// on this server, while the storage middleware will have defined where the media item has been saved to
// based on a series of directories I have set up to keep the files in order i.e. images are saving in
// the public/media_uploads/image directory. At this point, the file has already been saved to the 
// hard disk of the server
router.post("/uploadMedia", function (req, res, next) {

  // Creaign an array to temporarily store each of the new media items (files) that have just been uploaded,
  // so that once they are all created, I can loop back through them and save them to the database
  var newMediaItems = [];

  // Creating a variable that I will use as a counter, so monitor how many files have been saved i.e. so I 
  // can work out when all files have been saved 
  var totalFilesSaved = 0;

  // Looping through every file that has been stored on the request object
  for (var i = 0; i < req.files.length; i++) {
    console.log("ADMIN - file successfully uploaded");

    // Determining the title for the media item based on whether or not one has been provided. If no title
    // provided, then defaulting the title to the original file name (users can update this later in the admin panel)
    var newMediaItemTitle = req.body.mediaItemTitle.length > 0 ? req.body.mediaItemTitle : req.files[i].originalname;

    // Creating a new MediaItem, based on the MediaItem model. Storing all the information passed with the file object,
    // as well as some additional information about the title, owner and hyperlink friendly file path (which I 
    // just do here as it makes it easier for me to pass it to Jade later on to render an image, or other,
    // element from it). Taking the full file path, splitting it at "public//" and storing everything that came
    // after it as the "filePath"
    var filePath = process.env.NODE_ENV == "development" ? "../" + req.files[i].path.split("public/")[1] : "../" + req.files[i].path.split("public\\")[1];
    var newMediaItem = new MediaItem({
      owner: req.session._userId,
      file: req.files[i],
      mediaType: req.files[i].mediaType,
      filePath: filePath,
      fileTitle: newMediaItemTitle
    });

    // Pushing this new media item to the temporary array I created above, so it can be saved once the rest have
    // been created
    newMediaItems.push(newMediaItem);
  }

  // Looping through the temporary array I created earlier, so that all the new media items can be saved to the 
  // database
  for (var i = 0; i < newMediaItems.length; i++) {

    // Saving each of the media items to the database. I have added a post() middleware to the MediaItem schema
    // (in the databaseModels module) so that every time a media item is saved, it automatically gets it's
    // ObjectId stored in the Portfolio document of the User that uploaded it
    newMediaItems[i].save(function (err, newMediaItem) {
      if (err) {
        console.log("ADMIN - Could not save media item to database - " + err);
        res.redirect("/admin");
      } else {
        console.log("ADMIN - Media item successfully saved to database");

        // Incrementing the total number of files save (as this is an asynchronous function call, i is not
        // appropriate)
        totalFilesSaved++;

        // Checking if the total number of files saved is equal to the total number stored in the temporary array
        if (totalFilesSaved == newMediaItems.length) {

          // All media items have been saved. Returning the user to the admin panel
          console.log("ADMIN - All media items saved. Returning to admin panel");
          res.redirect("/admin");
        }
      }
    });
  }
});

// AJAX admin request to change their portfolio URL
router.post("/changePortfolioURL", function (req, res, next) {
  console.log("ADMIN - requested portfolioURL to be changed - " + req.body.newPortfolioURL);

  // Finding the Portfolio document that has the same ObjectId as the user requesting this change, and updating
  // their portfolio URL to be equal to the one they specified (to lowercase)
  Portfolio.update({ owner: req.session._userId }, { $set: { portfolioURL: req.body.newPortfolioURL.toLowerCase() } }, function (err, portfolio) {
    if (err) {
      console.log("ADMIN - Could not check if this portfolio exists - " + err);
    } else {
      console.log("ADMIN - updated portfolio URL");

      // Sending an empty response to the client, so the request/response can complete
      res.send();
    }
  });
});

// AJAX admin request to delete a media item
router.post("/deleteMedia", function (req, res, next) {

  console.log("ADMIN - delete media request received");

  // Querying the MediaItem model, to find the media item with the same ObjectId as the one the 
  // admin wants to delete
  MediaItem.findOne({ "_id": ObjectId(req.body.mediaId) }, function (err, mediaItem) {
    if (err) {
      console.log("ADMIN-Cannot find file to delete - " + err);
    } else {
      console.log("ADMIN - Successfully found file to delete - " + mediaItem.file.filename);

      // Using the file system unlink() method to remove the file from the hard drive of the server
      fs.unlink(mediaItem.file.path, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("ADMIN - File Deleted");
        }
      });

      // Sending a response to the client, with the id of the media item that was deleted (so they can remove
      // it form their DOM). Sending this data as an object, using the JSON response method
      res.json({ mediaId: mediaItem._id });
      mediaItem.remove();
    }
  });
});

// AJAX admin request to change the title of a media item
router.post("/changeMediaTitle", function (req, res, next) {

  // Querying the MediaItem model, to find the media item with the same ObjectId as the one passed in.
  // Them updating the title of this media item to be equal to the title from the request
  MediaItem.update({ "_id": ObjectId(req.body.mediaId) }, { $set: { fileTitle: req.body.newTitle } }, function (err, mediaItem) {
    if (err) {
      console.log("ADMIN - Unable to change media item title - " + err);
    } else {
      console.log("ADMIN - Media item title updated");

      // Sending an empty response to the client, so the request/response can complete
      res.send();
    }
  });
});

// AJAX admin change media order request. Called whenever a user reorders their media items by dragging and 
// dropping them in the admin panel
router.post("/changeMediaOrder", function (req, res, next) {

  // Parsing the JSON object that was passed in the request, back to an array so that we can loop through it
  var newMediaOrder = JSON.parse(req.body.newOrder);

  // Creating a variable that I will use as a counter, so monitor how many files have been saved i.e. so I 
  // can work out when all files have been saved 
  var totalFilesSaved = 0;

  // Sending an empty response to the client, so the request/response can complete. The user doesn't need to wait
  // for a response, as the media items will already have been reordered on their page
  res.send();

  // Looping through each of the media items passed to the server
  for (var i = 0; i < newMediaOrder.length; i++) {

    // Querying the MediaItem model to find the current media item (based on its ObjectId) and updating its
    // index position to the value defined on it's object in the arry
    MediaItem.update({ "_id": ObjectId(newMediaOrder[i].mediaId) }, { $set: { indexPosition: newMediaOrder[i].indexPosition } }, function (err, docsEffected) {
      if (err) {
        console.log("ADMIN - Could not update media item position updated in the database - " + err);
      } else {
        console.log("ADMIN - Media item position successfully updated in the database");

        // Incrementing the total number of files save (as this is an asynchronous function call, i is not
        // appropriate)
        totalFilesSaved++;

        // Checking if the total number of files saved is equal to the total number stored in the temporary array
        if (totalFilesSaved == newMediaOrder.length) {
          console.log("ADMIN - All media items order updated in the database");
        }
      }
    });
  }
});

// AJAX admin request to change contact details (for the contact page of the portfolio)
router.post("/changeContactDetails", function (req, res, next) {

  // Find the portfolio that's owner property matches with the id of the current user, and updating each of 
  // the relevant properties of the contact details (and contact page) to reflect their new values
  Portfolio.update({ owner: req.session._userId }, {
    $set: { "pages.contact.contactDetails.name": req.body.name, "pages.contact.contactDetails.email": req.body.email, "pages.contact.contactDetails.phone": req.body.phone, "pages.contact.info": req.body.info }
  }, function (err, docsEffected) {
    if (err) {
      console.log("ADMIN - Could not update portfolio contact details - " + err);
    } else {
      console.log("ADMIN - Contact details successfully updated");

      // Sending an empty response to the client, so the request/response can complete. The user doesn't need to wait
      // for a response, as the details will already have been updated on their page
      res.send();
    }
  });
});

// Image upload for the picture that will display on the contact page of the user portfolio
router.post("/changeContactPicture", function (req, res, next) {

  // Getting the new file path for the image that was just uploaded. Creating my verision of a hyperlink friendly 
  // file path (which I just do here as it makes it easier for me to pass it to Jade later on to render the image.
  // Taking the full file path, splitting it at "public//" and storing everything that came
  // after it as the "filePath"
  var newPictureFilePath = req.files[0].path.split("public\\")[1];

  // Querying the Portfolio modle to find the portfolio belonging to the current user
  Portfolio.findOne({ owner: req.session._userId }, {}, function (err, portfolio) {
    if (err) {
    } else {

      // Checking if this user already has a picture on their contact page
      if (portfolio.pages.contact.picture) {

        // Deleting the current picture on the contact page from the hard disk of the server
        fs.unlink("./public/" + portfolio.pages.contact.picture, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("ADMIN - Contact Picture Deleted");
          }
        });
      }

      // Setting the picture property of the contact page to be equal to the new picture's filepath
      portfolio.pages.contact.picture = newPictureFilePath;

      // Saving the portfolio document (as the changes will not take effect otherwise)
      portfolio.save(function (err, portfolio) {
        if (err) {
          console.log("ADMIN - could not save new contact picture");
        } else {
          console.log("ADMIN - new contact picture saved");

          // Redirecting the user back to the admin page
          res.redirect("/admin");
        }
      });
    }
  });
});

// AJAX admin request to create a new category for their media items
router.post("/addNewCategory", function (req, res, next) {
  var newCategory = req.body.newCategory;

  // Querying the Portfolio model to find the portfolio belonging to the current user
  Portfolio.findOne({ owner: req.session._userId }, {}, function (err, portfolio) {
    if (err) {
      console.log("ADMIN - could not look for portfolio - " + err);
    } else {

      // Adding the new category to the home page's categories array of the portfolio
      portfolio.pages.home.categories.push(req.body.newCategory);

      // Saving the portfolio document (as the changes will not take effect otherwise)
      portfolio.save(function (err, portfolio) {
        if (err) {
          console.log("ADMIN - could not save new category to database");
          res.redirect("/admin");
        } else {
          console.log("ADMIN - new category saved to database");

          // Sending a response to the user, which contains the name of the new category, so the
          // can add it to their DOM
          res.send({ newCategory: newCategory });
        }
      });
    }
  });
});

// AJAX admin request to delete a category
router.post("/deleteCategory", function (req, res, next) {
  var deleteCategory = req.body.deleteCategory;

  // Find the portfolio which belongs to the current user
  Portfolio.findOne({ owner: req.session._userId }, {}, function (err, portfolio) {
    if (err) {
      console.log("ADMIN - could not save new category to database");
      res.redirect("/admin");
    } else {

      // Looping through all of the categories of the portfolio's home page
      for (var i = 0; i < portfolio.pages.home.categories.length; i++) {

        // Checking if this category is equal to the one the user wants to delete
        if (portfolio.pages.home.categories[i] == deleteCategory) {

          // Removing this category from the portfolio home page categories array
          portfolio.pages.home.categories.splice(i, 1);

          // Saving the portfolio document (as the changes will not take effect otherwise)
          portfolio.save(function (err, portfolio) {
            if (err) {
              console.log("ADMIN - could not delete category from database");
            } else {
              console.log("ADMIN - category deleted from database");

              // Sending a response to the user, which contains the name of the new category, so the
              // can remove it from their DOM
              res.send({ deletedCategory: deleteCategory })
            }
          });
        }
      }
    }
  });
});


// AJAX admin request to change the category of a media item
router.post("/changeMediaCategory", function (req, res, next) {
  // Storing the request fields in temporary variables
  var mediaId = req.body.mediaItem;
  var changeToCategory = req.body.category;

  // Quering the MediaItem model, to find the media item that matches with the current id, and belongs
  // to the current user. Updating it's category value to be equal to the new category
  MediaItem.update({ owner: req.session._userId, "_id": ObjectId(mediaId) }, { $set: { category: changeToCategory } }, function (err, docsEffected) {
    if (err) {
      console.log("ADMIN - Could not update media item category - " + err);
    } else {
      console.log("ADMIN - media item's category successfully updated");
      
      // Sending a response to the user, which contains the name of the new category, so the
      // can update the relevante "data-category" attributes in their DOM. Using the JSON response
      // method
      res.json({
        changedMediaId: mediaId,
        changedCategory: changeToCategory
      });
    }
  });
});

module.exports = router;
