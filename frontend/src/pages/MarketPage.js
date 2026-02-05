import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const MarketPage = () => {
    // --- GLOBAL STATE ---
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    // --- MARKET DATA STATE ---
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    // --- SELL FORM STATE ---
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        price: "",
        isAuction: false,
        duration: 24,
        energyType: "Solar"
    });

    // --- AI & WEATHER STATE ---
    const [marketMultiplier, setMarketMultiplier] = useState(1.0);
    const [marketStatus, setMarketStatus] = useState("Enter Location 🌍");
    const [forecast, setForecast] = useState(null);
    const [cityInput, setCityInput] = useState("");

    const WEATHER_API_KEY = "2cf62494edaa9494d7c2025ddede5a9e";

    // 1. Initial Load
    useEffect(() => {
        fetchListings();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchMarketConditions(pos.coords.latitude, pos.coords.longitude),
                () => setMarketStatus("Enter Location Manually 🌍")
            );
        }
    }, []);

    // 2. Fetch Listings
    const fetchListings = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/market/feed");
            setListings(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching listings:", error);
            setLoading(false);
        }
    };

    // 3. Handle Create Listing
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
                energyType: formData.energyType
            });
            toast.success("Listed Successfully!");
            setShowForm(false);
            fetchListings(); // Refresh feed
        } catch (err) {
            toast.error("Failed to list: " + (err.response?.data?.message || err.message));
        }
    };

    // 4. Handle Navigation
    const handleBuyClick = (item, dynamicPrice) => {
        if (!user) return toast.error("Please Login First");
        // Pass updated dynamic price to checkout
        const updatedItem = { ...item, pricePerKwh: dynamicPrice };
        navigate("/checkout", { state: { item: updatedItem } });
    };

    const handleBidClick = (item) => {
        if (!user) return toast.error("Please Login First");
        navigate("/auction", { state: { item } });
    };

    // 5. AI & Weather Logic (Preserved)
    const fetchMarketConditions = async (lat, lon) => {
        try {
            setMarketStatus("AI Analyzing...");
            const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);

            // Mocking AI response if python server is down, else use real call
            // For production, wrap this in try/catch or assume python server is up
            try {
                const [aiRes, forecastRes] = await Promise.all([
                    axios.post("http://localhost:5001/predict-energy", {
                        temperature: weatherRes.data.main.temp,
                        humidity: weatherRes.data.main.humidity,
                        cloud_cover: weatherRes.data.clouds.all
                    }),
                    axios.post("http://localhost:5001/market-forecast", {
                        temperature: weatherRes.data.main.temp,
                        cloud_cover: weatherRes.data.clouds.all
                    })
                ]);
                setMarketMultiplier(aiRes.data.price_multiplier);
                setMarketStatus(forecastRes.data.condition);
                setForecast(forecastRes.data);
            } catch (err) {
                console.log("Python AI Server offline, using default values");
                setMarketStatus("Clear Sky (Default)");
                setMarketMultiplier(1.0);
            }
        } catch (error) {
            setMarketStatus("Weather Unavailable");
        }
    };

    const handleManualSearch = async () => {
        if (!cityInput) return;
        try {
            setMarketStatus("Locating...");
            const geoRes = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=1&appid=${WEATHER_API_KEY}`);
            if (geoRes.data.length === 0) return toast.error("City not found!");
            fetchMarketConditions(geoRes.data[0].lat, geoRes.data[0].lon);
        } catch (error) { console.error(error); }
    };

    // Helper: Time Left for Auctions
    const getTimeLeft = (deadline) => {
        const diff = new Date(deadline) - new Date();
        if (diff <= 0) return "Expired";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `${hours}h remaining`;
    };

    // ✅ FIX: Filter out auctions from market page (backend also filters, this is backup)
    const nonAuctionListings = listings.filter(item => !item.isAuction);
    const filteredListings = filter === "All" ? nonAuctionListings : nonAuctionListings.filter(item => item.energyType === filter);

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">

            {/* HEADER & SELL BUTTON */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Live Energy Market <span className="text-green-600 animate-pulse">●</span>
                    </h1>
                    <p className="mt-2 text-lg text-gray-500">Real-time P2P energy trading.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg flex items-center gap-2"
                >
                    <span>+</span> Sell Energy
                </button>
            </div>

            {/* SELL FORM (Toggleable) */}
            {showForm && (
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-2xl mb-12 border border-gray-100 animate-fade-in relative z-20">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-2xl text-gray-800">Create New Listing</h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>

                    <form onSubmit={handleListEnergy} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Energy Amount (kWh)</label>
                                <input
                                    type="number" required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {formData.isAuction ? "Starting Bid Price (₹)" : "Price per Unit (₹)"}
                                </label>
                                <input
                                    type="number" required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center h-5">
                                <input
                                    id="auctionToggle" type="checkbox"
                                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    checked={formData.isAuction}
                                    onChange={e => setFormData({ ...formData, isAuction: e.target.checked })}
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="auctionToggle" className="font-bold text-gray-800 cursor-pointer">Enable Auction Mode</label>
                                <p className="text-xs text-gray-500">Allow buyers to bid on your energy.</p>
                            </div>
                            {formData.isAuction && (
                                <div className="w-1/3">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Duration: {formData.duration}h</label>
                                    <input
                                        type="range" min="1" max="48"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5">
                            🚀 List on Market
                        </button>
                    </form>
                </div>
            )}

            {/* AI HUD */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Left: Status */}
                <div className={`p-6 rounded-2xl border shadow-lg flex flex-col justify-between transition-colors duration-500 ${marketMultiplier > 1 ? "bg-red-50 border-red-200" : "bg-white border-green-200"}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">📊 Live Index</h2>
                            <p className="text-sm text-gray-600 font-medium">{marketStatus}</p>
                        </div>
                        <span className={`text-2xl font-bold px-3 py-1 rounded-lg border shadow-sm ${marketMultiplier > 1 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {marketMultiplier}x
                        </span>
                    </div>

                    <div className="flex gap-2 mt-6">
                        <input
                            type="text" placeholder="Search City..."
                            value={cityInput} onChange={(e) => setCityInput(e.target.value)}
                            className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <button onClick={handleManualSearch} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition">Go</button>
                    </div>
                </div>

                {/* Right: Forecast */}
                <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-center border border-gray-800">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl animate-pulse">🔮</span>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">AI Sentinel</h2>
                    </div>
                    {forecast ? (
                        <div>
                            <p className="text-2xl font-bold text-white mb-2">{forecast.trend}</p>
                            <p className="text-gray-400 italic text-sm">"{forecast.advice}"</p>
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
                        key={type} onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition ${filter === type ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200"}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* MARKET GRID */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? <p className="text-center col-span-full">Loading Market Feed...</p> : filteredListings.map((item) => {
                    console.log(
                        "LISTING:",
                        item._id,
                        "isAuction:",
                        item.isAuction,
                        "type:",
                        typeof item.isAuction,
                        "auctionEndsAt:",
                        item.auctionEndsAt
                    );
                    const dynamicPrice = item.isAuction ? item.pricePerKwh : parseFloat((item.pricePerKwh * marketMultiplier).toFixed(2));

                    return (
                        <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative group overflow-hidden">

                            {/* Header */}
                            <div className={`h-24 p-4 flex justify-between items-start ${item.energyType === 'Wind' ? 'bg-gradient-to-br from-blue-50 to-cyan-50' : 'bg-gradient-to-br from-yellow-50 to-orange-50'}`}>
                                <span className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide text-gray-700">{item.energyType}</span>
                                {item.isAuction && (
                                    <span className="bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide animate-pulse">
                                        🔨 Live Auction
                                    </span>
                                )}
                            </div>

                            {/* Body */}
                            <div className="p-6 pt-2">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Volume</p>
                                        <h3 className="text-3xl font-extrabold text-gray-900">{item.energyAmount} <span className="text-lg text-gray-400 font-medium">kWh</span></h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-bold">
                                            {item.isAuction ? "Highest Bid" : "Dynamic Rate"}
                                        </p>
                                        <h3 className={`text-2xl font-bold ${item.isAuction ? "text-purple-700" : (marketMultiplier > 1 ? "text-red-600" : "text-green-600")}`}>
                                            ₹{item.highestBid || dynamicPrice}
                                        </h3>
                                        {item.isAuction && (
                                            <p className="text-[10px] text-red-500 font-bold mt-1">
                                                {getTimeLeft(item.auctionEndsAt)}
                                            </p>
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

                                    {item.isAuction ? (
                                        <button
                                            onClick={() => handleBidClick(item)}
                                            className="px-6 py-2 rounded-lg font-bold text-white shadow-lg bg-purple-600 hover:bg-purple-700 transition transform active:scale-95"
                                        >
                                            Place Bid
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleBuyClick(item, dynamicPrice)}
                                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition transform active:scale-95 ${marketMultiplier > 1.5 ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"}`}
                                        >
                                            Buy Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default MarketPage;