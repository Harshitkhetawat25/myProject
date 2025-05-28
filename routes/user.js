const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const userController = require("../controllers/users.js");

router.get("/register", userController.renderSignupForm);
router.post("/register", wrapAsync(userController.signupUser));

router.get("/login", userController.renderLoginForm);
router.post(
    "/login",
    passport.authenticate("local", {
        failureFlash: true,
        failureRedirect: "/login"
    }),
    userController.loginUser
);

router.get("/logout", userController.logoutUser);

router.get("/forgot-password", userController.renderForgotForm);
router.post("/forgot-password", wrapAsync(userController.sendResetEmail));

// Handle both /reset/:token and /reset-password/:token
router.get(["/reset/:token", "/reset-password/:token"], wrapAsync(userController.renderResetForm));
router.post(["/reset/:token", "/reset-password/:token"], wrapAsync(userController.resetPassword));

module.exports = router;