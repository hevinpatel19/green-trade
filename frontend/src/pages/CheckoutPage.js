import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../components/CheckoutForm";
import UserContext from "../context/UserContext";

// Initialize Stripe
const stripePromise = loadStripe("pk_test_51STyR8IkuLiRZrCBt3MgxdMfWISebWu7LDSTUYarsLWYdkGZ4eluBnbUB7UP8BG8hYaVinhDDcJ7nGUhTsScaaZq00rw102IfK");

const CheckoutPage = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { item } = location.state || {};
    const [clientSecret, setClientSecret] = useState("");
    const [processing, setProcessing] = useState(false);

    // 1. Initialize Payment
    useEffect(() => {
        if (!item) {
            navigate("/market");
            return;
        }

        // Access Control: For auctions, only winner can checkout
        if (item.isAuction) {
            // Check if winnerEmail was passed from AuctionPage
            if (!item.winnerEmail) {
                toast.error("Unauthorized: Auction checkout requires winning the auction first.");
                navigate("/market");
                return;
            }
            // Verify current user is the winner
            if (item.winnerEmail !== user?.email) {
                toast.error("Unauthorized: You are not the auction winner.");
                navigate("/market");
                return;
            }
        }

        const createPaymentIntent = async () => {
            try {
                const res = await axios.post("http://localhost:5000/api/payment/process", {
                    amount: item.pricePerKwh * item.energyAmount,
                    currency: "inr"
                });
                setClientSecret(res.data.clientSecret);
            } catch (err) {
                console.error("Payment Init Error:", err);
                toast.error("Payment Gateway Error");
            }
        };

        createPaymentIntent();
    }, [item, navigate, user]);

    // 2. Handle Success
    const handleSuccess = async () => {
        setProcessing(true);
        try {
            const buyerName = user?.email || "guest@greentrade.com";

            // Mark item as sold in DB
            const res = await axios.post(`http://localhost:5000/api/energy/buy/${item._id}`, {
                buyerAddress: buyerName
            });

            if (res.status === 200) {
                navigate("/orders");
            }
        } catch (error) {
            toast.error("Payment succeeded, but database sync failed. Save your receipt.");
        }
        setProcessing(false);
    };

    if (!item) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT: ORDER RECEIPT DESIGN */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
                    <div className="bg-gray-900 text-white p-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            ⚡ Order Summary
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Transaction ID: {item._id.substring(0, 8)}</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <div>
                                <p className="font-bold text-gray-800 text-lg">Energy Bundle</p>
                                <p className="text-sm text-gray-500">{item.energyType || "Solar"} Power</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-800 text-xl">{item.energyAmount} <span className="text-sm text-gray-500">kWh</span></p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Rate per Unit</span>
                                <span>₹{item.pricePerKwh}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Platform Fee</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Taxes</span>
                                <span>₹0.00</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t-2 border-dashed border-gray-200">
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-gray-800 text-lg">Total Due</span>
                                <span className="font-extrabold text-3xl text-green-600">
                                    ₹{(item.pricePerKwh * item.energyAmount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 flex justify-center items-center gap-2">
                        🔒 256-bit SSL Encrypted Transaction
                    </div>
                </div>

                {/* RIGHT: PAYMENT FORM */}
                <div className="flex flex-col justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure Payment</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Complete your purchase securely using Stripe.
                        </p>

                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800">
                                <span className="font-bold">Buying as:</span> {user?.email}
                            </p>
                        </div>

                        {clientSecret ? (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <CheckoutForm onSuccess={handleSuccess} />
                            </Elements>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                                <p className="text-gray-500 font-medium">Securing connection...</p>
                            </div>
                        )}

                        <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* You can add Visa/Mastercard icons here later if you want */}
                            <span className="text-xs text-gray-400">Powered by Stripe</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CheckoutPage;