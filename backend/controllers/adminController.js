import EnergyListing from "../models/EnergyListing.js";
import User from "../models/User.js";

/**
 * @desc    Get all trades (sold listings) - Admin only - READ ONLY
 * @route   GET /api/admin/trades
 * @access  Private/Admin
 * 
 * NOTE: This is a P2P Energy Trading Platform.
 * Admin can only VIEW trades, NOT edit payment/status.
 * Payment status is controlled by payment gateway, not admin.
 */
export const getAllTrades = async (req, res) => {
    try {
        // Fetch all sold energy listings (completed trades), newest first
        const trades = await EnergyListing.find({ isSold: true })
            .sort({ updatedAt: -1 });

        // Enrich trades with buyer and seller details
        const enrichedTrades = await Promise.all(
            trades.map(async (trade) => {
                const tradeObj = trade.toObject();

                // Get buyer info
                if (trade.buyerAddress) {
                    const buyer = await User.findOne({ email: trade.buyerAddress }).select("name email");
                    tradeObj.buyerInfo = buyer
                        ? { name: buyer.name, email: buyer.email }
                        : { name: trade.buyerName || "Unknown", email: trade.buyerAddress };
                }

                // Get seller info
                if (trade.sellerAddress) {
                    const seller = await User.findOne({ email: trade.sellerAddress }).select("name email");
                    tradeObj.sellerInfo = seller
                        ? { name: seller.name, email: seller.email }
                        : { name: "Unknown", email: trade.sellerAddress };
                }

                return tradeObj;
            })
        );

        res.json(enrichedTrades);
    } catch (error) {
        console.error("❌ Get All Trades Error:", error.message);
        res.status(500).json({ message: "Error fetching trades", error: error.message });
    }
};

/**
 * @desc    Get platform statistics - Admin only
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getPlatformStats = async (req, res) => {
    try {
        const totalTrades = await EnergyListing.countDocuments({ isSold: true });
        const totalListings = await EnergyListing.countDocuments({ isSold: false });
        const totalUsers = await User.countDocuments();

        // Calculate total energy traded
        const tradesData = await EnergyListing.find({ isSold: true });
        const totalEnergyTraded = tradesData.reduce((sum, t) => sum + (t.energyAmount || 0), 0);
        const totalVolume = tradesData.reduce((sum, t) => {
            // Use totalAmount if available, otherwise calculate
            const amount = t.totalAmount || (t.energyAmount * t.pricePerKwh) || 0;
            return sum + amount;
        }, 0);

        // Payment status breakdown (using lowercase enums)
        const paymentStats = {
            paid: tradesData.filter(t => t.paymentStatus === "paid").length,
            pending: tradesData.filter(t => t.paymentStatus === "pending" || !t.paymentStatus).length,
            failed: tradesData.filter(t => t.paymentStatus === "failed").length,
            refunded: tradesData.filter(t => t.paymentStatus === "refunded").length
        };

        // Trade status breakdown (using lowercase enums)
        const tradeStats = {
            completed: tradesData.filter(t => t.status === "completed").length,
            pending: tradesData.filter(t => t.status === "pending" || t.status === "matched" || !t.status).length,
            cancelled: tradesData.filter(t => t.status === "cancelled" || t.status === "failed").length
        };

        res.json({
            totalTrades,
            totalListings,
            totalUsers,
            totalEnergyTraded: totalEnergyTraded.toFixed(2),
            totalVolume: totalVolume.toFixed(2),
            paymentStats,
            tradeStats
        });
    } catch (error) {
        console.error("❌ Get Stats Error:", error.message);
        res.status(500).json({ message: "Error fetching stats", error: error.message });
    }
};
