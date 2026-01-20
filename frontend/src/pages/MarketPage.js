import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MarketPage = () => {
  const [listings, setListings] = useState([]);
  const [marketMultiplier, setMarketMultiplier] = useState(1.0);
  const [marketStatus, setMarketStatus] = useState("Enter Location 🌍");
  const [forecast, setForecast] = useState(null); 
  const [cityInput, setCityInput] = useState(""); 
  const navigate = useNavigate();

  const WEATHER_API_KEY = "2cf62494edaa9494d7c2025ddede5a9e"; 

  useEffect(() => {
    fetchListings();
    // Try Auto-Location on load
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchMarketConditions(pos.coords.latitude, pos.coords.longitude),
            () => setMarketStatus("Enter Location Manually 🌍")
        );
    }
  }, []);

  const fetchListings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/energy/feed");
      setListings(res.data.filter(item => !item.isSold));
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  // --- CORE AI FUNCTION ---
  const fetchMarketConditions = async (lat, lon) => {
    try {
        setMarketStatus("AI Analyzing...");
        
        const weatherRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
        );

        // 1. Get Surge Multiplier (Physics)
        const aiRes = await axios.post("http://localhost:5001/predict-energy", {
            temperature: weatherRes.data.main.temp,
            humidity: weatherRes.data.main.humidity,
            cloud_cover: weatherRes.data.clouds.all
        });

        // 2. Get Live Economics (Supply vs Demand)
        const forecastRes = await axios.post("http://localhost:5001/market-forecast", {
            temperature: weatherRes.data.main.temp,
            cloud_cover: weatherRes.data.clouds.all
        });

        setMarketMultiplier(aiRes.data.price_multiplier);
        setMarketStatus(forecastRes.data.condition || aiRes.data.market_status);
        setForecast(forecastRes.data); 

    } catch (error) {
        console.error("Market Error:", error);
        setMarketStatus("AI Offline");
    }
  };

  // --- MANUAL SEARCH HANDLER ---
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

  const handleBuyClick = (item, dynamicPrice) => {
    const updatedItem = { ...item, pricePerKwh: dynamicPrice };
    navigate("/checkout", { state: { item: updatedItem } });
  };

  // --- HELPER: AI SCORING ---
  const getDealScore = (price, fairPrice) => {
    if (!fairPrice) return { label: "Analyzing...", color: "text-gray-400" };
    const ratio = price / fairPrice;
    if (ratio <= 0.9) return { label: "🔥 STEAL DEAL", color: "text-green-600 bg-green-100" };
    if (ratio <= 1.1) return { label: "✅ FAIR VALUE", color: "text-blue-600 bg-blue-100" };
    return { label: "⚠️ OVERPRICED", color: "text-red-600 bg-red-100" };
  };

  return (
    <div className="p-10 max-w-7xl mx-auto">
      
      {/* --- MARKET HUD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          
          {/* LEFT: Live Market & Economics */}
          <div className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between ${marketMultiplier > 1 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    📊 Live Index
                    <span className="text-sm font-normal bg-white/50 px-2 py-1 rounded border shadow-sm">
                        {marketMultiplier}x
                    </span>
                </h2>
                <p className="mt-1 text-sm text-gray-600 font-medium mb-4">{marketStatus}</p>
                
                {/* --- RESTORED: SUPPLY VS DEMAND DETAILS --- */}
                {forecast && forecast.supply_score && (
                    <div className="mb-4 space-y-3 bg-white/60 p-3 rounded-lg border border-white/50">
                        {/* Demand Bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-red-600">Demand</span>
                                <span className="font-bold text-gray-700">{forecast.demand_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-red-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${forecast.demand_score}%` }}></div>
                            </div>
                        </div>
                        {/* Supply Bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-green-600">Supply</span>
                                <span className="font-bold text-gray-700">{forecast.supply_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${forecast.supply_score}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Search Bar */}
            <div className="flex gap-2 mt-2">
                <input 
                    type="text" 
                    placeholder="Enter City..." 
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm shadow-sm"
                />
                <button 
                    onClick={handleManualSearch}
                    className="bg-gray-800 text-white px-4 py-2 rounded font-bold hover:bg-gray-700 text-sm shadow-md transition"
                >
                    Go
                </button>
            </div>
          </div>

          {/* RIGHT: AI Sentinel (The Design you Liked) */}
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-center border border-gray-700">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl animate-pulse">🔮</div>
             <h2 className="text-xl font-bold text-yellow-400 mb-2 tracking-wide">AI Sentinel Forecast</h2>
             {forecast ? (
                 <div className="animate-fade-in space-y-3">
                    <p className="text-2xl font-bold">{forecast.trend}</p>
                    <p className="text-gray-300 text-sm italic border-l-2 border-yellow-500 pl-3">"{forecast.advice}"</p>
                    <div className="pt-3 border-t border-gray-700">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Physics-Based Fair Price</p>
                        <p className="text-lg font-mono text-green-400">₹{forecast.fair_price} <span className="text-xs text-gray-500">/ kWh</span></p>
                    </div>
                 </div>
             ) : (
                 <div className="flex flex-col justify-center h-24 text-center">
                    <p className="text-gray-400 animate-pulse font-medium">Connecting to Neural Network...</p>
                    <p className="text-xs text-gray-600 mt-2">Waiting for location data</p>
                 </div>
             )}
          </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
        Smart Listings <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Live Feed</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {listings.map((item) => {
            // Apply Live Multiplier
            const dynamicPrice = parseFloat((item.pricePerKwh * marketMultiplier).toFixed(2));
            const aiScore = forecast ? getDealScore(dynamicPrice, forecast.fair_price) : null;

            return (
              <div key={item._id} className="bg-white p-6 shadow-md hover:shadow-xl rounded-xl transition-all duration-300 border border-gray-100 relative group">
                
                {/* AI BADGE (With Animation) */}
                {aiScore && (
                    <div className={`absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm ${aiScore.color} opacity-90 group-hover:opacity-100 transition`}>
                        {aiScore.label}
                    </div>
                )}

                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className="bg-blue-50 text-blue-600 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold border border-blue-100">Solar Bundle</span>
                    <h3 className="text-lg font-bold mt-2 text-gray-800 group-hover:text-blue-600 transition">Energy Unit</h3>
                    <p className="text-xs text-gray-400">Seller: {item.sellerAddress.substring(0,6)}...</p>
                  </div>
                </div>
                
                <div className="text-gray-500 text-sm mb-6 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex justify-between">
                    <span>Capacity</span>
                    <span className="font-bold text-gray-700">{item.energyAmount} kWh</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span>Live Price</span>
                    <div className="text-right">
                        <span className={`text-2xl font-extrabold ${marketMultiplier > 1 ? "text-red-600" : "text-green-600"}`}>
                            ₹{dynamicPrice}
                        </span>
                        {marketMultiplier !== 1 && (
                            <p className="text-[10px] text-gray-400 line-through">Base: ₹{item.pricePerKwh}</p>
                        )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleBuyClick(item, dynamicPrice)}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-transform active:scale-95 shadow-md ${
                      marketMultiplier > 1.5 ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {marketMultiplier > 1.5 ? "Buy Now (High Demand)" : "Buy Now"}
                </button>
              </div>
            );
        })}
      </div>
      
      {listings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No active listings in the market.</p>
            <button className="mt-2 text-blue-600 underline text-sm" onClick={fetchListings}>Refresh Feed</button>
          </div>
      )}
    </div>
  );
};

export default MarketPage;