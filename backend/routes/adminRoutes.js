import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getAllTrades, getPlatformStats } from "../controllers/adminController.js";

const router = express.Router();

// All routes require authentication + admin role
// These are READ-ONLY endpoints for the P2P Energy Trading Platform
// Admin cannot modify payment/trade status - that's controlled by the payment gateway

// GET /api/admin/trades - Fetch all trades (read-only)
router.get("/trades", protect, adminOnly, getAllTrades);

// GET /api/admin/stats - Fetch platform statistics
router.get("/stats", protect, adminOnly, getPlatformStats);

export default router;
