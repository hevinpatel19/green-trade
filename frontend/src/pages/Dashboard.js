import React, { useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [prediction, setPrediction] = useState(null);
  const [marketInfo, setMarketInfo] = useState({ multiplier: 1, status: "" });
  const [advisorTip, setAdvisorTip] = useState(null); // <--- NEW STATE FOR ADVISOR
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [basePrice, setBasePrice] = useState(""); 
  const [status, setStatus] = useState("");
  const [cityInput, setCityInput] = useState("");

  const WEATHER_API_KEY = "2cf62494edaa9494d7c2025ddede5a9e"; 

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
      
      const aiRes = await axios.post("http://localhost:5001/predict-energy", {
        temperature: main.temp,
        humidity: main.humidity,
        cloud_cover: clouds.all
      });

      setPrediction(aiRes.data.predicted_energy);
      
      // Save Market & Advisor Data
      setMarketInfo({
        multiplier: aiRes.data.price_multiplier,
        status: aiRes.data.market_status
      });
      setAdvisorTip(aiRes.data.advisor); // <--- SAVE TIP

      setStatus("✅ Analysis Complete!");

    } catch (error) {
      console.error(error);
      alert("Failed to fetch data.");
    }
    setLoading(false);
  };

  const handleManualSearch = () => {
    if (!cityInput) return alert("Please enter a city name");
    setLoading(true);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&appid=${WEATHER_API_KEY}&units=metric`;
    processWeatherAndPredict(url);
  };

  const handleAutoPredict = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLoading(true);
    setStatus("📍 Detecting Location...");
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
      processWeatherAndPredict(url);
    }, () => setLoading(false));
  };

  const handleListEnergy = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem("userInfo"));
      if (!user) return alert("Please Login");

      // 1. DEFINE THE VARIABLE (This was missing!)
      const finalPriceString = (basePrice * marketInfo.multiplier).toFixed(2);
      const finalPriceNumber = parseFloat(finalPriceString); 

      // 2. SEND THE REQUEST
      await axios.post("http://localhost:5000/api/energy/list", {
        sellerAddress: user.email,
        energyAmount: prediction, 
        pricePerKwh: finalPriceNumber // <--- Now it exists!
      });

      alert(`✅ Listed at Dynamic Price: ₹${finalPriceNumber}`);
      
      // 3. CLEAN UP
      setPrediction(null);
      setWeatherData(null);
      setBasePrice("");
      setAdvisorTip(null);
      
    } catch (error) {
      console.error("Full Error Object:", error);
      // Capture the specific backend error message
      const serverMessage = error.response?.data?.detailed_error || error.message;
      alert(`❌ ERROR: ${serverMessage}`);
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
      
      {/* LEFT: AI MODULE */}
      <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl shadow-lg border border-blue-100 h-fit">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">🤖 Smart Market AI</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Analyzes weather to predict output and adjust prices dynamically.
        </p>
        
        {!weatherData ? (
          <div className="space-y-4">
             <input type="text" placeholder="Enter City" value={cityInput} onChange={(e) => setCityInput(e.target.value)} className="w-full p-3 border rounded-lg"/>
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

            {/* AI MARKET INSIGHT */}
            <div className={`p-4 rounded-lg border text-center ${marketInfo.multiplier > 1 ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
               <p className="font-bold text-lg">{marketInfo.status}</p>
               <p className="text-sm">Price Multiplier: <b>{marketInfo.multiplier}x</b></p>
            </div>

            {/* --- NEW: AI STRATEGY ADVISOR CARD --- */}
            {advisorTip && (
                <div className="mt-4 bg-indigo-900 text-white p-6 rounded-xl shadow-xl border-l-8 border-yellow-400 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white opacity-10"></div>
                    
                    <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-lg text-2xl">💡</div>
                        <div>
                            <h3 className="font-bold text-lg text-yellow-300">AI Strategy Advisor</h3>
                            <p className="text-indigo-100 text-xs mt-1">
                                Optimization Engine Analysis:
                            </p>
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
            
            <button onClick={() => {setWeatherData(null); setPrediction(null); setAdvisorTip(null);}} className="text-sm text-gray-500 underline w-full text-center mt-4">Reset</button>
          </div>
        )}
      </div>

      {/* RIGHT: DYNAMIC PRICING MODULE */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 h-fit">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">⚡ Dynamic Pricing</h2>
        {prediction ? (
          <form onSubmit={handleListEnergy} className="space-y-6">
             
            <div>
              <label className="block text-gray-700 font-bold mb-2">Your Base Price (₹)</label>
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. 10" required />
            </div>

            {/* DYNAMIC PRICE PREVIEW */}
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

            <button className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition shadow-lg">
              Confirm Listing at ₹{basePrice ? (basePrice * marketInfo.multiplier).toFixed(2) : "0"}
            </button>
          </form>
        ) : (
            <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Waiting for Analysis...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;