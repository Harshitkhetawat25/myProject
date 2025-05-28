const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const ExpressError = require("../utils/ExpressError.js");

const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings, activeCategory: null, query: null });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing, mapToken });
};

module.exports.createListing = async (req, res, next) => {
    try {
        console.log("Create Listing - Form Data:", req.body.listing);
        console.log("Create Listing - File:", req.file);
        console.log("User:", req.user);

        if (!req.body.listing) {
            throw new ExpressError(400, "Listing data is missing");
        }

        const { title, description, price, location, country } = req.body.listing;
        if (!title || !description || !price || !location || !country) {
            throw new ExpressError(400, "All fields are required: title, description, price, location, country, category");
        }

        let response;
        try {
            response = await geocodingClient
                .forwardGeocode({
                    query: `${location}, ${country}`,
                    limit: 1,
                })
                .send();
        } catch (geoError) {
            console.error("Geocoding Error:", geoError.message);
            throw new ExpressError(400, "Failed to geocode location. Please check location and country.");
        }

        console.log("Geocoding Response:", response.body);

        if (!response.body.features || !response.body.features.length) {
            throw new ExpressError(400, "Invalid location or country. Could not find coordinates.");
        }

        let url = req.file?.path || "https://via.placeholder.com/300";
        let filename = req.file?.filename || "placeholder";

        const newListing = new Listing({
            title,
            description,
            price: Number(price),
            location,
            country,
            category: req.body.listing.category,
            image: { url, filename },
            owner: req.user._id,
            geometry: response.body.features[0].geometry
        });

        console.log("New Listing Before Save:", newListing);

        const savedListing = await newListing.save();
        console.log("Saved Listing:", savedListing);

        req.flash("success", "New Listing Created Successfully");
        res.redirect("/listings");
    } catch (err) {
        console.error("Create Listing Error:", {
            message: err.message,
            stack: err.stack
        });
        next(err);
    }
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res, next) => {
    try {
        let { id } = req.params;
        let listing = await Listing.findById(id);
        if (!listing) {
            throw new ExpressError(404, "Listing you requested for does not exist!");
        }

        listing.set({ ...req.body });

        if (typeof req.file !== "undefined") {
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = { url, filename };
        }

        if (req.body.listing.location && req.body.listing.country) {
            let response = await geocodingClient
                .forwardGeocode({
                    query: `${req.body.listing.location}, ${req.body.listing.country}`,
                    limit: 1,
                })
                .send();

            if (!response.body.features.length) {
                throw new ExpressError(400, "Invalid location or country");
            }

            listing.geometry = response.body.features[0].geometry;
        }

        await listing.save();
        req.flash("success", "Listing Updated Successfully");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        console.error("Update Listing Error:", err);
        next(err);
    }
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let listToDeleted = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted Successfully");
    console.log("Deleted Listing:", listToDeleted);
    res.redirect("/listings");
};

module.exports.filterByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const validCategories = [
            "Trending",
            "Rooms",
            "Iconic cities",
            "Mountains",
            "Castles",
            "Amazing Pools",
            "Camping",
            "Farms",
            "Arctic",
            "Boats",
            "Domes"
        ];
        if (!validCategories.includes(category)) {
            throw new ExpressError(400, "Invalid category");
        }
        const allListings = await Listing.find({ category });
        res.render("listings/index.ejs", { allListings, activeCategory: category, query: null });
    } catch (err) {
        console.error("Filter Category Error:", err);
        next(err);
    }
};

module.exports.searchListings = async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query || query.trim() === "") {
            req.flash("error", "Please enter a search term");
            return res.redirect("/listings");
        }
        const regex = new RegExp(query.trim(), "i");
        const allListings = await Listing.find({
            $or: [
                { title: regex },
                { description: regex },
                { location: regex },
                { country: regex },
                { category: regex }
            ]
        });
        res.render("listings/index.ejs", { allListings, activeCategory: null, query });
    } catch (err) {
        console.error("Search Listings Error:", err);
        next(err);
    }
};