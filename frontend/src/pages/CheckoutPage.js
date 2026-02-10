import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import ContactSellerButton from "../components/ContactSellerButton";
import UserContext from "../context/UserContext";

// ─── Single loadStripe instance (created once, never duplicated) ───
let stripePromise = null;
const getStripe = (key) => {
    if (!stripePromise) {
        stripePromise = loadStripe(key);
    }
    return stripePromise;
};

// ────────────────────────────────────────────────────────────────────
//  Inner form — only renders inside <Elements>, so hooks are safe.
// ────────────────────────────────────────────────────────────────────
const PaymentForm = ({ totalAmount, listingId, user, navigate }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMsg, setErrorMsg] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setErrorMsg(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/orders`,
            },
            redirect: "if_required",
        });

        if (error) {
            setErrorMsg(error.message);
            setProcessing(false);
            return;
        }

        // Payment succeeded on Stripe's side — update listing in our DB
        if (paymentIntent?.status === "succeeded") {
            try {
                await axios.post("http://localhost:5000/api/payment/confirm-order", {
                    paymentIntentId: paymentIntent.id,
                    listingId,
                    buyerEmail: user?.email,
                    buyerName: user?.name,
                    totalAmount,
                });
                toast.success("Payment successful!");
            } catch {
                toast.success("Payment received! Order will update shortly.");
            }
            navigate("/orders");
        }

        setProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement
                id="payment-element"
                options={{ layout: "tabs", paymentMethodOrder: ["card"] }}
            />

            {errorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded flex items-center gap-2">
                    ⚠️ {errorMsg}
                </div>
            )}

            <button
                type="submit"
                disabled={processing || !stripe || !elements}
                className={`w-full mt-6 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${processing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 active:scale-95"
                    }`}
            >
                {processing ? "Processing..." : `Pay ₹${totalAmount.toFixed(2)} 💳`}
            </button>
        </form>
    );
};

// ────────────────────────────────────────────────────────────────────
//  Main page — fetches config + creates intent, then mounts Elements
//  exactly ONCE (no duplicate providers, no sandbox triggers).
// ────────────────────────────────────────────────────────────────────
const CheckoutPage = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { item } = location.state || {};

    const [stripePk, setStripePk] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [amountError, setAmountError] = useState(null);

    // ── Calculate total ──
    const totalAmount = (() => {
        if (!item) return 0;
        if (item.isAuction && item.winningTotalAmount) return Number(item.winningTotalAmount);
        return (Number(item.pricePerKwh) || 0) * (Number(item.energyAmount) || 0);
    })();

    const pricePerKwh = item?.isAuction
        ? (item.winningTotalAmount / item.energyAmount).toFixed(2)
        : item?.pricePerKwh;

    // ── Bootstrap: fetch config + create intent ──
    useEffect(() => {
        if (!item) { navigate("/market"); return; }

        // Auction access control
        if (item.isAuction) {
            if (!item.winnerEmail || item.winnerEmail !== user?.email) {
                toast.error("Unauthorized: You are not the auction winner.");
                navigate("/market");
                return;
            }
        }

        if (totalAmount < 1) {
            setAmountError("Minimum payable amount is ₹1.");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                // 1. Get publishable key
                const { data: cfg } = await axios.get("http://localhost:5000/api/payment/config");
                if (cancelled) return;
                setStripePk(cfg.publishableKey);

                // 2. Create PaymentIntent
                const { data } = await axios.post("http://localhost:5000/api/payment/create-intent", {
                    amount: totalAmount,
                    listingId: item._id,
                });
                if (cancelled) return;
                setClientSecret(data.clientSecret);
            } catch (err) {
                if (cancelled) return;
                if (err.response?.data?.code === "AMOUNT_TOO_LOW") {
                    setAmountError(err.response.data.error);
                } else {
                    toast.error(err.response?.data?.error || "Payment gateway error.");
                }
            }
        })();

        return () => { cancelled = true; };
    }, [item, navigate, user, totalAmount]);

    if (!item) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* ── LEFT: ORDER SUMMARY ── */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gray-900 text-white p-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">⚡ Order Summary</h2>
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
                                <p className="font-bold text-gray-800 text-xl">
                                    {item.energyAmount} <span className="text-sm text-gray-500">kWh</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Rate per Unit</span><span>₹{pricePerKwh}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Energy Amount</span><span>{item.energyAmount} kWh</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Platform Fee</span><span>₹0.00</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Taxes</span><span>₹0.00</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t-2 border-dashed border-gray-200">
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-gray-800 text-lg">Total Due</span>
                                <span className="font-extrabold text-3xl text-green-600">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                        🔒 256-bit SSL Encrypted Transaction
                    </div>
                </div>

                {/* ── RIGHT: PAYMENT ── */}
                <div className="flex flex-col justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure Payment</h3>
                        <p className="text-gray-500 text-sm mb-6">Complete your purchase securely.</p>

                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800">
                                <span className="font-bold">Buying as:</span> {user?.email}
                            </p>
                        </div>

                        {amountError && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-sm text-red-700 font-bold">⚠️ {amountError}</p>
                                <button onClick={() => navigate("/market")} className="mt-3 text-sm text-red-600 underline">
                                    Return to Market
                                </button>
                            </div>
                        )}

                        {stripePk && clientSecret && !amountError ? (
                            <Elements
                                stripe={getStripe(stripePk)}
                                options={{
                                    clientSecret,
                                    appearance: {
                                        theme: "flat",
                                        variables: { colorPrimary: "#16a34a" },
                                    },
                                    developerTools: {
                                        assistant: {
                                            enabled: false,
                                        },
                                    },
                                }}
                            >
                                <PaymentForm
                                    totalAmount={totalAmount}
                                    listingId={item._id}
                                    user={user}
                                    navigate={navigate}
                                />
                            </Elements>
                        ) : !amountError ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
                                <p className="text-gray-500 font-medium">Securing connection...</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <ContactSellerButton sellerEmail={item?.sellerAddress} />
        </div>
    );
};

export default CheckoutPage;