const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        const { review } = req.body;
        const newReview = new Review(review);
        newReview.author = req.user._id;
        listing.reviews.push(newReview);

        await newReview.save();
        await listing.save();

        req.flash("success", "Review added successfully!");
        res.redirect(`/listings/${id}`);
    } catch (e) {
        console.error("Create review error:", e.message);
        req.flash("error", "Failed to add review. Please try again.");
        res.redirect(`/listings/${req.params.id}`);
    }
};

module.exports.deleteReview = async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);

        req.flash("success", "Review deleted successfully!");
        res.redirect(`/listings/${id}`);
    } catch (e) {
        console.error("Delete review error:", e.message);
        req.flash("error", "Failed to delete review. Please try again.");
        res.redirect(`/listings/${req.params.id}`);
    }
};