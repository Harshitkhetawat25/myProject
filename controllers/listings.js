const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
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
    let response = await geocodingClient
        .forwardGeocode({
            query: `${req.body.listing.location}, ${req.body.listing.country}`,
            limit: 1,
        })
        .send();

    let url = req.file?.path;
    let filename = req.file?.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;
    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New Listing Created Successfully");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    listing.set({ ...req.body.listing });

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
        listing.geometry = response.body.features[0].geometry;
    }

    await listing.save();
    req.flash("success", "Listing Updated Successfully");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let listToBeDeleted = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted Successfully");
    console.log(listToBeDeleted);
    res.redirect("/listings");
};

module.exports.filterByCategory = async (req, res) => {
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
        req.flash("error", "Invalid category");
        return res.redirect("/listings");
    }
    const allListings = await Listing.find({ category });
    res.render("listings/index.ejs", { allListings, activeCategory: category, query: null });
};

module.exports.searchListings = async (req, res) => {
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
};