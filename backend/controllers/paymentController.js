import Stripe from "stripe";
import dotenv from "dotenv";
import EnergyListing from "../models/EnergyListing.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/payment/create-intent
 * Creates a PaymentIntent and returns ONLY the clientSecret.
 * Body: { amount: number (INR), listingId?: string }
 */
export const createIntent = async (req, res) => {
    try {
        const { amount, listingId } = req.body;
        const numericAmount = Number(amount);

        if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ error: "A valid positive amount is required." });
        }

        if (numericAmount < 1) {
            return res.status(400).json({
                error: "Minimum payable amount is ₹1.",
                code: "AMOUNT_TOO_LOW",
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(numericAmount * 100), // INR → paise
            currency: "inr",
            automatic_payment_methods: { enabled: true },
            metadata: { listingId: listingId || "unknown" },
        });

        // Return ONLY clientSecret — frontend handles the rest
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error("PaymentIntent Error:", err.message);

        if (err.type === "StripeAuthenticationError") {
            return res.status(500).json({ error: "Payment gateway misconfigured." });
        }
        if (err.code === "amount_too_small") {
            return res.status(400).json({ error: "Amount below gateway minimum.", code: "AMOUNT_TOO_LOW" });
        }

        res.status(500).json({ error: err.message || "Payment processing failed." });
    }
};

/**
 * GET /api/payment/config
 * Sends the publishable key so the frontend can init the payment gateway.
 */
export const getConfig = (req, res) => {
    res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
};

/**
 * POST /api/payment/confirm-order
 * Called by the frontend AFTER stripe.confirmPayment succeeds.
 * Updates the energy listing record in the database.
 * Body: { paymentIntentId, listingId, buyerEmail, buyerName, totalAmount }
 */
export const confirmOrder = async (req, res) => {
    try {
        const { paymentIntentId, listingId, buyerEmail, buyerName, totalAmount } = req.body;

        if (!paymentIntentId || !listingId) {
            return res.status(400).json({ error: "paymentIntentId and listingId are required." });
        }

        const listing = await EnergyListing.findById(listingId);
        if (!listing) return res.status(404).json({ error: "Listing not found." });

        // Idempotency — skip if already completed
        if (listing.isSold && listing.paymentStatus === "paid") {
            return res.json({ success: true, message: "Already processed." });
        }

        listing.isSold = true;
        listing.buyerAddress = buyerEmail;
        listing.buyerName = buyerName || null;
        listing.paymentStatus = "paid";
        listing.status = "completed";
        listing.paymentIntentId = paymentIntentId;
        listing.transactionId = paymentIntentId;
        listing.totalAmount = totalAmount;
        listing.completedAt = new Date();

        await listing.save();

        res.json({ success: true, message: "Order confirmed." });
    } catch (err) {
        console.error("Confirm Order Error:", err.message);
        res.status(500).json({ error: "Failed to confirm order." });
    }
};
