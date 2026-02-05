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

// Minimum amount in INR
const MINIMUM_AMOUNT_INR = 1;

const CheckoutPage = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { item } = location.state || {};
    const [clientSecret, setClientSecret] = useState("");
    const [paymentIntentId, setPaymentIntentId] = useState("");
    const [processing, setProcessing] = useState(false);
    const [amountError, setAmountError] = useState(null);

    // ✅ Calculate correct total amount
    const calculateTotalAmount = () => {
        if (!item) return 0;

        // For auction wins: use winningTotalAmount directly (already calculated)
        if (item.isAuction && item.winningTotalAmount) {
            return Number(item.winningTotalAmount);
        }

        // For fixed price: pricePerKwh * energyAmount
        const pricePerUnit = Number(item.pricePerKwh) || 0;
        const quantity = Number(item.energyAmount) || 0;
        return pricePerUnit * quantity;
    };

    const totalAmount = calculateTotalAmount();
    const pricePerKwh = item?.isAuction
        ? (item.winningTotalAmount / item.energyAmount).toFixed(2)
        : item?.pricePerKwh;

    // 1. Initialize Payment
    useEffect(() => {
        if (!item) {
            navigate("/market");
            return;
        }

        // Access Control: For auctions, only winner can checkout
        if (item.isAuction) {
            if (!item.winnerEmail) {
                toast.error("Unauthorized: Auction checkout requires winning the auction first.");
                navigate("/market");
                return;
            }
            if (item.winnerEmail !== user?.email) {
                toast.error("Unauthorized: You are not the auction winner.");
                navigate("/market");
                return;
            }
        }

        const createPaymentIntent = async () => {
            try {
                console.log("💳 Checkout Debug:", {
                    pricePerKwh: item.pricePerKwh,
                    energyAmount: item.energyAmount,
                    isAuction: item.isAuction,
                    winningTotalAmount: item.winningTotalAmount,
                    calculatedTotal: totalAmount
                });

                // ✅ MINIMUM AMOUNT VALIDATION
                if (!totalAmount || totalAmount <= 0 || isNaN(totalAmount)) {
                    console.error("❌ Invalid amount:", totalAmount);
                    toast.error("Invalid order amount. Please try again.");
                    return;
                }

                if (totalAmount < MINIMUM_AMOUNT_INR) {
                    setAmountError(`Minimum payable amount is ₹${MINIMUM_AMOUNT_INR}. Please select a higher quantity or value.`);
                    return;
                }

                const res = await axios.post("http://localhost:5000/api/payment/process", {
                    amount: totalAmount,
                    currency: "inr",
                    listingId: item._id
                });

                setClientSecret(res.data.clientSecret);
                setPaymentIntentId(res.data.paymentIntentId);

            } catch (err) {
                console.error("Payment Init Error:", err);

                // Handle minimum amount error from backend
                if (err.response?.data?.code === "AMOUNT_TOO_LOW") {
                    setAmountError(err.response.data.message);
                } else {
                    toast.error(err.response?.data?.message || "Payment Gateway Error");
                }
            }
        };

        createPaymentIntent();
    }, [item, navigate, user, totalAmount]);

    // 2. Handle Success - ✅ NOW VERIFIES WITH BACKEND
    const handleSuccess = async () => {
        setProcessing(true);
        try {
            const buyerEmail = user?.email || "guest@greentrade.com";

            // ✅ VERIFY PAYMENT WITH BACKEND (source of truth)
            const verifyRes = await axios.post("http://localhost:5000/api/payment/verify", {
                paymentIntentId: paymentIntentId,
                listingId: item._id,
                buyerEmail: buyerEmail,
                buyerName: user?.name,
                totalAmount: totalAmount
            });

            if (verifyRes.data.success) {
                toast.success("Payment verified successfully!");
                navigate("/orders");
            } else {
                toast.error("Payment verification failed. Please contact support.");
            }
        } catch (error) {
            console.error("Verification Error:", error);
            toast.error("Payment received, but verification failed. Please contact support.");
            // Still navigate to orders - the backend has the payment record
            navigate("/orders");
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
                        <p className="text-gray-400 text-sm mt-1">
                            Transaction ID: {item._id.substring(0, 8)}
                            {item.isAuction && <span className="ml-2 text-purple-400">(Auction Win)</span>}
                        </p>
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
                                <span>₹{pricePerKwh}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Energy Amount</span>
                                <span>{item.energyAmount} kWh</span>
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
                                    ₹{totalAmount.toFixed(2)}
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

                        {/* ✅ MINIMUM AMOUNT ERROR */}
                        {amountError && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-sm text-red-700 font-bold flex items-center gap-2">
                                    ⚠️ {amountError}
                                </p>
                                <button
                                    onClick={() => navigate("/market")}
                                    className="mt-3 text-sm text-red-600 underline"
                                >
                                    Return to Market
                                </button>
                            </div>
                        )}

                        {clientSecret && !amountError ? (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <CheckoutForm onSuccess={handleSuccess} />
                            </Elements>
                        ) : !amountError ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                                <p className="text-gray-500 font-medium">Securing connection...</p>
                            </div>
                        ) : null}

                        <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-xs text-gray-400">Powered by Stripe</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CheckoutPage;