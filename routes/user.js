const express = require("express");
const router = express.Router();
const wrapAsync= require("../utils/wrapAsync.js");
const passport = require("passport");
const { savedRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users");

// SignUp Route
router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signupUser));

// Login Route
router.route("/login")
    .get(userController.renderLoginForm)
    .post(savedRedirectUrl, passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }), wrapAsync(userController.loginUser));

// Logout Route
router.get("/logout", userController.logoutUser);

module.exports = router;