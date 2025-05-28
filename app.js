require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
console.log("MAP_TOKEN:", process.env.MAP_TOKEN ? "Loaded" : "Missing");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Loaded" : "Missing");
console.log("BASE_URL:", process.env.BASE_URL || "Dynamic via request headers");
if (!process.env.MAP_TOKEN || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing required .env variables: MAP_TOKEN, EMAIL_USER, or EMAIL_PASS");
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log("DB connection error:", err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Log all incoming requests for debugging
app.use((req, res, next) => {
    console.log("Request:", req.method, req.path);
    next();
});

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE:", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");

// Root route
app.get("/", (req, res) => {
    console.log("Root route accessed");
    res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
    console.log("404 - Requested Path:", req.path, "Method:", req.method);
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    console.error("Error Details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode || 500,
        path: req.path,
        method: req.method
    });
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong!";
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 400;
        message = "Invalid ID format";
    } else if (err.name === "MulterError") {
        statusCode = 400;
        message = "Invalid file upload field. Please use the correct file input.";
    } else if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Invalid data: " + Object.values(err.errors).map(e => e.message).join(", ");
    }
    res.status(statusCode).render("error.ejs", { err: { message, statusCode } });
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});