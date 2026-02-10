import EnergyListing from "../models/EnergyListing.js";
import User from "../models/User.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const ML_SERVICE_URL = "http://localhost:5001";

// ── Selling radius (km) — configurable ONLY here in code ──
const SELLING_RADIUS_KM = 50;

// ── Haversine distance (km) between two {lat, lng} points ──
const haversineDistance = (coord1, coord2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ── Strip coordinates from listing object before sending to frontend ──
const stripCoords = (doc) => {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete obj.sellerCoordinates;
  return obj;
};

// @desc    Get dynamic feed with buyer-profile-based geo filtering + dynamic pricing
// @route   GET /api/market/dynamic-feed?buyerEmail=<email>
//
// FLOW:
//   1. Look up buyer by email → get buyer coordinates & city
//   2. Filter listings within SELLING_RADIUS_KM of buyer
//   3. Geocode buyer city → fetch weather → ML multiplier → dynamic pricing
export const getDynamicFeed = async (req, res) => {
  try {
    const { buyerEmail } = req.query;
    if (!buyerEmail || !buyerEmail.trim()) {
      return res.status(400).json({ message: "Buyer email is required." });
    }

    // ── 1. Look up buyer profile ──
    const buyer = await User.findOne({ email: buyerEmail.trim() });
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    // Check buyer has complete address & coordinates
    const buyerAddr = buyer.address || {};
    const buyerCoords = buyer.coordinates || {};
    if (!buyerAddr.city || !buyerAddr.country || !buyerCoords.lat || !buyerCoords.lng) {
      return res.status(403).json({
        message: "Complete your profile address to view nearby solar energy listings."
      });
    }

    // ── 2. Geocode buyer's city for weather data ──
    const geoQuery = `${buyerAddr.city},${buyerAddr.state || ""},${buyerAddr.country}`;
    const geoRes = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(geoQuery)}&limit=1&appid=${WEATHER_API_KEY}`
    );

    let resolvedCity = buyerAddr.city;
    let lat = buyerCoords.lat;
    let lon = buyerCoords.lng;
    if (geoRes.data && geoRes.data.length > 0) {
      resolvedCity = geoRes.data[0].name;
      lat = geoRes.data[0].lat;
      lon = geoRes.data[0].lon;
    }

    // ── 3. Fetch weather ──
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const cloudCover = weatherRes.data.clouds?.all ?? 50;

    // ── 4. Local supply factor from DB ──
    const activeListingCount = await EnergyListing.countDocuments({
      isSold: false,
      isAuction: false,
    });
    const supplyFactor = Math.max(0.7, Math.min(1.5, 1 + (10 - activeListingCount) * 0.05));

    // ── 5. ML service ──
    let mlData = null;
    try {
      const mlRes = await axios.post(`${ML_SERVICE_URL}/market-forecast`, {
        cloud_cover: cloudCover,
      });
      mlData = mlRes.data;
    } catch {
      console.log("⚠️ ML service offline, using fallback multiplier 1.0");
    }

    // ── 6. Blend multiplier ──
    const mlMultiplier = mlData?.live_multiplier ?? 1.0;
    const rawMultiplier = mlMultiplier * supplyFactor;
    const multiplier = isNaN(rawMultiplier)
      ? 1.0
      : Math.max(0.5, Math.min(3.5, parseFloat(rawMultiplier.toFixed(2))));

    const demandScore = mlData?.demand_score ?? 50;
    const supplyScore = mlData?.supply_score ?? 50;
    const trend = mlData?.trend ?? "STABLE";
    const advice = mlData?.advice ?? "Market data limited.";
    const condition = mlData?.condition ?? "Default";

    // ── 7. Fetch listings, filter by radius, apply dynamic pricing ──
    const allListings = await EnergyListing.find({
      isSold: false,
      isAuction: false,
    }).sort({ createdAt: -1 });

    // Radius filter: only listings whose seller is within SELLING_RADIUS_KM of the buyer
    const nearbyListings = allListings.filter((item) => {
      const sc = item.sellerCoordinates;
      if (!sc || sc.lat == null || sc.lng == null) return false;
      const dist = haversineDistance(buyerCoords, { lat: sc.lat, lng: sc.lng });
      return dist <= SELLING_RADIUS_KM;
    });

    const pricedListings = nearbyListings.map((item) => {
      const doc = stripCoords(item);
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
// Automatically attaches seller's profile coordinates to the listing
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

    // Look up the seller's profile to get their stored coordinates
    const seller = await User.findOne({ email: sellerAddress });
    let sellerCoordinates = { lat: null, lng: null };
    if (seller && seller.coordinates && seller.coordinates.lat != null) {
      sellerCoordinates = { lat: seller.coordinates.lat, lng: seller.coordinates.lng };
    } else {
      console.log(`⚠️ Seller ${sellerAddress} has no coordinates. Listing will have limited visibility.`);
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
      sellerCoordinates, // Snapshot of seller's profile coordinates
      energyAmount: Number(energyAmount),
      pricePerKwh: Number(pricePerKwh),
      energyType: energyType || "Solar",
      source: source || "Dashboard",
      isAuction: isAuctionBool,
      auctionEndsAt,
      highestBid: 0,
      bids: [],
      status: "pending",
      paymentStatus: "pending"
    });

    // Strip coordinates from the response
    res.status(201).json(stripCoords(listing));
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
// @route   GET /api/market/feed?buyerEmail=<email>
// If buyerEmail is provided, applies radius filtering
export const getMarketFeed = async (req, res) => {
  try {
    const { buyerEmail } = req.query;
    let buyerCoords = null;

    // If buyer email is provided, look up their coordinates for radius filtering
    if (buyerEmail) {
      const buyer = await User.findOne({ email: buyerEmail.trim() });
      if (buyer && buyer.coordinates && buyer.coordinates.lat != null) {
        buyerCoords = { lat: buyer.coordinates.lat, lng: buyer.coordinates.lng };
      }
    }

    const listings = await EnergyListing.find({
      isSold: false,
      isAuction: false
    }).sort({ createdAt: -1 });

    // Apply radius filter if buyer coords are available
    let filtered = listings;
    if (buyerCoords) {
      filtered = listings.filter((item) => {
        const sc = item.sellerCoordinates;
        if (!sc || sc.lat == null || sc.lng == null) return false;
        return haversineDistance(buyerCoords, { lat: sc.lat, lng: sc.lng }) <= SELLING_RADIUS_KM;
      });
    }

    // Strip seller coordinates from response
    res.json(filtered.map(stripCoords));
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