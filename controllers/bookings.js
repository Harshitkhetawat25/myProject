const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const { generatePDF } = require("../utils/pdfGenerator.js");
const mongoose = require("mongoose");

// controllers/bookings.js
module.exports.createBooking = async (req, res) => {
    try {
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

        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (checkInDate >= checkOutDate) {
            req.flash("error", "Check-out date must be after check-in date");
            return res.redirect(`/listings/${listingId}`);
        }

        // Check for date conflicts
        const conflictingBooking = await Booking.findOne({
            listing: listingId,
            status: { $ne: "cancelled" }, // Exclude cancelled bookings
            $or: [
                { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
            ]
        });
        
        if (conflictingBooking) {
            req.flash("error", "This property is not available for the selected dates");
            return res.redirect(`/listings/${listingId}`);
        }

        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalPrice = listing.price * nights * parseInt(guests);
        
        console.log("Booking calculation:", {
            nights,
            pricePerNight: listing.price,
            guests: parseInt(guests),
            totalPrice
        });
        
        const booking = new Booking({
            listing: listingId,
            user: req.user._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: parseInt(guests),
            totalPrice
        });
        
        await booking.save();
        
        // Update listing status
        listing.isBooked = true;
        if (!listing.bookings) {
            listing.bookings = [];
        }
        listing.bookings.push(booking._id);
        await listing.save();
        
        req.flash("success", "Booking confirmed!");
        res.redirect(`/bookings/${booking._id}`);
    } catch (error) {
        console.error("Booking creation error:", error);
        req.flash("error", "Failed to create booking. Please try again.");
        res.redirect("/listings");
    }
};

module.exports.myBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ checkIn: -1 });
    res.render("bookings/index", { bookings });
};

// controllers/bookings.js - Updated showBooking method
module.exports.showBooking = async (req, res) => {
    const { id } = req.params;
    
    // Validate if it's a proper ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid booking ID");
        return res.redirect("/bookings/my-bookings");
    }

    try {
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
        
        // Debug logging
        console.log("Booking data:", {
            id: booking._id,
            totalPrice: booking.totalPrice,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            guests: booking.guests,
            listingPrice: booking.listing?.price
        });
        
        // Safety check and recalculate if totalPrice is missing
        if (!booking.totalPrice || booking.totalPrice === 0) {
            const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
            booking.totalPrice = booking.listing.price * nights * booking.guests;
            
            // Save the calculated totalPrice back to database
            await booking.save();
            console.log("Recalculated totalPrice:", booking.totalPrice);
        }
        
        res.render("bookings/show", { booking });
    } catch (error) {
        console.error("Error fetching booking:", error);
        req.flash("error", "Something went wrong");
        res.redirect("/bookings/my-bookings");
    }
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