import express from "express";
import { createIntent, getConfig, confirmOrder } from "../controllers/paymentController.js";

const router = express.Router();

// GET  /api/payment/config        – Publishable key for frontend
router.get("/config", getConfig);

// POST /api/payment/create-intent – Create a PaymentIntent
router.post("/create-intent", createIntent);

// POST /api/payment/confirm-order – Update DB after successful payment
router.post("/confirm-order", confirmOrder);

export default router;
