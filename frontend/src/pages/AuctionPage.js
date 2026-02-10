import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import UserContext from "../context/UserContext";
import ContactSellerButton from "../components/ContactSellerButton";

const AuctionPage = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Get item from navigation state
    const { item } = location.state || {};

    const [listing, setListing] = useState(item);
    const [bidAmount, setBidAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [fetchingLatest, setFetchingLatest] = useState(true);

    // Redirect if no item found (e.g., direct URL access)
    useEffect(() => {
        if (!item) {
            navigate("/market");
            return;
        }
        // Fetch latest auction data to ensure we have fresh bid info
        const fetchLatestListing = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/market/feed`);
                const latestItem = res.data.find(l => l._id === item._id);
                if (latestItem) {
                    setListing(latestItem);
                }
            } catch (err) {
                console.error("Error fetching latest listing:", err);
            }
            setFetchingLatest(false);
        };
        fetchLatestListing();
    }, [item, navigate]);

    // Countdown Timer Logic
    useEffect(() => {
        if (!listing) return;
        const timer = setInterval(() => {
            const diff = new Date(listing.auctionEndsAt) - new Date();
            if (diff <= 0) {
                setTimeLeft("EXPIRED");
                clearInterval(timer);
            } else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [listing]);

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        setLoading(true);

        const currentHighest = listing.highestBid > 0 ? listing.highestBid : listing.pricePerKwh;

        // Validation: Bid must be higher
        if (Number(bidAmount) <= currentHighest) {
            toast.error(`Bid must be higher than ₹${currentHighest}`);
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post(`http://localhost:5000/api/market/bid/${listing._id}`, {
                bidderEmail: user.email,
                bidAmount: Number(bidAmount)
            });

            if (res.data.success) {
                toast.success("Bid Placed Successfully!");
                // Update local state to reflect new bid immediately
                const newBid = {
                    bidderEmail: user.email,
                    amount: Number(bidAmount),
                    timestamp: new Date().toISOString()
                };
                setListing({
                    ...listing,
                    highestBid: res.data.newHighest,
                    bids: [...(listing.bids || []), newBid]
                });
                setBidAmount("");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Bidding Failed");
        }
        setLoading(false);
    };

    // Check if current user is the winner
    const getHighestBidder = () => {
        if (!listing?.bids || listing.bids.length === 0) return null;
        const sortedBids = [...listing.bids].sort((a, b) => b.amount - a.amount);
        return sortedBids[0]?.bidderEmail;
    };

    // Get sorted bids (latest first)
    const getSortedBids = () => {
        if (!listing?.bids || listing.bids.length === 0) return [];
        return [...listing.bids].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    // Format timestamp for display
    const formatBidTime = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Mask email for privacy
    const maskEmail = (email) => {
        if (!email) return "Anonymous";
        const [local, domain] = email.split('@');
        return `${local.substring(0, 2)}***@${domain}`;
    };

    const isCurrentUserWinner = timeLeft === "EXPIRED" && listing?.highestBid > 0 && getHighestBidder() === user?.email;

    if (!listing) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT: Item Details */}
                <div className="space-y-6">
                    <button onClick={() => navigate("/market")} className="text-gray-500 hover:text-gray-900 font-bold text-sm mb-4">
                        ← Back to Market
                    </button>

                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                            LIVE AUCTION
                        </div>

                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{listing.energyAmount} kWh</h1>
                        <p className="text-gray-500 mb-6">Listed by {listing.sellerAddress}</p>

                        <div className="flex items-end gap-2 mb-8">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Highest Bid</p>
                                <p className="text-5xl font-extrabold text-purple-600">
                                    ₹{listing.highestBid || listing.pricePerKwh}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                            <span className="font-bold text-gray-600">Time Remaining</span>
                            <span className="font-mono font-bold text-red-500 text-xl">{timeLeft}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Bidding Form */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-fit">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Place Your Bid</h2>

                    {timeLeft === "EXPIRED" ? (
                        <div className="text-center py-10">
                            <p className="font-bold text-xl text-gray-400">Auction Ended</p>
                            {isCurrentUserWinner ? (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <p className="text-green-700 font-bold mb-2">🎉 Congratulations! You won!</p>
                                    <p className="text-sm text-green-600 mb-3">
                                        Winning amount: ₹{listing.highestBid} for {listing.energyAmount} kWh
                                    </p>
                                    <button
                                        onClick={() => navigate("/checkout", {
                                            state: {
                                                item: {
                                                    ...listing,
                                                    // ✅ FIX: Pass highestBid as total amount, not as pricePerKwh
                                                    winningTotalAmount: listing.highestBid,
                                                    isAuction: true,
                                                    winnerEmail: user.email
                                                }
                                            }
                                        })}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold w-full"
                                    >
                                        Pay ₹{listing.highestBid} Now
                                    </button>
                                </div>
                            ) : listing?.highestBid > 0 ? (
                                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                    <p className="text-gray-600 font-bold">Auction ended. Winner: {getHighestBidder()}</p>
                                </div>
                            ) : (
                                <p className="text-gray-500 mt-4">No bids were placed.</p>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handlePlaceBid} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Your Offer (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold text-lg"
                                        placeholder={`Min ${listing.highestBid > 0 ? listing.highestBid + 1 : listing.pricePerKwh + 1}`}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Enter an amount higher than ₹{listing.highestBid > 0 ? listing.highestBid : listing.pricePerKwh}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                {loading ? "Placing Bid..." : "Submit Bid"}
                            </button>
                        </form>
                    )}
                </div>

                {/* BID HISTORY SECTION */}
                <div className="max-w-4xl w-full mt-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Bid History</h3>
                        {getSortedBids().length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No bids placed yet.</p>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {getSortedBids().map((bid, index) => (
                                    <div
                                        key={`${bid.bidderEmail}-${bid.amount}-${index}`}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${index === 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                                {index === 0 ? '👑' : index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">
                                                    {bid.bidderEmail === user?.email ? 'You' : maskEmail(bid.bidderEmail)}
                                                </p>
                                                <p className="text-xs text-gray-500">{formatBidTime(bid.timestamp)}</p>
                                            </div>
                                        </div>
                                        <p className={`font-bold text-lg ${index === 0 ? 'text-purple-600' : 'text-gray-700'}`}>
                                            ₹{bid.amount}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Contact Seller Floating Button */}
            <ContactSellerButton sellerEmail={listing?.sellerAddress} />
        </div>
    );
};

export default AuctionPage;