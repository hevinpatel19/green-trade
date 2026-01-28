import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import UserContext from "../context/UserContext";

const WEATHER_API_KEY = "2cf62494edaa9494d7c2025ddede5a9e";

const COUNTRIES = [
  { code: "IN", flag: "🇮🇳" }, { code: "US", flag: "🇺🇸" },
  { code: "GB", flag: "🇬🇧" }, { code: "FR", flag: "🇫🇷" },
  { code: "DE", flag: "🇩🇪" }, { code: "AU", flag: "🇦🇺" },
  { code: "", flag: "🌍" }
];

const formatTimeWithOffset = (unixTimestamp, timezoneOffsetSeconds) => {
  const utcMs = unixTimestamp * 1000;
  const cityMs = utcMs + timezoneOffsetSeconds * 1000;
  const cityDate = new Date(cityMs);
  return cityDate.getUTCHours().toString().padStart(2, "0") + ":" + cityDate.getUTCMinutes().toString().padStart(2, "0");
};

const selectBestGeoMatch = (results, searchCity) => {
  if (!results || !results.length) return null;
  const search = searchCity.toLowerCase().trim();
  return results.find(r => r.name.toLowerCase().includes(search)) || results[0];
};

const Dashboard = () => {
  const { user } = useContext(UserContext);

  // --- State ---
  const [cityInput, setCityInput] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [consumption, setConsumption] = useState(15);
  const [sellAmount, setSellAmount] = useState(""); // ✅ NEW: Manual energy amount to list

  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [advisorTip, setAdvisorTip] = useState(null);

  const [basePrice, setBasePrice] = useState("");
  const [isAuction, setIsAuction] = useState(false);
  const [auctionDuration, setAuctionDuration] = useState(24);
  const [myListings, setMyListings] = useState([]);

  useEffect(() => {
    if (user) fetchListings();
  }, [user]);

  const fetchListings = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/market/mylistings/${user.email}`);
      setMyListings(res.data);
    } catch (e) { console.error(e); }
  };

  const processWeather = async (lat, lon, displayLoc) => {
    setLoading(true);
    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&cnt=8`;

      const [weatherRes, forecastRes] = await Promise.all([axios.get(weatherUrl), axios.get(forecastUrl)]);
      const d = weatherRes.data;

      setWeatherData({
        location: displayLoc || d.name + ", " + d.sys.country,
        temp: d.main.temp,
        clouds: d.clouds.all,
        sunrise: formatTimeWithOffset(d.sys.sunrise, d.timezone),
        sunset: formatTimeWithOffset(d.sys.sunset, d.timezone)
      });

      const forecastPoints = forecastRes.data.list.map((i) => ({
        dt: i.dt, temp: i.main.temp, humidity: i.main.humidity, clouds: i.clouds.all
      }));

      const aiRes = await axios.post("http://localhost:5001/predict-energy-forecast", {
        forecast: forecastPoints,
        sunrise: d.sys.sunrise,
        sunset: d.sys.sunset,
        timezone_offset: d.timezone,
        expected_consumption_24h: parseFloat(consumption)
      });

      setPredictionData({
        generated: aiRes.data.total_generated,
        consumed: aiRes.data.user_consumption,
        net: aiRes.data.net_energy
      });
      setSellAmount(aiRes.data.net_energy > 0 ? aiRes.data.net_energy : ""); // Pre-fill with max excess
      setAdvisorTip(aiRes.data.advisor);

    } catch (e) {
      toast.error("AI server error. Check port 5001.");
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!cityInput.trim()) return toast.error("Enter a city name");
    setLoading(true);
    try {
      const query = countryCode ? `${cityInput},${countryCode}` : cityInput;
      const geoRes = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${WEATHER_API_KEY}`);
      if (!geoRes.data.length) {
        toast.error("City not found");
        setLoading(false);
        return;
      }
      const match = selectBestGeoMatch(geoRes.data, cityInput);
      processWeather(match.lat, match.lon, `${match.name}, ${match.country}`);
    } catch (e) {
      toast.error("Search failed");
      setLoading(false);
    }
  };

  const handleListEnergy = async (e) => {
    e.preventDefault();
    if (!predictionData || !basePrice || !sellAmount) return;

    // ✅ VALIDATION: Ensure they aren't selling more than they have
    if (parseFloat(sellAmount) > predictionData.net) {
      return toast.error(`Maximum excess available is ${predictionData.net} kWh`);
    }

    try {
      await axios.post("http://localhost:5000/api/market/list", {
        sellerAddress: user.email,
        energyAmount: parseFloat(sellAmount), // Use manual input
        pricePerKwh: parseFloat(basePrice),
        energyType: "Solar",
        source: "AI Prediction",
        isAuction: isAuction,
        durationHours: isAuction ? auctionDuration : null
      });
      toast.success("Listed Successfully!");
      fetchListings();
    } catch (e) { toast.error("Listing error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete listing?")) return;
    try {
      await axios.delete("http://localhost:5000/api/market/" + id);
      setMyListings((prev) => prev.filter((i) => i._id !== id));
    } catch (e) { toast.error("Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Seller Dashboard ⚡</h1>
            <p className="text-gray-500">Real-time solar forecasting & peer-to-peer trading.</p>
          </div>
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-bold">{user?.role || "Trader"}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT: AI & WEATHER */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🤖 Smart Market AI
            </h2>

            <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Expected Consumption (Next 24 hours) (kWh)</label>
                <input
                  type="number" value={consumption} onChange={(e) => setConsumption(e.target.value)}
                  className="w-full mt-1 p-3 bg-white border border-gray-300 rounded-lg font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Enter City" value={cityInput} onChange={(e) => setCityInput(e.target.value)} className="flex-1 p-3 border rounded-lg focus:outline-none" />
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-20 p-3 border rounded-lg bg-white">
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag}</option>)}
                </select>
              </div>
              <button onClick={handleSearch} disabled={loading} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all">
                {loading ? "Analyzing Data..." : "🔍 Run AI Forecast"}
              </button>
            </div>

            {predictionData && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center text-sm bg-blue-50 p-4 rounded-lg text-blue-800 font-medium border border-blue-100">
                  <span>📍 {weatherData?.location}</span>
                  <span>{weatherData?.temp.toFixed(1)}°C | ☁️ {weatherData?.clouds}%</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Generated</p>
                    <p className="text-xl font-black text-green-700">{predictionData.generated} <span className="text-xs">kWh</span></p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Consumed</p>
                    <p className="text-xl font-black text-red-700">{predictionData.consumed} <span className="text-xs">kWh</span></p>
                  </div>
                  <div className={`p-4 rounded-xl text-center border ${predictionData.net > 0 ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-gray-100 border-gray-300"}`}>
                    <p className="text-xs text-gray-500 font-bold uppercase">Available Excess</p>
                    <p className={`text-xl font-black ${predictionData.net > 0 ? "text-indigo-700" : "text-gray-400"}`}>
                      {predictionData.net} <span className="text-xs">kWh</span>
                    </p>
                  </div>
                </div>

                <div className={`p-5 rounded-xl text-white shadow-lg transition-all ${predictionData.net > 0 ? "bg-indigo-600" : "bg-red-500"}`}>
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-2">💡 AI Strategic Advisor</h3>
                  <p className="text-sm font-medium leading-relaxed">{advisorTip?.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: PRICING + SELLER INPUTS */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                ⚡ List Energy to Market
              </h2>

              {predictionData?.net > 0 ? (
                <form onSubmit={handleListEnergy} className="space-y-6">
                  {/* ✅ Manual Seller Input: Energy Amount */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="text-sm font-bold text-gray-600">Energy to Sell (kWh)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        required
                        className="flex-1 p-3 bg-white border border-gray-300 rounded-lg font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter amount to sell"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-600">Base Price (₹/kWh)</label>
                    <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required min="1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg mt-1" placeholder="e.g. 10" />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <input type="checkbox" id="auction" checked={isAuction} onChange={(e) => setIsAuction(e.target.checked)} className="w-5 h-5 accent-green-600" />
                      <label htmlFor="auction" className="font-bold text-gray-800 cursor-pointer">Enable Auction Mode</label>
                    </div>
                    {isAuction && (
                      <select value={auctionDuration} onChange={(e) => setAuctionDuration(e.target.value)} className="p-2 border rounded-lg text-sm font-bold">
                        <option value="12">12 hrs</option>
                        <option value="24">24 hrs</option>
                        <option value="48">48 hrs</option>
                      </select>
                    )}
                  </div>

                  <button className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-lg transition-all transform hover:-translate-y-1">
                    {isAuction ? "🔨 Start Auction" : `🚀 Sell ${sellAmount || 0} kWh for ₹${(basePrice * (advisorTip?.max_multiplier || 1)).toFixed(1)}`}
                  </button>
                </form>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-gray-50 px-6 text-center">
                  <p className="text-gray-400 font-medium leading-relaxed">
                    {predictionData?.net <= 0
                      ? "⚠️ Current generation doesn't cover your consumption. Adjust your daily use to create a surplus."
                      : "Run AI Forecast to unlock market listing tools."}
                  </p>
                </div>
              )}
            </div>

            {/* Inventory Table */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">📦 Your Active Listings</h3>
              {myListings.length === 0 ? (
                <p className="text-gray-400 italic text-sm">No active listings found.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                      <tr>
                        <th className="px-4 py-3 text-center">Energy</th>
                        <th className="px-4 py-3 text-center">Price</th>
                        <th className="px-4 py-3 text-center text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {myListings.map(item => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 font-bold text-gray-900 text-center">{item.energyAmount} kWh</td>
                          <td className="px-4 py-4 font-bold text-green-600 text-center">₹{item.pricePerKwh}</td>
                          <td className="px-4 py-4 text-right pr-6">
                            <button onClick={() => handleDelete(item._id)} className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1 rounded font-bold text-xs uppercase">Delete</button>
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
    </div>
  );
};

export default Dashboard;