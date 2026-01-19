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

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(); // Trigger parent success function
    } else {
      setMessage("Unexpected state.");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <PaymentElement />
      <button 
        disabled={isProcessing || !stripe || !elements} 
        id="submit"
        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md"
      >
        {isProcessing ? "Processing Payment..." : "Pay Now 💳"}
      </button>
      {message && <div className="text-red-500 text-sm font-bold text-center">{message}</div>}
    </form>
  );
};

export default CheckoutForm;