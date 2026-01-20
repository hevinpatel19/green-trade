import EnergyListing from "../models/EnergyListing.js";

// @desc    Create a new energy listing
// @route   POST /api/market/create
export const createListing = async (req, res) => {
  const { energyAmount, pricePerKwh, energyType, source } = req.body;

  try {
    // The 'user' is attached by the authMiddleware (which we will add next)
    // or sent from the frontend if we are skipping middleware for now.
    // For now, we assume the frontend sends the seller's email/ID.
    
    const listing = await EnergyListing.create({
      seller: req.body.sellerId, // Or req.user._id if using middleware
      sellerAddress: req.body.sellerEmail, 
      energyAmount,
      pricePerKwh,
      energyType: energyType || "Solar",
      source: source || "Rooftop Panel",
      totalPrice: energyAmount * pricePerKwh,
    });

    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: "Failed to create listing", error: error.message });
  }
};

// @desc    Get all listings for a specific seller
// @route   GET /api/market/mylistings/:email
export const getMyListings = async (req, res) => {
  try {
    const listings = await EnergyListing.find({ 
      sellerAddress: req.params.email,
      isSold: false 
    }).sort({ createdAt: -1 });
    
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching listings" });
  }
};

// @desc    Delete a listing
// @route   DELETE /api/market/:id
export const deleteListing = async (req, res) => {
  try {
    const listing = await EnergyListing.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.isSold) return res.status(400).json({ message: "Cannot delete sold items" });

    await listing.deleteOne();
    res.json({ message: "Listing removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting listing" });
  }
};

export const getMarketFeed = async (req, res) => {
  try {
    // Fetch only items that are NOT sold
    const listings = await EnergyListing.find({ isSold: false })
      .sort({ createdAt: -1 }); // Newest first

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching market feed" });
  }
};