const express = require("express");
const router = express.Router({ caseSensitive: false });
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const userController = require("../controllers/users.js");

router.get("/register", userController.renderSignupForm);
router.post("/register", wrapAsync(userController.signupUser));

// Redirect /signup to /register
router.get("/signup", (req, res) => {
    console.log("Redirecting /signup to /register");
    res.redirect("/register");
});

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

router.get(["/reset/:token", "/reset-password/:token"], wrapAsync(userController.renderResetForm));
router.post(["/reset/:token", "/reset-password/:token"], wrapAsync(userController.resetPassword));

module.exports = router;