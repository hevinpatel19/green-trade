import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

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
    const { amount, currency } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Convert to Paise (Stripe expects integers: ₹10.50 -> 1050 paise)
    const amountInPaise = Math.round(amount * 100);

    // Create the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: currency || "inr",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Send the Client Secret to Frontend
    res.send({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error("❌ Stripe Intent Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};