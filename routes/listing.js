const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");

// Main listing routes
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, upload.single("image"), validateListing, wrapAsync(listingController.createListing));

// New listing form
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Search route
router.get("/search", wrapAsync(listingController.searchListings));

// Category filter route
router.get("/category/:category", wrapAsync(listingController.filterByCategory));

// Listing CRUD operations
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner, upload.single("image"), validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Edit listing form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// Booking routes (moved to separate bookings.js)
// Note: These are kept here temporarily for backward compatibility
// but should eventually be removed once fully migrated to bookings.js
router.post("/:id/bookings", 
    isLoggedIn,
    wrapAsync(async (req, res, next) => {
        try {
            const { id } = req.params;
            const listing = await Listing.findById(id);
            const { checkIn, checkOut, guests } = req.body.booking;
            
            const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
            const totalPrice = listing.price * nights * guests;
            
            const booking = new Booking({
                listing: id,
                user: req.user._id,
                checkIn,
                checkOut,
                guests,
                totalPrice
            });
            
            await booking.save();
            req.flash("success", "Booking confirmed!");
            res.redirect(`/bookings/${booking._id}`);
        } catch (err) {
            next(err);
        }
    })
);
module.exports = router;