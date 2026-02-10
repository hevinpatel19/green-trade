import EnergyListing from "../models/EnergyListing.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const ML_SERVICE_URL = "http://localhost:5001";

// @desc    Get dynamic feed with city-based pricing
// @route   GET /api/market/dynamic-feed?city=<city>
//
// PRICING FORMULA (inlined):
//   1. Geocode city → lat/lon
//   2. Fetch weather → cloud_cover
//   3. Call ML service /market-forecast → live_multiplier (demand/supply from weather + time)
//   4. Count active DB listings → local supply factor
//      - < 10 listings → prices rise (supply scarce)
//      - > 10 listings → prices drop (supply abundant)
//   5. finalMultiplier = mlMultiplier × supplyFactor  (clamped 0.5–3.5x)
//   6. dynamicPrice = basePrice × finalMultiplier
export const getDynamicFeed = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city || !city.trim()) {
      return res.status(400).json({ message: "City is required." });
    }

    const trimmedCity = city.trim();

    // ── 1. Geocode city ──
    const geoRes = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(trimmedCity)}&limit=1&appid=${WEATHER_API_KEY}`
    );

    if (!geoRes.data || geoRes.data.length === 0) {
      return res.status(404).json({ message: "City not found. Try another name." });
    }

    const { lat, lon, name: resolvedCity } = geoRes.data[0];

    // ── 2. Fetch weather ──
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const cloudCover = weatherRes.data.clouds?.all ?? 50;

    // ── 3. Local supply factor from DB ──
    const activeListingCount = await EnergyListing.countDocuments({
      isSold: false,
      isAuction: false,
    });
    // Neutral at 10 listings; scale gently. Fewer = prices rise, more = prices drop
    const supplyFactor = Math.max(0.7, Math.min(1.5, 1 + (10 - activeListingCount) * 0.05));

    // ── 4. ML service (demand/supply from weather + time-of-day) ──
    let mlData = null;
    try {
      const mlRes = await axios.post(`${ML_SERVICE_URL}/market-forecast`, {
        cloud_cover: cloudCover,
      });
      mlData = mlRes.data;
    } catch {
      console.log("⚠️ ML service offline, using fallback multiplier 1.0");
    }

    // ── 5. Blend multiplier ──
    const mlMultiplier = mlData?.live_multiplier ?? 1.0;
    const rawMultiplier = mlMultiplier * supplyFactor;
    // Safety: prevent NaN, clamp to 0.5–3.5
    const multiplier = isNaN(rawMultiplier)
      ? 1.0
      : Math.max(0.5, Math.min(3.5, parseFloat(rawMultiplier.toFixed(2))));

    const demandScore = mlData?.demand_score ?? 50;
    const supplyScore = mlData?.supply_score ?? 50;
    const trend = mlData?.trend ?? "STABLE";
    const advice = mlData?.advice ?? "Market data limited.";
    const condition = mlData?.condition ?? "Default";

    // ── 6. Fetch listings and apply dynamic pricing ──
    const listings = await EnergyListing.find({
      isSold: false,
      isAuction: false,
    }).sort({ createdAt: -1 });

    const pricedListings = listings.map((item) => {
      const doc = item.toObject();
      doc.basePrice = doc.pricePerKwh;
      const computed = doc.pricePerKwh * multiplier;
      doc.dynamicPrice = isNaN(computed) ? doc.pricePerKwh : parseFloat(computed.toFixed(2));
      return doc;
    });

    res.json({
      listings: pricedListings,
      market: {
        city: resolvedCity,
        multiplier,
        demandScore,
        supplyScore,
        activeListings: activeListingCount,
        trend,
        advice,
        condition,
      },
    });
  } catch (err) {
    console.error("Dynamic Feed Error:", err.message);
    res.status(500).json({ message: "Failed to fetch dynamic feed." });
  }
};

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
      bids: [],
      // Initialize with proper status
      status: "pending",
      paymentStatus: "pending"
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

// @desc    Mark a listing as SOLD (Immediate Buy) - DEPRECATED
// @route   PUT /api/market/buy/:id
// @note    Use /api/payment/verify instead for proper payment verification
export const buyListing = async (req, res) => {
  try {
    const { buyerAddress, buyerName } = req.body;
    const listingId = req.params.id;

    const listing = await EnergyListing.findById(listingId);

    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.isSold) return res.status(400).json({ message: "Item already sold" });

    // Mark as sold but keep payment status as pending
    // Actual status update happens via /api/payment/verify
    listing.isSold = true;
    listing.buyerAddress = buyerAddress;
    listing.buyerName = buyerName || null;
    listing.status = "matched"; // Matched but not yet paid

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
    const now = new Date();
    const listings = await EnergyListing.find({
      sellerAddress: req.params.email,
      isSold: false,
      // Exclude expired auctions
      $or: [
        { isAuction: false },
        { isAuction: true, auctionEndsAt: { $gt: now } }
      ]
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

// @desc    Get Market Feed (Fixed Price ONLY - No Auctions)
// @route   GET /api/market/feed
export const getMarketFeed = async (req, res) => {
  try {
    // ✅ FIX: Filter out auctions from market feed
    const listings = await EnergyListing.find({
      isSold: false,
      isAuction: false  // Only show fixed-price listings
    }).sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching market feed" });
  }
};

// @desc    Get Auction Feed (Auctions ONLY - excludes expired)
// @route   GET /api/market/auctions
export const getAuctionFeed = async (req, res) => {
  try {
    const now = new Date();
    const auctions = await EnergyListing.find({
      isSold: false,
      isAuction: true,
      auctionEndsAt: { $gt: now } // Only show active (non-expired) auctions
    }).sort({ auctionEndsAt: 1 }); // Sort by ending soonest

    res.json(auctions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching auctions" });
  }
};

// @desc    Get Platform Stats (excludes expired auctions)
// @route   GET /api/market/stats
export const getPlatformStats = async (req, res) => {
  try {
    const now = new Date();

    // Total volume from sold items
    const soldItems = await EnergyListing.find({ isSold: true });
    const totalVolume = soldItems.reduce((acc, item) => acc + item.energyAmount, 0);

    // Active items: not sold AND (not auction OR auction not expired)
    const activeItems = await EnergyListing.find({
      isSold: false,
      $or: [
        { isAuction: false },
        { isAuction: true, auctionEndsAt: { $gt: now } }
      ]
    });

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