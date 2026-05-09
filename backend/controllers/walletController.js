import Stripe from "stripe";
import dotenv from "dotenv";
import Wallet from "../models/Wallet.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Helper: Get or create wallet for a user
 */
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
  }
  return wallet;
};

/**
 * GET /api/wallet/balance
 * Returns the current wallet balance and recent transactions.
 */
export const getBalance = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50),
    });
  } catch (err) {
    console.error("❌ Wallet Balance Error:", err.message);
    res.status(500).json({ error: "Failed to fetch wallet balance." });
  }
};

/**
 * POST /api/wallet/add-funds
 * Creates a Stripe PaymentIntent for adding funds to wallet.
 * Body: { amount: number (INR) }
 */
export const addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "A valid positive amount is required." });
    }

    if (numericAmount < 1) {
      return res.status(400).json({ error: "Minimum amount is ₹1.", code: "AMOUNT_TOO_LOW" });
    }

    if (numericAmount > 100000) {
      return res.status(400).json({ error: "Maximum amount is ₹1,00,000 per transaction." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount * 100), // INR → paise
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "wallet_topup",
        userId: req.user._id.toString(),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("❌ Wallet Add Funds Error:", err.message);

    if (err.type === "StripeAuthenticationError") {
      return res.status(500).json({ error: "Payment gateway misconfigured." });
    }
    if (err.code === "amount_too_small") {
      return res.status(400).json({ error: "Amount below gateway minimum.", code: "AMOUNT_TOO_LOW" });
    }

    res.status(500).json({ error: err.message || "Failed to initiate payment." });
  }
};

/**
 * POST /api/wallet/confirm-funds
 * Called after Stripe payment succeeds on the frontend.
 * Verifies the payment with Stripe, then credits the wallet.
 * Body: { paymentIntentId: string, amount: number }
 */
export const confirmFunds = async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    const numericAmount = Number(amount);

    if (!paymentIntentId || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: "paymentIntentId and a valid amount are required." });
    }

    // Verify payment with Stripe to prevent fraud
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment has not been completed." });
    }

    // Verify the amount matches what was actually paid
    const paidAmountInr = paymentIntent.amount / 100;
    if (Math.abs(paidAmountInr - numericAmount) > 0.01) {
      return res.status(400).json({ error: "Amount mismatch with payment record." });
    }

    // Verify this is a wallet topup for this user
    if (paymentIntent.metadata?.type !== "wallet_topup" ||
        paymentIntent.metadata?.userId !== req.user._id.toString()) {
      return res.status(400).json({ error: "Payment does not belong to this wallet." });
    }

    const wallet = await getOrCreateWallet(req.user._id);

    // Idempotency — check if this PaymentIntent was already processed
    const alreadyProcessed = wallet.transactions.some(
      (t) => t.referenceId === paymentIntentId && t.type === "credit"
    );
    if (alreadyProcessed) {
      return res.json({
        success: true,
        message: "Already processed.",
        balance: wallet.balance,
      });
    }

    // Credit wallet
    wallet.balance += numericAmount;
    wallet.transactions.push({
      type: "credit",
      amount: numericAmount,
      description: "Added funds via Stripe",
      referenceId: paymentIntentId,
    });

    await wallet.save();

    console.log(`✅ Wallet credited: ₹${numericAmount} for user ${req.user._id}`);

    res.json({
      success: true,
      balance: wallet.balance,
    });
  } catch (err) {
    console.error("❌ Wallet Confirm Funds Error:", err.message);
    res.status(500).json({ error: "Failed to confirm wallet top-up." });
  }
};

/**
 * POST /api/wallet/deduct
 * Deducts amount from wallet for a purchase.
 * Body: { amount: number, listingId: string }
 */
export const deductFunds = async (req, res) => {
  try {
    const { amount, listingId } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: "A valid positive amount is required." });
    }

    if (!listingId) {
      return res.status(400).json({ error: "Listing ID is required." });
    }

    const wallet = await getOrCreateWallet(req.user._id);

    if (wallet.balance < numericAmount) {
      return res.status(400).json({
        error: "Insufficient wallet balance.",
        code: "INSUFFICIENT_BALANCE",
        balance: wallet.balance,
      });
    }

    // Deduct atomically
    wallet.balance -= numericAmount;
    wallet.transactions.push({
      type: "debit",
      amount: numericAmount,
      description: `Energy purchase — Listing ${listingId}`,
      referenceId: listingId,
    });

    await wallet.save();

    console.log(`✅ Wallet debited: ₹${numericAmount} for user ${req.user._id}`);

    res.json({
      success: true,
      balance: wallet.balance,
    });
  } catch (err) {
    console.error("❌ Wallet Deduct Error:", err.message);
    res.status(500).json({ error: "Failed to deduct from wallet." });
  }
};
