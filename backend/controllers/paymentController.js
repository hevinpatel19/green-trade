import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

// Check if Stripe key exists
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is not set in .env file!");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ 1. RESTORED: Send Stripe Key to Frontend
// @route   GET /api/payment/stripeapi
export const sendStripeApiKey = async (req, res) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
};

// ✅ 2. NEW LOGIC: Create Payment Intent
// @route   POST /api/payment/process
export const processPayment = async (req, res) => {
  try {
    console.log("📦 Payment Request Body:", req.body);

    const { amount, currency } = req.body;

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
    });

    console.log("✅ PaymentIntent created:", paymentIntent.id);

    // Send the Client Secret to Frontend
    res.send({
      clientSecret: paymentIntent.client_secret,
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

    res.status(500).json({ message: error.message || "Payment processing failed" });
  }
};