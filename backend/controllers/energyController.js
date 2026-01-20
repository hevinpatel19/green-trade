import EnergyListing from "../models/EnergyListing.js"; 

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

    // 2. Calculate values
    const amount = parseFloat(energyAmount);
    const price = parseFloat(pricePerKwh);
    const total = amount * price;

    if (isNaN(total)) {
        throw new Error(`Math Failed! Amount (${energyAmount}) or Price (${pricePerKwh}) is invalid.`);
    }

    // 3. Construct the object (Note: I removed totalPrice requirement from code logic to test)
    const newListing = new EnergyListing({
      sellerAddress,
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

export const buyEnergy = async (req, res) => {
    // Keep your existing buy logic or leave empty for now
};