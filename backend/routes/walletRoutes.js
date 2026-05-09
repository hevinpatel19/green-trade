import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getBalance,
  addFunds,
  confirmFunds,
  deductFunds,
} from "../controllers/walletController.js";

const router = express.Router();

// GET  /api/wallet/balance       – Get wallet balance + transactions
router.get("/balance", protect, getBalance);

// POST /api/wallet/add-funds     – Create Stripe PaymentIntent for top-up
router.post("/add-funds", protect, addFunds);

// POST /api/wallet/confirm-funds – Credit wallet after Stripe payment
router.post("/confirm-funds", protect, confirmFunds);

// POST /api/wallet/deduct        – Deduct from wallet for purchase
router.post("/deduct", protect, deductFunds);

export default router;
