import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import UserContext from "../context/UserContext";

const HomePage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalVolume: 0, avgPrice: 0, activeListings: 0 });

  // Fetch Live Platform Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/market/stats");
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate("/market");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden bg-gray-900 text-white">
        {/* Background Blob Animation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-600 rounded-full blur-[120px] opacity-20 animate-pulse"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold mb-6 tracking-wide uppercase">
            🚀 Live Energy Trading Platform
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">P2P Energy</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
            Trade solar & wind energy directly with your neighbors. No middlemen. 
            AI-driven pricing. Instant blockchain settlements.
          </p>
          
          <div className="mt-10 flex justify-center gap-4">
            <button 
              onClick={handleGetStarted}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 rounded-full font-bold text-lg transition shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              Start Trading Now
            </button>
            <Link 
              to="/market"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-full font-bold text-lg border border-gray-700 transition"
            >
              View Live Market
            </Link>
          </div>
        </div>

        {/* --- LIVE TICKER BAR --- */}
        <div className="border-t border-gray-800 bg-black/30 backdrop-blur-md">
            <div className="max-w-7xl mx-auto grid grid-cols-3 divide-x divide-gray-800 text-center py-6">
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Total Volume Traded</p>
                    <p className="text-3xl font-mono font-bold text-white">{stats.totalVolume} <span className="text-sm text-gray-500">kWh</span></p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Current Market Rate</p>
                    <p className="text-3xl font-mono font-bold text-green-400">₹{stats.avgPrice} <span className="text-sm text-gray-500">/unit</span></p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Active Listings</p>
                    <p className="text-3xl font-mono font-bold text-blue-400">{stats.activeListings}</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- FEATURE GRID --- */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900">Why GreenTrade?</h2>
                <p className="text-gray-500 mt-2">A completely decentralized energy ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition duration-300">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl mb-6">🤖</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI Price Forecasting</h3>
                    <p className="text-gray-500">
                        Our Neural Network analyzes weather patterns to predict energy spikes, ensuring you buy low and sell high.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition duration-300">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl mb-6">⚡</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Instant P2P Trading</h3>
                    <p className="text-gray-500">
                        Bypass the main grid. Trade surplus solar energy directly with other users in your local cluster.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition duration-300">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-3xl mb-6">🔐</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Transparent</h3>
                    <p className="text-gray-500">
                        Every transaction is verified. Sellers get paid instantly, and buyers get certified green energy.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* --- HOW IT WORKS (New Section) --- */}
      <div className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6">
                    <div className="text-6xl mb-4">🏠</div>
                    <h3 className="font-bold text-lg">1. Connect</h3>
                    <p className="text-gray-500 text-sm mt-2">Register your account and link your smart meter or wallet address.</p>
                </div>
                <div className="p-6">
                    <div className="text-6xl mb-4">☀️</div>
                    <h3 className="font-bold text-lg">2. List Energy</h3>
                    <p className="text-gray-500 text-sm mt-2">Have excess solar? List it on the market. Our AI suggests the best price.</p>
                </div>
                <div className="p-6">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="font-bold text-lg">3. Earn & Save</h3>
                    <p className="text-gray-500 text-sm mt-2">Get paid instantly for selling, or save money by buying cheaper green energy.</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- FOOTER (New Section) --- */}
      <footer className="bg-gray-900 text-gray-400 py-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
                <span className="text-green-500 font-bold text-xl">⚡ GreenTrade</span>
                <p className="text-xs mt-1">Decentralized Energy Trading Protocol</p>
            </div>
            <div className="flex gap-6 text-sm">
                <Link to="/market" className="hover:text-white transition">Market</Link>
                <Link to="/register" className="hover:text-white transition">Register</Link>
                <Link to="/login" className="hover:text-white transition">Login</Link>
            </div>
            <div className="text-xs mt-4 md:mt-0">
                © 2026 GreenTrade. All rights reserved.
            </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;