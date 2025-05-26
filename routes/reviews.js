const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");
const {isLoggedIn, validateReview, isOwner, isReviewAuthor} = require("../middleware.js");
const reviewsController = require("../controllers/reviews.js");

//Post new Review

router.post("/",isLoggedIn,validateReview, wrapAsync(reviewsController.createReview));

// Deleter Review Route

router.delete("/:reviewID",isLoggedIn,isReviewAuthor, wrapAsync(reviewsController.destroyReview));

module.exports = router;