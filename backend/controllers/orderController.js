import EnergyListing from "../models/EnergyListing.js";

// @desc    Get orders for a specific buyer
// @route   GET /api/orders/myorders/:email
export const getMyOrders = async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find items where 'buyerAddress' matches the user's email
    // AND the item is marked as Sold
    const orders = await EnergyListing.find({ 
        buyerAddress: email, 
        isSold: true 
    }).sort({ updatedAt: -1 }); // Show newest purchases first

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
};

// @desc    Get sales history (For Sellers)
// @route   GET /api/orders/mysales/:email
export const getMySales = async (req, res) => {
    try {
      const { email } = req.params;
      const sales = await EnergyListing.find({ 
          sellerAddress: email, 
          isSold: true 
      }).sort({ updatedAt: -1 });
  
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales" });
    }
  };