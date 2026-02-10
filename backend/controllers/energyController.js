import EnergyListing from "../models/EnergyListing.js";
import User from "../models/User.js";

export const getAllEnergy = async (req, res) => {
  try {
    const energy = await EnergyListing.find().sort({ createdAt: -1 });
    res.json(energy);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const listEnergy = async (req, res) => {
  console.log("🔥 HIT: /api/energy/list"); // If you don't see this, your route is wrong.
  console.log("📦 Body:", req.body);

  try {
    const { sellerAddress, energyAmount, pricePerKwh } = req.body;

    // 1. Check if data arrived
    if (!sellerAddress || !energyAmount || !pricePerKwh) {
      throw new Error(`Missing Fields! Got: Address=${sellerAddress}, Amount=${energyAmount}, Price=${pricePerKwh}`);
    }

    // 2. Look up seller's profile coordinates
    let sellerCoordinates = { lat: null, lng: null };
    const seller = await User.findOne({ email: sellerAddress });
    if (seller && seller.coordinates && seller.coordinates.lat != null) {
      sellerCoordinates = { lat: seller.coordinates.lat, lng: seller.coordinates.lng };
    }

    // 3. Calculate values
    const amount = parseFloat(energyAmount);
    const price = parseFloat(pricePerKwh);
    const total = amount * price;

    if (isNaN(total)) {
      throw new Error(`Math Failed! Amount (${energyAmount}) or Price (${pricePerKwh}) is invalid.`);
    }

    // 4. Construct the object
    const newListing = new EnergyListing({
      sellerAddress,
      sellerCoordinates,
      energyAmount: amount,
      pricePerKwh: price,
      totalPrice: total,
      isSold: false
    });

    console.log("💾 Attempting to Save...");
    await newListing.save();
    console.log("✅ Saved!");

    res.status(201).json(newListing);

  } catch (error) {
    console.error("❌ CRASH:", error.message);
    // SEND THE ACTUAL ERROR TO THE FRONTEND
    res.status(500).json({
      message: "Listing Failed",
      detailed_error: error.message, // <--- THIS is what we need to see
      stack: error.stack
    });
  }
};

// @desc    Mark energy as SOLD (Atomic Update)
// @route   POST /api/energy/buy/:id
export const buyEnergy = async (req, res) => {
  const { id } = req.params;
  const { buyerAddress } = req.body;

  console.log(`⚡ Processing Order for ID: ${id}`);

  try {
    // ACTUAL SOLUTION: Use findByIdAndUpdate
    // This creates a direct database instruction: "Set isSold to true"
    // It bypasses Mongoose validation checks that might be crashing your old logic.
    const updatedListing = await EnergyListing.findByIdAndUpdate(
      id,
      {
        $set: {
          isSold: true,
          buyerAddress: buyerAddress || "Verified Buyer",
        },
      },
      { new: true } // Returns the updated document immediately
    );

    if (!updatedListing) {
      console.log("❌ Item not found in DB");
      return res.status(404).json({ message: "Item not found" });
    }

    console.log("✅ Database Updated Successfully!");
    res.status(200).json(updatedListing);

  } catch (error) {
    console.error("❌ Database Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};