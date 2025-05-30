const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, checkListingAvailability } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");
const Booking = require("../models/booking.js"); // Added missing import

// Reordered routes to prevent conflicts
// routes/bookings.js
router.get("/my-bookings", 
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const bookings = await Booking.find({ user: req.user._id })
            .populate("listing")
            .sort({ checkIn: -1 });
        res.render("bookings/index", { 
            bookings,
            title: "My Bookings" // Optional: add page title
        });
    })
);

// Create new booking
router.post("/",
    isLoggedIn,
    checkListingAvailability,
    wrapAsync(bookingController.createBooking)
);

// Show booking confirmation
router.get("/:id", 
    isLoggedIn, 
    wrapAsync(bookingController.showBooking)
);

// Download invoice
router.get("/:id/download", 
    isLoggedIn, 
    wrapAsync(bookingController.downloadInvoice)
);

module.exports = router;