import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import UserContext from "../context/UserContext"; // ✅ Use Context instead of localStorage
import { Link } from "react-router-dom";

const OrderPage = () => {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Stats State
  const [stats, setStats] = useState({ totalEnergy: 0, totalSpent: 0, saved: 0 });

  // Standard Govt Grid Price (Reference for savings calculation)
  const GOVT_GRID_RATE = 15.0; 

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      // ✅ FIX: Fetch from the Orders endpoint, NOT the Market Feed
      const res = await axios.get(`http://localhost:5000/api/orders/myorders/${user.email}`);
      
      setOrders(res.data);
      calculateAIStats(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };

  // --- AI ANALYTICS LOGIC ---
  const calculateAIStats = (data) => {
    let energy = 0;
    let spent = 0;

    data.forEach(item => {
        // Calculate total energy and total spent
        energy += parseFloat(item.energyAmount);
        
        // Handle price calculation
        const itemTotal = item.totalPrice || (item.energyAmount * item.pricePerKwh);
        spent += parseFloat(itemTotal);
    });

    // Calculate what this would cost from the Govt Grid
    const gridCost = energy * GOVT_GRID_RATE;
    const savings = gridCost - spent;

    setStats({
        totalEnergy: energy.toFixed(1),
        totalSpent: spent.toFixed(0),
        saved: savings.toFixed(0)
    });
  };

  if (!user) return <div className="p-10 text-center">Please Login to view orders.</div>;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen bg-gray-50">
      
      <div className="flex justify-between items-end mb-8">
        <div>
            <h2 className="text-3xl font-extrabold text-gray-900">My Portfolio</h2>
            <p className="text-gray-500">Track your P2P energy acquisitions and savings.</p>
        </div>
        <Link to="/market" className="text-green-600 font-bold hover:underline">
             + Buy More Energy
        </Link>
      </div>

      {/* --- AI SAVINGS DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Card 1: Energy Acquired */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⚡</div>
            <p className="text-blue-100 text-sm mb-1 font-medium">Total Energy Acquired</p>
            <h3 className="text-4xl font-bold">{stats.totalEnergy} <span className="text-lg opacity-70">kWh</span></h3>
        </div>

        {/* Card 2: Investment */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm mb-1 font-medium">Total Investment</p>
            <h3 className="text-4xl font-bold text-gray-800">₹{stats.totalSpent}</h3>
        </div>

        {/* Card 3: AI Savings Analysis */}
        <div className={`p-6 rounded-2xl border shadow-sm ${stats.saved >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className="text-gray-500 text-sm mb-1 font-bold flex items-center gap-2">
                🤖 AI Value Analysis
                {stats.saved > 0 && <span className="text-[10px] bg-green-200 text-green-800 px-2 rounded-full">GOOD</span>}
            </p>
            <h3 className={`text-4xl font-bold ${stats.saved >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.saved >= 0 ? `+₹${stats.saved}` : `-₹${Math.abs(stats.saved)}`}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
                {stats.saved >= 0 
                    ? "Saved vs. Standard Grid Rates (₹15/unit)" 
                    : "You paid above market rate"}
            </p>
        </div>
      </div>

      {/* --- ORDERS LIST --- */}
      <h3 className="text-xl font-bold text-gray-700 mb-4">Transaction History</h3>
      
      {loading ? (
          <div className="text-center py-20 text-gray-400">Syncing Blockchain Records...</div>
      ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-xl text-gray-400 font-medium">No transactions yet.</p>
              <Link to="/market" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-bold">
                  Go to Market
              </Link>
          </div>
      ) : (
        <div className="space-y-4">
            {orders.map((order) => (
                <div key={order._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition duration-200 group">
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`p-3 rounded-full text-2xl ${
                            order.energyType === 'Wind' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                            {order.energyType === 'Wind' ? '💨' : '☀️'}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                {order.energyAmount} kWh Bundle
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">
                                    {order.energyType || "Solar"}
                                </span>
                            </h4>
                            <p className="text-xs text-gray-400 font-mono mt-1">ID: {order._id}</p>
                            <p className="text-xs text-gray-500">Seller: {order.sellerAddress}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-8 mt-4 md:mt-0">
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold">Rate</p>
                            <p className="font-medium text-gray-700">₹{order.pricePerKwh}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold">Total Paid</p>
                            <p className="font-bold text-xl text-gray-900">
                                ₹{(order.totalPrice || (order.pricePerKwh * order.energyAmount)).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold border border-green-200">
                                ✅ PAID
                            </span>
                        </div>
                    </div>

                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default OrderPage;