import React, { useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [listingData, setListingData] = useState({ pricePerKwh: "" });
  const [status, setStatus] = useState("");
  const [cityInput, setCityInput] = useState("");

  // 🔴 REPLACE WITH YOUR API KEY
  const WEATHER_API_KEY = "2cf62494edaa9494d7c2025ddede5a9e"; 

  const processWeatherAndPredict = async (weatherUrl) => {
    try {
      setStatus("🌤️ Fetching Weather Data...");
      const weatherRes = await axios.get(weatherUrl);
      const { main, clouds, name } = weatherRes.data;

      // We send the current weather, and the AI will extrapolate it for 24 hours
      setWeatherData({
        location: name,
        temp: main.temp,
        humidity: main.humidity,
        clouds: clouds.all
      });

      setStatus("🤖 Calculating 24-Hour Cycle...");
      
      const aiRes = await axios.post("http://localhost:5001/predict-energy", {
        temperature: main.temp,
        humidity: main.humidity,
        cloud_cover: clouds.all
        // Note: We don't send 'hour' anymore because the backend calculates ALL 24 hours
      });

      setPrediction(aiRes.data.predicted_energy);
      setStatus("✅ Forecast Complete!");

    } catch (error) {
      console.error(error);
      setStatus("❌ Error: Check API Key or Connection");
      alert("Failed to fetch data.");
    }
    setLoading(false);
  };

  // 1. Manual Search
  const handleManualSearch = () => {
    if (!cityInput) return alert("Please enter a city name");
    setLoading(true);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&appid=${WEATHER_API_KEY}&units=metric`;
    processWeatherAndPredict(url);
  };

  // 2. Auto Geolocation
  const handleAutoPredict = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      return;
    }
    setLoading(true);
    setStatus("📍 Detecting Location...");

    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
      processWeatherAndPredict(url);
    }, () => {
      setStatus("❌ Location Access Denied");
      setLoading(false);
    });
  };

  // 3. Sell Energy
  const handleListEnergy = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem("userInfo"));
      if (!user) return alert("Please Login");

      await axios.post("http://localhost:5000/api/energy/list", {
        sellerAddress: user.email,
        energyAmount: prediction, 
        pricePerKwh: listingData.pricePerKwh
      });
      alert("✅ Listed Successfully!");
      setPrediction(null);
      setWeatherData(null);
      setStatus("");
      setCityInput("");
    } catch (error) {
      alert("Listing Failed");
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
      
      {/* LEFT: AI MODULE */}
      <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl shadow-lg border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">🤖 AI Forecast (24h)</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Predicts total generation potential for the next 24 hours based on location.
        </p>
        
        {!weatherData ? (
          <div className="text-center space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter City (e.g. Surat)" 
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button onClick={handleManualSearch} disabled={loading} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
                Search
              </button>
            </div>
            <div className="relative flex py-2 items-center">
               <div className="flex-grow border-t border-gray-300"></div>
               <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
               <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <button onClick={handleAutoPredict} disabled={loading} className="w-full py-3 rounded-lg font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition border border-blue-200 flex justify-center items-center gap-2">
              📍 Use Current Location
            </button>
            <p className="text-sm text-blue-600 font-medium h-6">{status}</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">📍 {weatherData.location}</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div><p className="text-gray-400">Temp</p><p className="font-bold">{weatherData.temp}°C</p></div>
                <div><p className="text-gray-400">Humidity</p><p className="font-bold">{weatherData.humidity}%</p></div>
                <div><p className="text-gray-400">Clouds</p><p className="font-bold">{weatherData.clouds}%</p></div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
              <p className="text-green-800 font-medium mb-1">Total 24h Potential</p>
              <p className="text-5xl font-extrabold text-green-700">{prediction} <span className="text-xl text-green-600">kWh</span></p>
              <p className="text-xs text-green-600 mt-2">(Sum of projected hourly output)</p>
            </div>

            <button onClick={() => {setWeatherData(null); setPrediction(null); setStatus(""); setCityInput("");}} className="text-sm text-gray-500 underline hover:text-gray-800">
              Check Another Location
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: LISTING MODULE */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">⚡ Sell Energy</h2>
        {prediction ? (
          <form onSubmit={handleListEnergy} className="space-y-6">
             <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Available to Sell</p>
                <p className="text-xl font-bold text-gray-800">{prediction} kWh</p>
             </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Price per kWh (₹)</label>
              <input type="number" value={listingData.pricePerKwh} onChange={(e) => setListingData({ ...listingData, pricePerKwh: e.target.value })} className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. 12" required />
            </div>
            <button className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition shadow-lg">Confirm Listing 🚀</button>
          </form>
        ) : (
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
             <p className="text-gray-400 font-medium">Waiting for Forecast...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;