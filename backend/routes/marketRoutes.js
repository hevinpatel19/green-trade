import express from "express";
import { 
    createListing, 
    getMyListings, 
    deleteListing, 
    getMarketFeed, 
    getPlatformStats, 
    buyListing, 
    placeBid 
} from "../controllers/marketController.js";

const router = express.Router();

// 1. Get Market Feed (Public)
router.get("/feed", getMarketFeed);

// 2. Get Stats (Public)
router.get("/stats", getPlatformStats);

// 3. Create New Listing (Standard OR Auction)
// Note: If your frontend calls /api/energy/list, ensure your server.js maps /api/energy to this file.
// Or just rename this route to match your frontend call.
router.post("/list", createListing); 

// 4. Seller Actions
router.get("/mylistings/:email", getMyListings);
router.delete("/:id", deleteListing);

// 5. Buying & Bidding Logic
router.put("/buy/:id", buyListing); // For "Buy Now"
router.post("/bid/:id", placeBid);  // ✅ For "Place Bid"

export default router;