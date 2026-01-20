import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const CheckoutForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      // 1. Confirm Stripe Payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { 
          // This url is used only if Stripe redirects (e.g. for 3D Secure)
          return_url: window.location.origin + "/orders" 
        },
        redirect: "if_required",
      });

      // 2. Handle Stripe Errors
      if (error) {
        console.error("❌ Stripe Payment Failed:", error);
        setMessage(error.message);
        return; // Stop here
      }

      // 3. Payment Succeeded -> Update Database
      if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("✅ Payment Succeeded! ID:", paymentIntent.id);
        
        try {
            // Call parent function to update MongoDB
            await onSuccess(); 
            console.log("✅ Database Updated Successfully");
        } catch (dbError) {
            console.error("❌ Database Update Failed:", dbError);
            setMessage("Payment received, but order saving failed. Check console.");
        }
      }

    } catch (err) {
      console.error("❌ System Error:", err);
      setMessage("An unexpected error occurred.");
    } finally {
      // 4. CRITICAL FIX: Always stop loading, even if it crashes
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Enter Card Details</h3>
      
      <PaymentElement id="payment-element" />
      
      {/* Error Message */}
      {message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded flex items-center gap-2">
            <span>⚠️</span> {message}
        </div>
      )}

      <button 
        disabled={isProcessing || !stripe || !elements} 
        id="submit"
        className={`w-full mt-6 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
            isProcessing 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-green-600 hover:bg-green-700 active:scale-95"
        }`}
      >
        {isProcessing ? "Processing..." : "Pay Now 💳"}
      </button>
    </form>
  );
};

export default CheckoutForm;