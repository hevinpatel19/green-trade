import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../components/CheckoutForm";

// 🔴 PASTE YOUR PUBLISHABLE KEY HERE
const stripePromise = loadStripe("pk_test_51STyR8IkuLiRZrCBt3MgxdMfWISebWu7LDSTUYarsLWYdkGZ4eluBnbUB7UP8BG8hYaVinhDDcJ7nGUhTsScaaZq00rw102IfK");

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state || {}; // Get item passed from Market
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!item) {
      navigate("/market"); // Redirect back if no item selected
      return;
    }
    
    // Create Payment Intent
    axios.post("http://localhost:5000/api/payment/process", {
      amount: item.pricePerKwh * item.energyAmount,
      currency: "inr"
    })
    .then(res => setClientSecret(res.data.clientSecret))
    .catch(err => console.error("Payment Intent Error:", err));

  }, [item, navigate]);

  const handleSuccess = async () => {
    try {
      // Mark as sold in DB
      await axios.post(`http://localhost:5000/api/energy/buy/${item._id}`, {
        buyerAddress: "Card User"
      });
      alert("✅ Order Successful!");
      navigate("/orders"); // Go to history/orders page like a real app
    } catch (error) {
      console.error(error);
      alert("Payment successful but order update failed.");
    }
  };

  if (!item || !clientSecret) return <div className="p-10 text-center">Loading Checkout...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="p-8 w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Checkout</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
              <h3 className="font-bold text-gray-700">Order Summary</h3>
              <p className="text-sm text-gray-600 mt-1">Energy: {item.energyAmount} kWh</p>
              <p className="text-sm text-gray-600">Rate: ₹{item.pricePerKwh}/unit</p>
              <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between font-bold text-lg text-blue-900">
                <span>Total:</span>
                <span>₹{item.pricePerKwh * item.energyAmount}</span>
              </div>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handleSuccess} />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;