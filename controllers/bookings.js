const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const { generatePDF } = require("../utils/pdfGenerator.js");
const mongoose = require("mongoose");

// controllers/bookings.js
module.exports.createBooking = async (req, res) => {
    const { listingId, checkIn, checkOut, guests } = req.body;
    const listing = await Listing.findById(listingId);
    
    // Check if listing exists and is available
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    if (listing.isBooked) {
        req.flash("error", "This property is already booked");
        return res.redirect(`/listings/${listingId}`);
    }

    // Check for date conflicts
    const conflictingBooking = await Booking.findOne({
        listing: listingId,
        $or: [
            { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
        ]
    });
    
    if (conflictingBooking) {
        req.flash("error", "This property is not available for the selected dates");
        return res.redirect(`/listings/${listingId}`);
    }

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalPrice = listing.price * nights * guests;
    
    const booking = new Booking({
        listing: listingId,
        user: req.user._id,
        checkIn,
        checkOut,
        guests,
        totalPrice
    });
    
    await booking.save();
    
    // Update listing status
    listing.isBooked = true;
    listing.bookings.push(booking._id);
    await listing.save();
    
    req.flash("success", "Booking confirmed!");
    res.redirect(`/bookings/${booking._id}`);
};

module.exports.myBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ checkIn: -1 });
    res.render("bookings/index", { bookings });
};

module.exports.showBooking = async (req, res) => {
    const { id } = req.params;
    
    // Validate if it's a proper ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid booking ID");
        return res.redirect("/bookings/my-bookings");
    }

    const booking = await Booking.findById(id)
        .populate("listing")
        .populate("user");
    
    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/my-bookings");
    }
    
    if (!booking.user._id.equals(req.user._id)) {
        req.flash("error", "You are not authorized to view this booking");
        return res.redirect("/bookings/my-bookings");
    }
    
    res.render("bookings/show", { booking });
};
module.exports.downloadInvoice = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id)
        .populate("listing")
        .populate("user");
    
    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/listings");
    }
    
    if (!booking.user._id.equals(req.user._id)) {
        req.flash("error", "You are not authorized to download this invoice");
        return res.redirect("/listings");
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDF(booking);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${booking._id}.pdf`);
    res.send(pdfBuffer);
};