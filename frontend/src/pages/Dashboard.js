import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import UserContext from "../context/UserContext";

const Dashboard = () => {
  const { user } = useContext(UserContext);

  // --- EXISTING AI STATES ---
  const [prediction, setPrediction] = useState(null);
  const [marketInfo, setMarketInfo] = useState({ multiplier: 1, status: "" });
  const [advisorTip, setAdvisorTip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [basePrice, setBasePrice] = useState("");
  const [isAuction, setIsAuction] = useState(false);
  const [auctionDuration, setAuctionDuration] = useState(24);
  const [status, setStatus] = useState("");
  const [cityInput, setCityInput] = useState("");

  // --- NEW INVENTORY STATES ---
  const [myListings, setMyListings] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const WEATHER_API_KEY = "2cf62494edaa9494d7c2025ddede5a9e";

  // 1. Fetch Inventory on Load
  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      // Ensure this matches your backend route
      const res = await axios.get(`http://localhost:5000/api/market/mylistings/${user.email}`);
      setMyListings(res.data);
      setInventoryLoading(false);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setInventoryLoading(false);
    }
  };

  // --- AI LOGIC ---
  const processWeatherAndPredict = async (weatherUrl) => {
    try {
      setStatus("🌤️ Analyzing Weather & Market...");
      const weatherRes = await axios.get(weatherUrl);
      const { main, clouds, name } = weatherRes.data;

      setWeatherData({
        location: name,
        temp: main.temp,
        humidity: main.humidity,
        clouds: clouds.all
      });

      setStatus("🤖 AI Running Simulation...");

      // Wrap in try-catch to fallback if Python AI is offline
      try {
        const aiRes = await axios.post("http://localhost:5001/predict-energy", {
          temperature: main.temp,
          humidity: main.humidity,
          cloud_cover: clouds.all
        });

        setPrediction(aiRes.data.predicted_energy);
        setMarketInfo({
          multiplier: aiRes.data.price_multiplier,
          status: aiRes.data.market_status
        });
        setAdvisorTip(aiRes.data.advisor);
      } catch (aiError) {
        console.warn("AI Service Unavailable, using defaults");
        setPrediction(150); // Fallback dummy value
        setMarketInfo({ multiplier: 1.0, status: "Standard Rate" });
      }

      setStatus("✅ Analysis Complete!");

    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch weather data.");
    }
    setLoading(false);
  };

  const handleManualSearch = () => {
    if (!cityInput) return toast.error("Please enter a city name");
    setLoading(true);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&appid=${WEATHER_API_KEY}&units=metric`;
    processWeatherAndPredict(url);
  };

  const handleAutoPredict = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLoading(true);
    setStatus("📍 Detecting Location...");
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
      processWeatherAndPredict(url);
    }, () => setLoading(false));
  };

  // --- UPDATED LISTING LOGIC ---
  const handleListEnergy = async (e) => {
    e.preventDefault();
    try {
      if (!user) return toast.error("Please Login");

      const finalPriceString = (basePrice * marketInfo.multiplier).toFixed(2);
      const finalPriceNumber = parseFloat(finalPriceString);

      // ✅ FIX 1: URL changed from /create to /list
      // ✅ FIX 2: key changed from sellerEmail to sellerAddress
      await axios.post("http://localhost:5000/api/market/list", {
        sellerAddress: user.email,
        energyAmount: Number(prediction || 100),
        pricePerKwh: finalPriceNumber,
        energyType: "Solar",
        source: "AI Prediction",
        isAuction: isAuction,
        durationHours: isAuction ? auctionDuration : null
      });


      toast.success(`Listed at Dynamic Price: ₹${finalPriceNumber}`);

      // Refresh Inventory & Reset
      fetchMyListings();
      setPrediction(null);
      setWeatherData(null);
      setBasePrice("");
      setAdvisorTip(null);
      setIsAuction(false);
      setAuctionDuration(24);

    } catch (error) {
      console.error("Listing Error:", error);
      const serverMessage = error.response?.data?.message || error.message;
      toast.error(`ERROR: ${serverMessage}`);
    }
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Listing?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it'
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`http://localhost:5000/api/market/${id}`);
      setMyListings(myListings.filter(item => item._id !== id));
      toast.success("Listing deleted");
    } catch (err) {
      toast.error("Error deleting item");
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Command Center</h1>
          <p className="text-gray-500">AI-Powered Listing & Asset Management</p>
        </div>
        <div className="text-right">
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold">
            Role: {user?.role || "Trader"}
          </span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* LEFT: AI MODULE */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl shadow-lg border border-blue-100 h-fit">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">🤖 Smart Market AI</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Analyzes weather to predict output and adjust prices dynamically.
          </p>

          {!weatherData ? (
            <div className="space-y-4">
              <input type="text" placeholder="Enter City" value={cityInput} onChange={(e) => setCityInput(e.target.value)} className="w-full p-3 border rounded-lg" />
              <button onClick={handleManualSearch} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Search Market</button>
              <button onClick={handleAutoPredict} className="w-full bg-blue-100 text-blue-700 py-3 rounded-lg font-bold">📍 Use Location</button>
              <p className="text-center text-blue-600 text-sm">{status}</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-gray-700 border-b pb-2">📍 {weatherData.location}</h3>
                <div className="flex justify-between mt-2 text-sm">
                  <span>Temp: <b>{weatherData.temp}°C</b></span>
                  <span>Clouds: <b>{weatherData.clouds}%</b></span>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
                <p className="text-green-800 font-medium">Daily Potential</p>
                <p className="text-4xl font-extrabold text-green-700">{prediction} kWh</p>
              </div>

              <div className={`p-4 rounded-lg border text-center ${marketInfo.multiplier > 1 ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
                <p className="font-bold text-lg">{marketInfo.status}</p>
                <p className="text-sm">Price Multiplier: <b>{marketInfo.multiplier}x</b></p>
              </div>

              {advisorTip && (
                <div className="mt-4 bg-indigo-900 text-white p-6 rounded-xl shadow-xl border-l-8 border-yellow-400 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white opacity-10"></div>
                  <div className="flex items-start gap-4">
                    <div className="bg-white/20 p-3 rounded-lg text-2xl">💡</div>
                    <div>
                      <h3 className="font-bold text-lg text-yellow-300">AI Strategy Advisor</h3>
                      <p className="text-indigo-100 text-xs mt-1">Optimization Engine Analysis:</p>
                      <div className="mt-2 font-mono text-xl font-bold">
                        Sell at <span className="text-yellow-300">{advisorTip.best_hour}:00</span>
                      </div>
                      <p className="text-xs text-indigo-300 mt-1">
                        Predicted Rate Surge: <span className="text-white font-bold">{advisorTip.max_multiplier}x</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={() => { setWeatherData(null); setPrediction(null); setAdvisorTip(null); }} className="text-sm text-gray-500 underline w-full text-center mt-4">Reset Analysis</button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRICING + INVENTORY */}
        <div className="space-y-8">

          {/* 1. DYNAMIC PRICING MODULE */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚡ Dynamic Pricing</h2>
            {prediction ? (
              <form onSubmit={handleListEnergy} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Your Base Price (₹)</label>
                  <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. 10" required />
                </div>

                {basePrice && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm">Base Price:</span>
                      <span className="font-bold">₹{basePrice}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm">Weather Surge:</span>
                      <span className="font-bold text-blue-600">x {marketInfo.multiplier}</span>
                    </div>
                    <div className="border-t border-yellow-200 my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-bold">Final Listing Price:</span>
                      <span className="text-2xl font-extrabold text-green-700">₹{(basePrice * marketInfo.multiplier).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Auction Mode Toggle */}
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center h-5">
                    <input
                      id="auctionToggle" type="checkbox"
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      checked={isAuction}
                      onChange={e => setIsAuction(e.target.checked)}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="auctionToggle" className="font-bold text-gray-800 cursor-pointer">Enable Auction Mode</label>
                    <p className="text-xs text-gray-500">Allow buyers to bid on your energy listing.</p>
                  </div>
                  {isAuction && (
                    <div className="w-1/3">
                      <label className="text-xs font-bold text-gray-500 uppercase">Duration: {auctionDuration}h</label>
                      <input
                        type="range" min="1" max="48"
                        value={auctionDuration}
                        onChange={e => setAuctionDuration(Number(e.target.value))}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <button className={`w-full text-white py-4 rounded-lg font-bold transition shadow-lg ${isAuction ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}>
                  {isAuction ? `🔨 Start Auction at ₹${basePrice ? (basePrice * marketInfo.multiplier).toFixed(2) : "0"}` : `Confirm Listing at ₹${basePrice ? (basePrice * marketInfo.multiplier).toFixed(2) : "0"}`}
                </button>
              </form>
            ) : (
              <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Waiting for AI Prediction...</p>
              </div>
            )}
          </div>

          {/* 2. ACTIVE INVENTORY */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Your Active Listings</h2>

            {inventoryLoading ? <p>Loading inventory...</p> : myListings.length === 0 ? (
              <p className="text-gray-500 italic">No active listings.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Energy</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myListings.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-3 font-bold">{item.energyAmount} kWh</td>
                        <td className="px-4 py-3 text-green-600 font-bold">₹{item.pricePerKwh}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-100 bg-red-50 px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;