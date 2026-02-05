import Stripe from "stripe";
import dotenv from "dotenv";
import EnergyListing from "../models/EnergyListing.js";

dotenv.config();

// Check if Stripe key exists
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is not set in .env file!");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Minimum amount in INR (Stripe requires minimum 50 paise = ₹0.50)
// We set ₹1 as our minimum for better UX
const MINIMUM_AMOUNT_INR = 1;

// ✅ 1. Send Stripe Key to Frontend
// @route   GET /api/payment/stripeapi
export const sendStripeApiKey = async (req, res) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
};

// ✅ 2. Create Payment Intent with minimum validation
// @route   POST /api/payment/process
export const processPayment = async (req, res) => {
  try {
    console.log("📦 Payment Request Body:", req.body);

    const { amount, currency, listingId } = req.body;

    console.log("💰 Amount received:", amount, "Type:", typeof amount);

    // Validation: Check if amount is valid
    if (amount === undefined || amount === null) {
      console.log("❌ Amount is undefined or null");
      return res.status(400).json({ message: "Amount is required" });
    }

    // Convert to number if it's a string
    const numericAmount = Number(amount);

    if (isNaN(numericAmount)) {
      console.log("❌ Amount is NaN after conversion");
      return res.status(400).json({ message: "Amount must be a valid number" });
    }

    if (numericAmount <= 0) {
      console.log("❌ Amount is zero or negative:", numericAmount);
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // ✅ MINIMUM AMOUNT VALIDATION
    if (numericAmount < MINIMUM_AMOUNT_INR) {
      console.log("❌ Amount below minimum:", numericAmount);
      return res.status(400).json({
        message: `Minimum payable amount is ₹${MINIMUM_AMOUNT_INR}. Please increase energy quantity or bid value.`,
        code: "AMOUNT_TOO_LOW",
        minimumAmount: MINIMUM_AMOUNT_INR
      });
    }

    // Convert to Paise (Stripe expects integers: ₹10.50 -> 1050 paise)
    const amountInPaise = Math.round(numericAmount * 100);

    console.log("💵 Amount in Paise:", amountInPaise);

    // Create the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: currency || "inr",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listingId: listingId || "unknown"
      }
    });

    console.log("✅ PaymentIntent created:", paymentIntent.id);

    // Send the Client Secret to Frontend
    res.send({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error("❌ Stripe Intent Error:", error);
    console.error("❌ Error Type:", error.type);
    console.error("❌ Error Code:", error.code);
    console.error("❌ Error Message:", error.message);

    // Return appropriate status based on error type
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ message: "Payment gateway configuration error" });
    }

    // Handle Stripe's minimum amount error
    if (error.code === 'amount_too_small') {
      return res.status(400).json({
        message: "Amount is below the minimum allowed by the payment gateway.",
        code: "AMOUNT_TOO_LOW"
      });
    }

    res.status(500).json({ message: error.message || "Payment processing failed" });
  }
};

// ✅ 3. NEW: Verify Payment and Update Database
// @route   POST /api/payment/verify
export const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId, listingId, buyerEmail, buyerName, totalAmount } = req.body;

    console.log("🔍 Verifying payment:", { paymentIntentId, listingId });

    if (!paymentIntentId || !listingId) {
      return res.status(400).json({ message: "Missing paymentIntentId or listingId" });
    }

    // ✅ VERIFY WITH STRIPE - This is the source of truth
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log("📋 PaymentIntent Status:", paymentIntent.status);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        message: "Payment not confirmed by gateway",
        paymentStatus: paymentIntent.status
      });
    }

    // ✅ PAYMENT VERIFIED - Now update database
    const listing = await EnergyListing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.isSold && listing.paymentStatus === "paid") {
      // Already processed (idempotency check)
      return res.json({
        message: "Payment already verified",
        listing: listing
      });
    }

    // ✅ UPDATE LISTING WITH PAYMENT SUCCESS
    listing.isSold = true;
    listing.buyerAddress = buyerEmail;
    listing.buyerName = buyerName || null;
    listing.paymentStatus = "paid";
    listing.status = "completed";
    listing.stripePaymentIntentId = paymentIntentId;
    listing.transactionId = paymentIntent.id;
    listing.totalAmount = totalAmount || (paymentIntent.amount / 100); // Convert from paise
    listing.completedAt = new Date();

    await listing.save();

    console.log("✅ Payment verified and listing updated:", listing._id);

    res.json({
      success: true,
      message: "Payment verified successfully",
      listing: listing
    });

  } catch (error) {
    console.error("❌ Payment Verification Error:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};

// ✅ 4. Get Trade Status (for frontend to refresh)
// @route   GET /api/payment/status/:listingId
export const getTradeStatus = async (req, res) => {
  try {
    const { listingId } = req.params;

    const listing = await EnergyListing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({
      _id: listing._id,
      paymentStatus: listing.paymentStatus,
      status: listing.status,
      isSold: listing.isSold,
      completedAt: listing.completedAt,
      transactionId: listing.transactionId
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching trade status" });
  }
};