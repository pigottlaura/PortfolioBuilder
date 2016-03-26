var express = require('express');
var router = express.Router();

/* GET admin listing. */
router.get('/', function(req, res, next) {
  res.render("admin", {title: "Admin Section"});
});

router.post('/', function(req, res, next) {
  res.render("admin", {title: "File Uploaded"});
});

module.exports = router;
