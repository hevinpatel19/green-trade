import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import ContactSellerButton from "../components/ContactSellerButton";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import { ShieldCheck, CreditCard, Zap, ArrowLeft, Lock } from "lucide-react";

let stripePromise = null;
const getStripe = (key) => {
    if (!stripePromise) {
        stripePromise = loadStripe(key, {
            betas: [],
        });
    }
    return stripePromise;
};

const PaymentForm = ({ totalAmount, listingId, user, navigate }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMsg, setErrorMsg] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setProcessing(true); setErrorMsg(null);
        const { error, paymentIntent } = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/orders` }, redirect: "if_required" });
        if (error) { setErrorMsg(error.message); setProcessing(false); return; }
        if (paymentIntent?.status === "succeeded") {
            try { await axios.post("http://localhost:5000/api/payment/confirm-order", { paymentIntentId: paymentIntent.id, listingId, buyerEmail: user?.email, buyerName: user?.name, totalAmount }); toast.success("Payment successful!"); } catch { toast.success("Payment received! Order will update shortly."); }
            navigate("/orders");
        }
        setProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" options={{ layout: "tabs", paymentMethodOrder: ["card"] }} />
            {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl flex items-center gap-2">⚠️ {errorMsg}</motion.div>
            )}
            <motion.button type="submit" disabled={processing || !stripe || !elements} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} className={`w-full mt-6 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ripple-btn btn-press ${processing ? "bg-midnight-300 text-slate-600 cursor-not-allowed" : "bg-emerald-primary hover:bg-emerald-glow text-midnight shadow-glow hover:shadow-glow-lg"}`}>
                {processing ? <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" /> : <><CreditCard size={16} /> Pay ₹{totalAmount.toFixed(2)}</>}
            </motion.button>
        </form>
    );
};

const CheckoutPage = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { item } = location.state || {};
    const [stripePk, setStripePk] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [amountError, setAmountError] = useState(null);

    const totalAmount = (() => { if (!item) return 0; if (item.isAuction && item.winningTotalAmount) return Number(item.winningTotalAmount); return (Number(item.pricePerKwh) || 0) * (Number(item.energyAmount) || 0); })();
    const pricePerKwh = item?.isAuction ? (item.winningTotalAmount / item.energyAmount).toFixed(2) : item?.pricePerKwh;

    useEffect(() => {
        if (!item) { navigate("/market"); return; }
        if (item.isAuction && (!item.winnerEmail || item.winnerEmail !== user?.email)) { toast.error("Unauthorized: You are not the auction winner."); navigate("/market"); return; }
        if (totalAmount < 1) { setAmountError("Minimum payable amount is ₹1."); return; }
        let cancelled = false;
        (async () => {
            try {
                const { data: cfg } = await axios.get("http://localhost:5000/api/payment/config"); if (cancelled) return; setStripePk(cfg.publishableKey);
                const { data } = await axios.post("http://localhost:5000/api/payment/create-intent", { amount: totalAmount, listingId: item._id }); if (cancelled) return; setClientSecret(data.clientSecret);
            } catch (err) { if (cancelled) return; if (err.response?.data?.code === "AMOUNT_TOO_LOW") setAmountError(err.response.data.error); else toast.error(err.response?.data?.error || "Payment gateway error."); }
        })();
        return () => { cancelled = true; };
    }, [item, navigate, user, totalAmount]);

    if (!item) return null;

    return (
        <PageTransition>
            <div className="min-h-screen bg-midnight flex items-center justify-center py-12 px-4">
                <div className="max-w-5xl w-full">
                    <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate("/market")} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 font-semibold text-sm mb-6 transition-colors">
                        <ArrowLeft size={16} /> Back to Market
                    </motion.button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* ORDER SUMMARY */}
                        <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="bg-surface border border-glass-light rounded-2xl overflow-hidden card-hover">
                            <div className="bg-gradient-to-r from-midnight-200 to-surface-light p-6 border-b border-glass-light">
                                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Zap size={18} className="text-emerald-primary" /> Order Summary</h2>
                                <p className="text-slate-500 text-sm mt-1">TX: {item._id.substring(0, 8)}{item.isAuction && <span className="ml-2 text-accent-violet">(Auction Win)</span>}</p>
                            </div>
                            <div className="p-8 space-y-5">
                                <div className="flex justify-between items-center pb-4 border-b border-glass-light">
                                    <div><p className="font-bold text-slate-200">Energy Bundle</p><p className="text-sm text-slate-500">{item.energyType || "Solar"} Power</p></div>
                                    <p className="font-bold text-slate-200 text-xl">{item.energyAmount} <span className="text-sm text-slate-500">kWh</span></p>
                                </div>
                                <div className="space-y-3 text-sm">
                                    {[{ l: "Rate per Unit", v: `₹${pricePerKwh}` }, { l: "Energy Amount", v: `${item.energyAmount} kWh` }, { l: "Platform Fee", v: "₹0.00" }, { l: "Taxes", v: "₹0.00" }].map((row, i) => (
                                        <motion.div key={row.l} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex justify-between text-slate-400">
                                            <span>{row.l}</span><span className="text-slate-300">{row.v}</span>
                                        </motion.div>
                                    ))}
                                </div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="pt-5 border-t-2 border-dashed border-glass-light">
                                    <div className="flex justify-between items-end"><span className="font-bold text-slate-300">Total Due</span><span className="font-black text-3xl text-emerald-glow">₹{totalAmount.toFixed(2)}</span></div>
                                </motion.div>
                            </div>
                            <div className="bg-midnight-100 p-3 text-center text-xs text-slate-600 border-t border-glass-light flex items-center justify-center gap-1.5"><Lock size={12} /> 256-bit SSL Encrypted Transaction</div>
                        </motion.div>

                        {/* PAYMENT */}
                        <motion.div initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="flex flex-col justify-center">
                            <div className="bg-surface border border-glass-light rounded-2xl p-8">
                                <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2"><ShieldCheck size={20} className="text-emerald-primary" /> Secure Payment</h3>
                                <p className="text-slate-500 text-sm mb-6">Complete your purchase securely.</p>
                                <div className="mb-6 p-3 bg-midnight-100 rounded-xl border border-glass-light"><p className="text-sm text-slate-400"><span className="font-semibold text-slate-300">Buying as:</span> {user?.email}</p></div>
                                {amountError && (
                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                        <p className="text-sm text-red-400 font-semibold">⚠️ {amountError}</p>
                                        <button onClick={() => navigate("/market")} className="mt-3 text-sm text-red-400 hover:text-red-300 underline transition-colors">Return to Market</button>
                                    </motion.div>
                                )}
                                {stripePk && clientSecret && !amountError ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                        <Elements stripe={getStripe(stripePk)} options={{ clientSecret, appearance: { theme: "night", variables: { colorPrimary: "#10b981", colorBackground: "#111827", colorText: "#f1f5f9", colorDanger: "#ef4444", borderRadius: "12px", fontFamily: "Inter, system-ui, sans-serif" } } }}>
                                            <PaymentForm totalAmount={totalAmount} listingId={item._id} user={user} navigate={navigate} />
                                        </Elements>
                                    </motion.div>
                                ) : !amountError ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                                        <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
                                        <p className="text-slate-500 font-medium">Securing connection...</p>
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </div>
                </div>
                <ContactSellerButton sellerEmail={item?.sellerAddress} />
            </div>
        </PageTransition>
    );
};

export default CheckoutPage;