var express = require('express');
var router = express.Router();

router.get("/", function(req, res, next) {
    // If the current session does not contain a username property, then
    // this user is not yet logged in
    if (req.session.username == null) {
        console.log("Auth - User not yet logged in");
        res.redirect("/login");
    } else {
        // This user's session contains a username, hence they must be a logged
        // in user
        console.log("Auth - This user is already logged in");
        next();
    }
    
});

router.post("/", function(req, res, next){
    if(req.body.username == "laura" && req.body.password == "password"){
        req.session.username = req.body.username;
        console.log("Auth - correct username/password");
        res.redirect("/admin");
    } else {
        console.log("Auth - wrong username/password");
        res.render("login", { title: "Login", warning: "Wrong username/password" });
    }
});

module.exports = router;