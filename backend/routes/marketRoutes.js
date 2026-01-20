import express from "express";
import { createListing, getMyListings, deleteListing,getMarketFeed,getPlatformStats } from "../controllers/marketController.js";

const router = express.Router();

router.post("/create", createListing);
router.get("/mylistings/:email", getMyListings);
router.delete("/:id", deleteListing);
router.get("/feed", getMarketFeed);
router.get("/stats", getPlatformStats);
export default router;