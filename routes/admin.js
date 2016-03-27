var express = require('express');
var router = express.Router();
var databaseModels = require("../custom_modules/databaseModels");
var MediaItem = databaseModels.MediaItem;

/* GET admin listing. */
router.get('/', function(req, res, next) {
    console.log("Admin - in admin section");
    res.render("admin", { title: "Admin Section" });
});

router.post("/uploadMedia", function(req, res, next) {
    console.log("Admin - file successfully uploaded");
    var newMediaItem = new MediaItem({
        file: req.files[0],
        fileType: req.fileType,
        owner: req.session.username,
        filePath: "../" + req.files[0].path.split("media_uploads\\")[1]
    });
    newMediaItem.save(function(err, newMediaItem){
        if(err){
            console.log("Admin - Could not save media item to database - " + err);
        } else{
            console.log("Admin - Media item successfully saved to database");
            res.redirect("/admin");
        }
    });
});

module.exports = router;
