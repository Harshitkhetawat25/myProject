const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Review = require("./models/review");

mongoose.connect(process.env.ATLASDB_URL || "mongodb://localhost:27017/wanderwhirl")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

async function cleanupReviews() {
    try {
        const listings = await Listing.find().populate("reviews");
        for (let listing of listings) {
            const validReviews = listing.reviews.filter(review => review != null).map(review => review._id);
            if (validReviews.length !== listing.reviews.length) {
                listing.reviews = validReviews;
                await listing.save();
                console.log(`Cleaned reviews for listing: ${listing.title}`);
            }
        }
        console.log("Cleanup completed");
    } catch (err) {
        console.error("Cleanup error:", err);
    } finally {
        mongoose.connection.close();
    }
}

cleanupReviews();