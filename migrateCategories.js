const mongoose = require("mongoose");
const Listing = require("./models/listing");

mongoose.connect("mongodb://localhost:27017/wanderwhirl")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

async function migrateCategories() {
    try {
        const listings = await Listing.find({ category: { $exists: false } });
        for (let listing of listings) {
            listing.category = "Trending";
            await listing.save();
            console.log(`Updated listing: ${listing.title}`);
        }
        console.log("Migration completed");
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        mongoose.connection.close();
    }
}

migrateCategories();