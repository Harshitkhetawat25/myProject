if(process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express(); 
const mongoose = require("mongoose");

const dbUrl = process.env.ATLASDB_URL

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user");

const listingsRouter = require("./routes/listing");
const reviewsRouter = require("./routes/reviews");
const userRouter = require("./routes/user");

main().then(()=> {
    console.log("Connected to database");
}).catch((err) => console.log(err));

async function main() {
    await mongoose.connect(dbUrl);
}


app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto : {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 60 * 60,
});


store.on("error", () => {
    console.log("Error in MONGO SESSION STORE", err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
    }
}




app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(( req, res, next)=> {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

// app.get("/demouser", async(req, res)=> {
//     let fakeUser =  new User({
//         email: "qTQ5V@example.com",
//         username: "demouser",
//     });
//     let registeredUser = await User.register(fakeUser, "password");
//     res.send(registeredUser);
// })

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);



//Error handler 

app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404,"Page Not Found !"));
});

app.use((err, req, res, next)=> {
    let {statusCode=500, message="Something went wrong"} = err;
    res.status(statusCode).render("error.ejs", {err});
})

//Reviews route


app.listen(8080, () => console.log("server is listening on port 8080"));