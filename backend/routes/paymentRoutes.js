import express from "express";
import {
    processPayment,
    sendStripeApiKey,
    verifyPayment,
    getTradeStatus
} from "../controllers/paymentController.js";

const router = express.Router();

// GET /api/payment/stripeapikey - Get Stripe public key
router.get("/stripeapikey", sendStripeApiKey);

// POST /api/payment/process - Create PaymentIntent
router.post("/process", processPayment);

// POST /api/payment/verify - Verify payment and update DB status
router.post("/verify", verifyPayment);

// GET /api/payment/status/:listingId - Get trade/payment status
router.get("/status/:listingId", getTradeStatus);

export default router;