import express from "express";
import { processPayment, sendStripeApiKey } from "../controllers/paymentController.js";

const router = express.Router();

// Matches with: /api/payment/process
router.post("/process", processPayment);

// Matches with: /api/payment/stripeapikey (Optional helper)
router.get("/stripeapikey", sendStripeApiKey);

export default router;