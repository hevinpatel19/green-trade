import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Market = () => {
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/energy/feed");
      setListings(res.data.filter(item => !item.isSold));
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  // Clean Navigation Logic
  const handleBuyClick = (item) => {
    navigate("/checkout", { state: { item } });
  };

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Energy Market</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {listings.map((item) => (
          <div key={item._id} className="bg-white p-6 shadow-md hover:shadow-xl rounded-xl transition border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">SOLAR</span>
                <h3 className="text-lg font-bold mt-1 text-gray-800">Energy Bundle</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">₹{item.pricePerKwh}</p>
            </div>
            
            <div className="text-gray-500 text-sm mb-6 space-y-1">
              <p>Capacity: <span className="font-bold text-gray-700">{item.energyAmount} kWh</span></p>
              <p>Total Cost: <span className="font-bold text-gray-700">₹{item.pricePerKwh * item.energyAmount}</span></p>
            </div>

            <button 
              onClick={() => handleBuyClick(item)}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
      
      {listings.length === 0 && <p className="text-center text-gray-400 mt-12">No listings available.</p>}
    </div>
  );
};

export default Market;