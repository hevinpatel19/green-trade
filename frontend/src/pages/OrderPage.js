import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // 1. Check if user is logged in
      const user = JSON.parse(localStorage.getItem("userInfo"));
      if (!user) {
        alert("Please login to see your orders.");
        navigate("/login");
        return;
      }

      // 2. Fetch ALL listings
      const res = await axios.get("http://localhost:5000/api/energy/feed");
      
      // 3. Filter: Keep only items that are SOLD
      // (For now, we show all sold items. Later you can filter by user.email)
      const myOrders = res.data.filter(item => item.isSold); 
      setOrders(myOrders);

    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center mt-20">Loading orders...</div>;

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">📦 My Order History</h2>

      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Order ID</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Seller</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Energy (kWh)</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Total Price</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b hover:bg-gray-50 transition">
                <td className="p-4 text-xs font-mono text-gray-500">
                  #{order._id.substring(0, 8)}...
                </td>
                <td className="p-4 text-sm text-gray-700">
                  {order.sellerAddress}
                </td>
                <td className="p-4 font-bold text-gray-800">
                  {order.energyAmount} kWh
                </td>
                <td className="p-4 font-bold text-green-600">
                  ₹{order.pricePerKwh * order.energyAmount}
                </td>
                <td className="p-4">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                    PAID 💳
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {orders.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-gray-400 text-lg">No orders yet.</p>
            <button 
              onClick={() => navigate("/market")}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
            >
              Go to Market
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;