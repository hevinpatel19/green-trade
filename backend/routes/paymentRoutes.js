import express from "express";
import { createIntent, getConfig, confirmOrder, confirmWalletOrder } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET  /api/payment/config              – Publishable key for frontend
router.get("/config", getConfig);

// POST /api/payment/create-intent       – Create a PaymentIntent
router.post("/create-intent", createIntent);

// POST /api/payment/confirm-order       – Update DB after successful card payment
router.post("/confirm-order", confirmOrder);

// POST /api/payment/confirm-wallet-order – Update DB after wallet payment
router.post("/confirm-wallet-order", protect, confirmWalletOrder);

export default router;

