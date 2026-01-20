import mongoose from "mongoose";

const energyListingSchema = mongoose.Schema(
  {
    sellerAddress: {
      type: String,
      required: true,
    },
    energyAmount: {
      type: Number,
      required: true,
    },
    pricePerKwh: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      // We can make this optional since we calculate it on the fly often
      required: false, 
    },
    energyType: {
      type: String,
      default: "Solar",
    },
    isSold: {
      type: Boolean,
      default: false,
    },
    // ✅ THIS IS THE MISSING FIELD!
    buyerAddress: {
      type: String,
      default: null, 
    },
  },
  {
    timestamps: true,
  }
);

const EnergyListing = mongoose.model("EnergyListing", energyListingSchema);

export default EnergyListing;