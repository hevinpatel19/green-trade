import express from "express";
import { getSellerContact } from "../controllers/userController.js";

const router = express.Router();

// @route   GET /api/users/seller/:email
// @desc    Get seller contact info (public fields only)
// @access  Private (logged-in users only - validated on frontend)
router.get("/seller/:email", getSellerContact);

export default router;
