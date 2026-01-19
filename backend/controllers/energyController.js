import EnergyListing from "../models/EnergyListing.js"; // Importing your specific model file

// @desc    Get all energy listings
// @route   GET /api/energy/feed
export const getAllEnergy = async (req, res) => {
  try {
    const energy = await EnergyListing.find().sort({ createdAt: -1 });
    res.json(energy);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    List new energy
// @route   POST /api/energy/list
export const listEnergy = async (req, res) => {
  const { sellerAddress, energyAmount, pricePerKwh } = req.body;
  try {
    const newListing = new EnergyListing({
      sellerAddress,
      energyAmount,
      pricePerKwh,
      isSold: false, // Default is not sold
    });
    await newListing.save();
    res.status(201).json(newListing);
  } catch (error) {
    res.status(500).json({ message: "Error creating listing" });
  }
};

// @desc    Mark energy as SOLD (The missing piece!)
// @route   POST /api/energy/buy/:id
export const buyEnergy = async (req, res) => {
  try {
    const energyId = req.params.id;
    const { buyerAddress } = req.body;

    // 1. Find the item
    const item = await EnergyListing.findById(energyId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.isSold) {
      return res.status(400).json({ message: "Item already sold" });
    }

    // 2. Mark as Sold
    item.isSold = true;
    item.buyerAddress = buyerAddress || "Unknown Buyer";
    
    // 3. Save changes
    await item.save();

    res.json({ message: "Purchase successful", item });
    console.log(`✅ Item ${energyId} sold to ${buyerAddress}`);

  } catch (error) {
    console.error("Buy Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};