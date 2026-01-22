import EnergyListing from "../models/EnergyListing.js";

// @desc    Create a new energy listing (Fixed Price OR Auction)
// @route   POST /api/market/list
export const createListing = async (req, res) => {
  try {
    const {
      sellerAddress,
      energyAmount,
      pricePerKwh,
      energyType,
      source,
      isAuction,
      durationHours
    } = req.body;

    if (!sellerAddress || !energyAmount || !pricePerKwh) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const isAuctionBool = isAuction === true || isAuction === "true";

    let auctionEndsAt = null;
    if (isAuctionBool) {
      if (!durationHours) {
        return res.status(400).json({ message: "Auction duration required" });
      }
      auctionEndsAt = new Date(Date.now() + Number(durationHours) * 60 * 60 * 1000);
    }

    const listing = await EnergyListing.create({
      sellerAddress,
      energyAmount: Number(energyAmount),
      pricePerKwh: Number(pricePerKwh),
      energyType: energyType || "Solar",
      source: source || "Dashboard",
      isAuction: isAuctionBool,
      auctionEndsAt,
      highestBid: 0,
      bids: []
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error("CREATE LISTING ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Place a bid on an active auction
// @route   POST /api/market/bid/:id
export const placeBid = async (req, res) => {
  try {
    const { id } = req.params;
    const { bidderEmail, bidAmount } = req.body;

    const listing = await EnergyListing.findById(id);

    // 1. Validations
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (!listing.isAuction) return res.status(400).json({ message: "This item is not for auction" });
    if (listing.isSold) return res.status(400).json({ message: "Auction has already ended" });
    
    // Check if time expired
    if (new Date() > new Date(listing.auctionEndsAt)) {
        return res.status(400).json({ message: "Bidding time has expired" });
    }

    // 2. Check Bid Amount (Must be > highest bid OR > starting price)
    const currentHighest = listing.highestBid > 0 ? listing.highestBid : listing.pricePerKwh;
    
    if (bidAmount <= currentHighest) {
        return res.status(400).json({ message: `Bid must be higher than ₹${currentHighest}` });
    }

    // 3. Save Bid
    listing.bids.push({ bidderEmail, amount: bidAmount });
    listing.highestBid = bidAmount; // Update the display price
    
    await listing.save();

    res.json({ 
        success: true, 
        message: "Bid placed successfully", 
        newHighest: listing.highestBid 
    });

  } catch (error) {
    res.status(500).json({ message: "Bidding failed", error: error.message });
  }
};

// @desc    Mark a listing as SOLD (Immediate Buy)
// @route   PUT /api/market/buy/:id
export const buyListing = async (req, res) => {
  try {
    const { buyerAddress } = req.body;
    const listingId = req.params.id;

    const listing = await EnergyListing.findById(listingId);

    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.isSold) return res.status(400).json({ message: "Item already sold" });

    listing.isSold = true;
    listing.buyerAddress = buyerAddress; 
    
    await listing.save();
    res.json(listing);

  } catch (error) {
    res.status(500).json({ message: "Purchase failed", error: error.message });
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

// @desc    Get Market Feed (Unsold Items Only)
// @route   GET /api/market/feed
export const getMarketFeed = async (req, res) => {
  try {
    const listings = await EnergyListing.find({ isSold: false }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching market feed" });
  }
};

// @desc    Get Platform Stats
// @route   GET /api/market/stats
export const getPlatformStats = async (req, res) => {
  try {
    const soldItems = await EnergyListing.find({ isSold: true });
    const totalVolume = soldItems.reduce((acc, item) => acc + item.energyAmount, 0);
    
    const activeItems = await EnergyListing.find({ isSold: false });
    const avgPrice = activeItems.length > 0
        ? activeItems.reduce((acc, item) => acc + item.pricePerKwh, 0) / activeItems.length
        : 0;

    res.json({
        totalVolume: totalVolume.toFixed(1),
        avgPrice: avgPrice.toFixed(2),
        activeListings: activeItems.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};