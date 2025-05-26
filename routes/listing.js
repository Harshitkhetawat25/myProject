const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({storage});
const { cloudinaryStorage } = require("../cloudConfig.js");

router.route("/")
.get( wrapAsync(listingController.index))
.post(isLoggedIn,validateListing, upload.single("listing[image]"),  wrapAsync(listingController.createListing));




//New Listing 
router.get("/new", isLoggedIn, listingController.renderNewForm);


router.route("/:id")
.get( wrapAsync(listingController.showListing))
.put(isLoggedIn,isOwner,upload.single("listing[image]"),validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn,isOwner,  wrapAsync(listingController.destroyListing))

//Edit Route
router.get("/:id/edit", isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm));



module.exports = router;