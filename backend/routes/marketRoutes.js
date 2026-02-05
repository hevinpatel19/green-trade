import express from "express";
import {
    createListing,
    getMyListings,
    deleteListing,
    getMarketFeed,
    getAuctionFeed,
    getPlatformStats,
    buyListing,
    placeBid
} from "../controllers/marketController.js";

const router = express.Router();

// 1. Get Market Feed (Fixed Price ONLY - Public)
router.get("/feed", getMarketFeed);

// 2. Get Auction Feed (Auctions ONLY - Public)
router.get("/auctions", getAuctionFeed);

// 3. Get Stats (Public)
router.get("/stats", getPlatformStats);

// 4. Create New Listing (Standard OR Auction)
router.post("/list", createListing);

// 5. Seller Actions
router.get("/mylistings/:email", getMyListings);
router.delete("/:id", deleteListing);

// 6. Buying & Bidding Logic
router.put("/buy/:id", buyListing); // For "Buy Now" (marks as matched, payment verified separately)
router.post("/bid/:id", placeBid);  // For "Place Bid"

export default router;