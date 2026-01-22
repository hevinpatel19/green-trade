import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
  bidderEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const energyListingSchema = mongoose.Schema(
  {
    sellerAddress: { type: String, required: true },
    energyAmount: { type: Number, required: true },
    
    // For Fixed Price: This is the price. 
    // For Auction: This is the MINIMUM STARTING BID.
    pricePerKwh: { type: Number, required: true }, 

    energyType: { type: String, default: "Solar" },
    isSold: { type: Boolean, default: false },
    buyerAddress: { type: String, default: null },

    // ✅ NEW AUCTION FIELDS
    isAuction: { type: Boolean, default: false },
    auctionEndsAt: { type: Date }, // When the bidding stops
    bids: [bidSchema], // History of bids
    highestBid: { type: Number, default: 0 } // Quick access to top price
  },
  {
    timestamps: true,
  }
);

const EnergyListing = mongoose.model("EnergyListing", energyListingSchema);
export default EnergyListing;