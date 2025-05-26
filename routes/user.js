const express = require("express");
const router = express.Router();
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const {savedRedirectUrl} = require("../middleware.js");
const userController = require("../controllers/users.js");
// SignUp ROute

router.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));

//Login Route

router.route("/login")
.get(userController.renderLoginForm)
.post(savedRedirectUrl, passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }),wrapAsync(userController.login));


//Logout Route
router.get("/logout", userController.logout);

module.exports = router;