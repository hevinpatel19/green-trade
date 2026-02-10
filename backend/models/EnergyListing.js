import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
  bidderEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const energyListingSchema = mongoose.Schema(
  {
    sellerAddress: { type: String, required: true },
    // Seller geo coordinates — snapshot from seller profile at listing time
    sellerCoordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    energyAmount: { type: Number, required: true },

    // For Fixed Price: This is the price per kWh
    // For Auction: This is the MINIMUM STARTING BID per kWh
    pricePerKwh: { type: Number, required: true },

    energyType: { type: String, default: "Solar" },
    isSold: { type: Boolean, default: false },
    buyerAddress: { type: String, default: null },

    // ✅ AUCTION FIELDS
    isAuction: { type: Boolean, default: false },
    auctionEndsAt: { type: Date },
    bids: [bidSchema],
    highestBid: { type: Number, default: 0 },

    // ✅ TRADE STATUS (P2P Energy Platform)
    status: {
      type: String,
      enum: ["pending", "matched", "completed", "failed", "cancelled"],
      default: "pending"
    },

    // ✅ PAYMENT STATUS (Gateway-controlled)
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },

    // ✅ PAYMENT TRACKING FIELDS
    paymentIntentId: { type: String, default: null },
    transactionId: { type: String, default: null },
    totalAmount: { type: Number, default: null },
    completedAt: { type: Date, default: null },

    // ✅ BUYER INFO
    buyerName: { type: String, default: null },
    deliveryAddress: { type: String, default: null }
  },
  {
    timestamps: true,
  }
);

const EnergyListing = mongoose.model("EnergyListing", energyListingSchema);
export default EnergyListing;