import mongoose from "mongoose";

const EnergyListingSchema = new mongoose.Schema({
  sellerAddress: { type: String, required: true },
  energyAmount: { type: Number, required: true },
  pricePerKwh: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  isSold: { type: Boolean, default: false },
  blockchainId: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

// Use "export default" for ES Modules
const EnergyListing = mongoose.model("EnergyListing", EnergyListingSchema);
export default EnergyListing;