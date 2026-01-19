import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Payment Intent
// @route   POST /api/payment/process
// @access  Public
export const processPayment = async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to smallest unit (paise/cents)
      currency: currency || "inr",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Send Stripe API Key (Optional, if you want to fetch it from frontend)
// @route   GET /api/payment/stripeapikey
// @access  Public
export const sendStripeApiKey = async (req, res) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
};