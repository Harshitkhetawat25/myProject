const User = require("../models/user");
const ExpressError = require("../utils/ExpressError");
const { userSchema } = require("../schema");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signupUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        console.log("Signup attempt:", { username, email, password }); // Debug log

        // Validate user input using Joi schema
        const { error } = userSchema.validate({ username, email, password }, { abortEarly: false });
        if (error) {
            const errMsg = error.details.map(el => el.message).join(", ");
            console.log("Validation error:", errMsg); // Debug log
            req.flash("error", errMsg);
            return res.redirect("/signup");
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            req.flash("error", "Username or email already exists");
            return res.redirect("/signup");
        }

        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to WanderWhirl!");
            res.redirect("/listings");
        });
    } catch (e) {
        console.error("Signup error:", e.message); // Debug log
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.loginUser = async (req, res) => {
    req.flash("success", "Welcome back to WanderWhirl!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};