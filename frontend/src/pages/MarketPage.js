import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const MarketPage = () => {
  // --- GLOBAL STATE (From Context) ---
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // --- MARKET DATA STATE ---
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  // --- AI & WEATHER STATE (Your Custom Features) ---
  const [marketMultiplier, setMarketMultiplier] = useState(1.0);
  const [marketStatus, setMarketStatus] = useState("Enter Location 🌍");
  const [forecast, setForecast] = useState(null); 
  const [cityInput, setCityInput] = useState(""); 

  const WEATHER_API_KEY = "2cf62494edaa9494d7c2025ddede5a9e"; 

  // 1. Initial Load (Listings + Geo)
  useEffect(() => {
    fetchListings();
    
    // Try Auto-Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchMarketConditions(pos.coords.latitude, pos.coords.longitude),
            () => setMarketStatus("Enter Location Manually 🌍")
        );
    }
  }, []);

  // 2. Fetch Listings (Using the NEW Backend Route)
  const fetchListings = async () => {
    try {
      // ✅ Updated to use the new 'market' route
      const res = await axios.get("http://localhost:5000/api/market/feed");
      setListings(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setLoading(false);
    }
  };

  // 3. CORE AI FUNCTION (Preserved)
  const fetchMarketConditions = async (lat, lon) => {
    try {
        setMarketStatus("AI Analyzing...");
        
        const weatherRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
        );

        // Python AI Calls
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
        setMarketStatus(forecastRes.data.condition || aiRes.data.market_status);
        setForecast(forecastRes.data); 

    } catch (error) {
        console.error("Market AI Error:", error);
        setMarketStatus("AI Offline");
    }
  };

  // 4. Manual Search
  const handleManualSearch = async () => {
    if (!cityInput) return;
    try {
        setMarketStatus("Locating...");
        const geoRes = await axios.get(
            `https://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=1&appid=${WEATHER_API_KEY}`
        );
        
        if (geoRes.data.length === 0) {
            alert("City not found!");
            setMarketStatus("City Not Found");
            return;
        }

        const { lat, lon } = geoRes.data[0];
        fetchMarketConditions(lat, lon); 

    } catch (error) {
        console.error("Search Error:", error);
    }
  };

  // 5. Secure Buy Handler (Updated with Auth Check)
  const handleBuyClick = (item, dynamicPrice) => {
    if (!user) {
        // ✅ Gatekeeper Logic
        if(window.confirm("You must be logged in to buy energy. Login now?")) {
            navigate("/login");
        }
        return;
    }
    
    // Pass updated price to checkout
    const updatedItem = { ...item, pricePerKwh: dynamicPrice };
    navigate("/checkout", { state: { item: updatedItem } });
  };

  // Helper: AI Scoring
  const getDealScore = (price, fairPrice) => {
    if (!fairPrice) return { label: "Analyzing...", color: "text-gray-400" };
    const ratio = price / fairPrice;
    if (ratio <= 0.9) return { label: "🔥 STEAL DEAL", color: "text-green-600 bg-green-100" };
    if (ratio <= 1.1) return { label: "✅ FAIR VALUE", color: "text-blue-600 bg-blue-100" };
    return { label: "⚠️ OVERPRICED", color: "text-red-600 bg-red-100" };
  };

  // Filter Logic
  const filteredListings = filter === "All" 
    ? listings 
    : listings.filter(item => item.energyType === filter);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      
      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Live Energy Market <span className="text-green-600 animate-pulse">●</span>
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Real-time P2P energy trading. Prices adapt to weather & demand.
          </p>
      </div>

      {/* --- AI HUD (The "Cool" Section) --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* LEFT: Live Index & Supply/Demand */}
          <div className={`p-6 rounded-2xl border shadow-lg flex flex-col justify-between transition-colors duration-500 ${marketMultiplier > 1 ? "bg-red-50 border-red-200" : "bg-white border-green-200"}`}>
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            📊 Live Index
                        </h2>
                        <p className="text-sm text-gray-600 font-medium">{marketStatus}</p>
                    </div>
                    <span className={`text-2xl font-bold px-3 py-1 rounded-lg border shadow-sm ${marketMultiplier > 1 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {marketMultiplier}x
                    </span>
                </div>
                
                {/* Supply vs Demand Bars */}
                {forecast && forecast.supply_score && (
                    <div className="mt-6 space-y-4 bg-white/50 p-4 rounded-xl border border-gray-200">
                        {/* Demand */}
                        <div>
                            <div className="flex justify-between text-xs mb-1 font-bold">
                                <span className="text-red-600">DEMAND</span>
                                <span className="text-gray-700">{forecast.demand_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${forecast.demand_score}%` }}></div>
                            </div>
                        </div>
                        {/* Supply */}
                        <div>
                            <div className="flex justify-between text-xs mb-1 font-bold">
                                <span className="text-green-600">SUPPLY</span>
                                <span className="text-gray-700">{forecast.supply_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${forecast.supply_score}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Search */}
            <div className="flex gap-2 mt-6">
                <input 
                    type="text" 
                    placeholder="Search City..." 
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <button 
                    onClick={handleManualSearch}
                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
                >
                    Go
                </button>
            </div>
          </div>

          {/* RIGHT: AI Sentinel */}
          <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-center border border-gray-800">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
              
              <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl animate-pulse">🔮</span>
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white tracking-wide">
                      AI Sentinel Forecast
                  </h2>
              </div>

              {forecast ? (
                  <div className="animate-fade-in space-y-4 relative z-10">
                    <p className="text-3xl font-bold text-white">{forecast.trend}</p>
                    <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-yellow-500 backdrop-blur-sm">
                        <p className="text-gray-300 italic">"{forecast.advice}"</p>
                    </div>
                    <div className="flex justify-between items-end border-t border-gray-700 pt-4">
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Fair Market Price</span>
                        <p className="text-2xl font-mono text-green-400 font-bold">₹{forecast.fair_price} <span className="text-sm text-gray-500">/kWh</span></p>
                    </div>
                  </div>
              ) : (
                  <div className="flex flex-col justify-center items-center h-32 text-center opacity-70">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-400 font-mono text-sm">Establishing Neural Link...</p>
                  </div>
              )}
          </div>
      </div>

      {/* --- LISTINGS SECTION --- */}
      <div className="max-w-7xl mx-auto">
          
          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-2xl font-bold text-gray-800">Available Energy</h3>
             <div className="flex gap-2">
                {["All", "Solar", "Wind"].map((type) => (
                    <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition ${
                        filter === type 
                        ? "bg-green-600 text-white shadow-md" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                    >
                    {type}
                    </button>
                ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No listings found for this category.</p>
                </div>
            ) : (
                filteredListings.map((item) => {
                    // CALCULATION LOGIC PRESERVED
                    const dynamicPrice = parseFloat((item.pricePerKwh * marketMultiplier).toFixed(2));
                    const aiScore = forecast ? getDealScore(dynamicPrice, forecast.fair_price) : null;

                    return (
                    <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                        
                        {/* Type Header */}
                        <div className={`h-24 p-4 flex justify-between items-start ${
                            item.energyType === 'Wind' ? 'bg-gradient-to-br from-blue-50 to-cyan-50' : 'bg-gradient-to-br from-yellow-50 to-orange-50'
                        }`}>
                            <span className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide text-gray-700">
                                {item.energyType}
                            </span>
                            {/* AI BADGE */}
                            {aiScore && (
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-sm ${aiScore.color}`}>
                                    {aiScore.label}
                                </span>
                            )}
                        </div>

                        {/* Card Body */}
                        <div className="p-6 pt-2">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Volume</p>
                                    <h3 className="text-3xl font-extrabold text-gray-900">{item.energyAmount} <span className="text-lg text-gray-400 font-medium">kWh</span></h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Dynamic Rate</p>
                                    <h3 className={`text-2xl font-bold ${marketMultiplier > 1 ? "text-red-600" : "text-green-600"}`}>
                                        ₹{dynamicPrice}
                                    </h3>
                                    {marketMultiplier !== 1 && (
                                        <p className="text-[10px] text-gray-400 line-through">Base: ₹{item.pricePerKwh}</p>
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
                                    onClick={() => handleBuyClick(item, dynamicPrice)}
                                    className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition transform active:scale-95 ${
                                        marketMultiplier > 1.5 ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"
                                    }`}
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })
            )}
          </div>
      </div>
    </div>
  );
};

export default MarketPage;