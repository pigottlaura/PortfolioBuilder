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
    res.redirect("/admin");
});

module.exports = router;
