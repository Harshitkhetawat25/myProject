const User = require("../models/user");
const ExpressError = require("../utils/ExpressError");
const { userSchema } = require("../schema");
const crypto = require("crypto");
const transporter = require("../utils/nodemailerConfig");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signupUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        console.log("Signup attempt:", { username, email });
        const { error } = userSchema.validate({ username, email, password }, { abortEarly: false });
        if (error) {
            const errMsg = error.details.map(el => el.message).join(", ");
            console.log("Validation error:", errMsg);
            req.flash("error", errMsg);
            return res.redirect("/register");
        }
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            req.flash("error", "Username or email already exists");
            return res.redirect("/register");
        }
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to WanderWhirl!");
            res.redirect("/listings");
        });
    } catch (e) {
        console.error("Signup error:", e.message);
        req.flash("error", e.message);
        res.redirect("/register");
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

module.exports.renderForgotForm = (req, res) => {
    res.render("users/forgot.ejs");
};

module.exports.sendResetEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const protocol = req.protocol || "https";
        const host = req.get("host") || process.env.HOST || "localhost:8080";
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
        console.log("Send Reset Email - Email:", email, "BASE_URL:", baseUrl);

        const user = await User.findOne({ email });
        if (!user) {
            console.log("No user found for email:", email);
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot-password");
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        console.log("Reset token saved for user:", user.email, "Token:", token);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Email credentials are missing");
        }

        const resetUrl = `${baseUrl}/reset/${token}`;
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: "WanderWhirl Password Reset",
            text: `You are receiving this because you (or someone else) have requested a password reset.\n\n
                   Please click the following link to reset your password:\n\n
                   ${resetUrl}\n\n
                   If you did not request this, please ignore this email.\n`
        };

        await transporter.sendMail(mailOptions);
        console.log("Reset email sent to:", user.email, "URL:", resetUrl);
        req.flash("success", "An email has been sent with further instructions.");
        res.redirect("/login");
    } catch (e) {
        console.error("Email error:", {
            message: e.message,
            stack: e.stack,
            email: req.body.email
        });
        req.flash("error", "Failed to send reset email. Please try again.");
        res.redirect("/forgot-password");
    }
};

module.exports.renderResetForm = async (req, res) => {
    const { token } = req.params;
    console.log("Render Reset Form - Token:", token, "Path:", req.path);
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        console.log("Invalid or expired token:", token);
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot-password");
    }
    res.render("users/reset.ejs", { token });
};

module.exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        console.log("Reset Password - Token:", token, "Path:", req.path);
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            console.log("Invalid or expired token:", token);
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot-password");
        }

        const { error } = userSchema.validate({ username: user.username, email: user.email, password }, { abortEarly: false });
        if (error) {
            const errMsg = error.details.map(el => el.message).join(", ");
            req.flash("error", errMsg);
            return res.redirect(`/reset/${token}`);
        }

        await user.setPassword(password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        req.login(user, (err) => {
            if (err) return next(err);
            req.flash("success", "Password has been reset successfully!");
            res.redirect("/listings");
        });
    } catch (e) {
        console.error("Reset error:", {
            message: e.message,
            stack: e.stack
        });
        req.flash("error", "Failed to reset password. Please try again.");
        res.redirect("/forgot-password");
    }
};