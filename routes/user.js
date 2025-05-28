const express = require("express");
const router = express.Router();
const passport = require("passport");
const { savedRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users");

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(userController.signupUser);

router.route("/login")
    .get(userController.renderLoginForm)
    .post(savedRedirectUrl, passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }), userController.loginUser);

router.get("/logout", userController.logoutUser);

router.route("/forgot-password")
    .get(userController.renderForgotForm)
    .post(userController.sendResetEmail);

router.route("/reset-password/:token")
    .get(userController.renderResetForm)
    .post(userController.resetPassword);

module.exports = router;