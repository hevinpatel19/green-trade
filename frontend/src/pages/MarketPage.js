import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const MarketPage = () => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    // ── MARKET DATA ──
    const [listings, setListings] = useState([]);
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("All");

    // ── SELL FORM ──
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        price: "",
        isAuction: false,
        duration: 24,
        energyType: "Solar",
    });

    // Derive buyer address from profile
    const buyerAddr = user?.address || {};
    const hasCompleteAddress = buyerAddr.city && buyerAddr.country;
    const buyerLocationDisplay = hasCompleteAddress
        ? `${buyerAddr.city}${buyerAddr.state ? ", " + buyerAddr.state : ""}, ${buyerAddr.country}`
        : null;

    // ── Auto-fetch dynamic feed from buyer's profile location ──
    useEffect(() => {
        if (!user || !hasCompleteAddress) return;
        let cancelled = false;

        const fetchDynamicFeed = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(
                    `http://localhost:5000/api/market/dynamic-feed?buyerEmail=${encodeURIComponent(user.email)}`
                );
                if (cancelled) return;
                setListings(data.listings);
                setMarketData(data.market);
            } catch (err) {
                if (cancelled) return;
                if (err.response?.status === 403) {
                    // Buyer address incomplete — handled by the gate below
                    console.log("Buyer address incomplete");
                } else {
                    toast.error("Failed to fetch market data.");
                }
            }
            if (!cancelled) setLoading(false);
        };

        fetchDynamicFeed();
        return () => { cancelled = true; };
    }, [user, hasCompleteAddress]);

    // ── Handle create listing ──
    const handleListEnergy = async (e) => {
        e.preventDefault();
        if (!user) return toast.error("Please Login to Sell");
        try {
            await axios.post("http://localhost:5000/api/market/list", {
                sellerAddress: user.email,
                energyAmount: formData.amount,
                pricePerKwh: formData.price,
                isAuction: formData.isAuction,
                durationHours: formData.duration,
                energyType: formData.energyType,
            });
            toast.success("Listed Successfully!");
            setShowForm(false);
            // Re-fetch dynamic feed
            setListings([]);
            setLoading(true);
            const { data } = await axios.get(
                `http://localhost:5000/api/market/dynamic-feed?buyerEmail=${encodeURIComponent(user.email)}`
            );
            setListings(data.listings);
            setMarketData(data.market);
            setLoading(false);
        } catch (err) {
            toast.error("Failed to list: " + (err.response?.data?.message || err.message));
        }
    };

    // ── Navigation ──
    const handleBuyClick = (item) => {
        if (!user) return toast.error("Please Login First");
        const updatedItem = { ...item, pricePerKwh: item.dynamicPrice };
        navigate("/checkout", { state: { item: updatedItem } });
    };

    // ── Filter ──
    const filteredListings =
        filter === "All" ? listings : listings.filter((item) => item.energyType === filter);

    // ── Multiplier color helper ──
    const multiplierColor = (m) => (m > 1.2 ? "text-red-600" : m < 0.9 ? "text-blue-600" : "text-green-600");
    const multiplierBg = (m) => (m > 1.2 ? "bg-red-50 border-red-200" : "bg-white border-green-200");

    // ════════════════════════════════════════════════════════════════
    //  ADDRESS GATE — show this if buyer profile address is missing
    // ════════════════════════════════════════════════════════════════
    if (!user || !hasCompleteAddress) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-lg w-full">
                    {/* Decorative header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4">
                            <span className="text-4xl">📍</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Profile Address Required</h1>
                        <p className="mt-2 text-gray-500 text-lg">
                            Complete your profile address to view nearby solar energy listings.
                        </p>
                    </div>

                    {/* Info card */}
                    <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 text-center">
                        <p className="text-gray-600 leading-relaxed mb-6">
                            Your marketplace shows listings within your area based on your profile address.
                            Add your <strong>city</strong> and <strong>country</strong> to get started.
                        </p>
                        <a
                            href="/profile"
                            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold transition shadow-lg active:scale-95"
                        >
                            Go to Profile →
                        </a>
                        <p className="mt-4 text-xs text-gray-400 text-center">
                            ⚡ AI-powered pricing adjusts based on weather, demand, and supply in your area.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════
    //  MAIN MARKET VIEW — auto-loaded from buyer profile location
    // ════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">

            {/* HEADER & SELL BUTTON */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Live Energy Market <span className="text-green-600 animate-pulse">●</span>
                    </h1>
                    <p className="mt-2 text-lg text-gray-500">
                        Showing listings near <strong className="text-gray-900">{marketData?.city || buyerLocationDisplay}</strong>
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg flex items-center gap-2"
                >
                    <span>+</span> Sell Energy
                </button>
            </div>

            {/* SELL FORM */}
            {showForm && (
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-2xl mb-12 border border-gray-100 relative z-20">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-2xl text-gray-800">Create New Listing</h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>
                    <form onSubmit={handleListEnergy} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Energy Amount (kWh)</label>
                                <input type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {formData.isAuction ? "Starting Bid Price (₹)" : "Base Price per Unit (₹)"}
                                </label>
                                <input type="number" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <input id="auctionToggle" type="checkbox" className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500" checked={formData.isAuction} onChange={(e) => setFormData({ ...formData, isAuction: e.target.checked })} />
                            <div className="flex-1">
                                <label htmlFor="auctionToggle" className="font-bold text-gray-800 cursor-pointer">Enable Auction Mode</label>
                                <p className="text-xs text-gray-500">Allow buyers to bid on your energy.</p>
                            </div>
                            {formData.isAuction && (
                                <div className="w-1/3">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Duration: {formData.duration}h</label>
                                    <input type="range" min="1" max="48" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            )}
                        </div>
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5">
                            🚀 List on Market
                        </button>
                    </form>
                </div>
            )}

            {/* AI HUD — shows backend-computed data */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Left: Live Index */}
                <div className={`p-6 rounded-2xl border shadow-lg flex flex-col justify-between transition-colors duration-500 ${multiplierBg(marketData?.multiplier || 1)}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">📊 Live Index</h2>
                            <p className="text-sm text-gray-600 font-medium">{marketData?.condition || "Loading..."}</p>
                        </div>
                        <span className={`text-2xl font-bold px-3 py-1 rounded-lg border shadow-sm ${marketData?.multiplier > 1 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {marketData?.multiplier || "—"}x
                        </span>
                    </div>

                    {/* Location info (auto-synced from profile) */}
                    <div className="mt-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">📍 Your Area</span>
                            <span className="text-sm font-bold text-gray-800">{buyerLocationDisplay}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Location from your profile • Radius: {50} km</p>
                    </div>
                </div>

                {/* Right: AI Forecast */}
                <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-center border border-gray-800">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl animate-pulse">🔮</span>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">AI Sentinel</h2>
                    </div>
                    {marketData ? (
                        <div>
                            <p className="text-2xl font-bold text-white mb-2">{marketData.trend}</p>
                            <p className="text-gray-400 italic text-sm">"{marketData.advice}"</p>
                            <div className="mt-4 flex gap-4 text-xs">
                                <span className="bg-gray-800 px-3 py-1 rounded-full">Demand: {marketData.demandScore}</span>
                                <span className="bg-gray-800 px-3 py-1 rounded-full">Supply: {marketData.supplyScore}</span>
                                <span className="bg-gray-800 px-3 py-1 rounded-full">Listings: {marketData.activeListings}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">Connecting to Neural Network...</p>
                    )}
                </div>
            </div>

            {/* FILTERS */}
            <div className="max-w-7xl mx-auto mb-6 flex gap-2">
                {["All", "Solar", "Wind"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition ${filter === type
                            ? "bg-green-600 text-white shadow-md"
                            : "bg-white text-gray-600 border border-gray-200"
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* MARKET GRID */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
                        <p className="text-gray-500 font-medium">Finding nearby listings...</p>
                    </div>
                ) : filteredListings.length === 0 ? (
                    <p className="text-center col-span-full text-gray-400 py-16 text-lg">
                        No listings available near <strong>{buyerLocationDisplay}</strong> right now.
                    </p>
                ) : (
                    filteredListings.map((item) => (
                        <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                            {/* Header */}
                            <div className={`h-24 p-4 flex justify-between items-start ${item.energyType === "Wind" ? "bg-gradient-to-br from-blue-50 to-cyan-50" : "bg-gradient-to-br from-yellow-50 to-orange-50"}`}>
                                <span className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide text-gray-700">
                                    {item.energyType}
                                </span>
                            </div>

                            {/* Body */}
                            <div className="p-6 pt-2">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Volume</p>
                                        <h3 className="text-3xl font-extrabold text-gray-900">
                                            {item.energyAmount} <span className="text-lg text-gray-400 font-medium">kWh</span>
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Dynamic Rate</p>
                                        <h3 className={`text-2xl font-bold ${multiplierColor(marketData?.multiplier || 1)}`}>
                                            ₹{item.dynamicPrice}
                                        </h3>
                                        {item.dynamicPrice !== item.basePrice && (
                                            <p className="text-[10px] text-gray-400 line-through">₹{item.basePrice}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                            {item.sellerAddress ? item.sellerAddress.charAt(0).toUpperCase() : "U"}
                                        </div>
                                        <div className="text-xs">
                                            <p className="text-gray-500">Seller</p>
                                            <p className="font-bold text-gray-800 truncate w-24">{item.sellerAddress}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleBuyClick(item)}
                                        className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition transform active:scale-95 ${(marketData?.multiplier || 1) > 1.5
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-gray-900 hover:bg-gray-800"
                                            }`}
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MarketPage;