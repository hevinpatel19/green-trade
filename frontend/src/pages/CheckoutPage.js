import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../components/CheckoutForm";

// Initialize Stripe
const stripePromise = loadStripe("pk_test_51STyR8IkuLiRZrCBt3MgxdMfWISebWu7LDSTUYarsLWYdkGZ4eluBnbUB7UP8BG8hYaVinhDDcJ7nGUhTsScaaZq00rw102IfK");

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state || {}; // Get item passed from Market
  const [clientSecret, setClientSecret] = useState("");

  // 1. Initialize Payment on Load
  useEffect(() => {
    if (!item) {
      alert("No item selected! Redirecting to market.");
      navigate("/market");
      return;
    }

    const createPaymentIntent = async () => {
        try {
            console.log(`💰 Initiating Payment: ₹${item.pricePerKwh * item.energyAmount}`);
            
            const res = await axios.post("http://localhost:5000/api/payment/process", {
                amount: item.pricePerKwh * item.energyAmount,
                currency: "inr"
            });

            setClientSecret(res.data.clientSecret);
            console.log("✅ Client Secret Received");
            
        } catch (err) {
            console.error("❌ Payment Intent Error:", err);
            alert("Could not initialize payment. Is the Backend Running?");
        }
    };

    createPaymentIntent();
  }, [item, navigate]);

  // 2. Handle Successful Payment (Update Database)
 const handleSuccess = async () => {
    console.log("📝 Payment successful. Syncing with Database...");
    
    try {
      const user = JSON.parse(localStorage.getItem("userInfo"));
      const buyerName = user ? user.email : "Card User";

      // 1. Send Request
      const res = await axios.post(`http://localhost:5000/api/energy/buy/${item._id}`, {
        buyerAddress: buyerName
      });

      // 2. Verify Response
      if (res.status === 200) {
        console.log("✅ Order Synced:", res.data);
        alert("✅ Order Placed Successfully!");
        navigate("/orders");
      } else {
        throw new Error("Unexpected server response");
      }

    } catch (error) {
      // If this hits, it means the server actually replied with an error code
      console.error("❌ Sync Error:", error);
      alert("Payment processed, but we couldn't update your order history. Please contact support.");
    }
  };
  if (!item) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="p-8 w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Secure Checkout</h2>
            
            {/* Order Summary */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
              <h3 className="font-bold text-gray-700">Order Summary</h3>
              <p className="text-sm text-gray-600 mt-1">Energy: {item.energyAmount} kWh</p>
              <p className="text-sm text-gray-600">Rate: ₹{item.pricePerKwh}/unit</p>
              <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between font-bold text-lg text-blue-900">
                <span>Total:</span>
                <span>₹{(item.pricePerKwh * item.energyAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Form */}
            {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm onSuccess={handleSuccess} />
                </Elements>
            ) : (
                <div className="text-center py-10 text-gray-500 font-bold animate-pulse">
                    Connecting to Payment Gateway...
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;