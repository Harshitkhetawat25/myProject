const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, listingExists, validateReview, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controllers/reviews");

router.post("/", isLoggedIn, listingExists, validateReview, wrapAsync(reviewController.createReview));

router.delete("/:reviewId", isLoggedIn, listingExists, isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;