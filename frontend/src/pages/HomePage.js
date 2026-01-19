import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* 1. HERO SECTION (Welcome Banner) */}
      <div className="bg-green-50 py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-extrabold text-green-800 mb-6">
            The Future of <span className="text-black">Energy Trading</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Buy and sell solar energy directly from your neighbors. 
            Powered by <span className="font-bold text-blue-600">AI Price Predictions</span> 
            and secure payments.
          </p>
          
          <div className="flex justify-center gap-6">
            <Link to="/market" className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 shadow-lg transition transform hover:-translate-y-1">
              Buy Energy ⚡
            </Link>
            <Link to="/dashboard" className="bg-white text-green-700 border-2 border-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-50 shadow-lg transition transform hover:-translate-y-1">
              Sell Energy 💰
            </Link>
          </div>
        </div>
      </div>

      {/* 2. FEATURES SECTION (Why use this?) */}
      <div className="py-20 container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose GreenTrade?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Feature 1 */}
          <div className="p-8 border rounded-xl shadow-sm hover:shadow-xl transition text-center bg-white">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI-Powered Pricing</h3>
            <p className="text-gray-500">
              Our Machine Learning model analyzes market demand to automatically suggest the best selling price for your energy.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 border rounded-xl shadow-sm hover:shadow-xl transition text-center bg-white">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
            <p className="text-gray-500">
              Integrated with Stripe for fast, secure, and instant fiat currency transactions. No crypto wallets needed.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 border rounded-xl shadow-sm hover:shadow-xl transition text-center bg-white">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold mb-2">Eco-Friendly</h3>
            <p className="text-gray-500">
              Promote renewable energy adoption by efficiently trading surplus solar power within your local community.
            </p>
          </div>
        </div>
      </div>

      {/* 3. FOOTER */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <p className="text-gray-400">© 2026 GreenTrade Final Year Project. Built with MERN Stack & Python AI.</p>
      </footer>
    </div>
  );
};

export default HomePage;