import React, { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import UserContext from "../context/UserContext";
import WalletContext from "../context/WalletContext";
import PageTransition from "../components/PageTransition";
import {
    Wallet, Plus, ArrowDownLeft, ArrowUpRight, Clock,
    CreditCard, CheckCircle2, IndianRupee, TrendingUp,
    ShieldCheck, Lock, Zap, ArrowLeft
} from "lucide-react";
import { API_URL } from "../utils/api";

/* ── Stripe singleton ── */
let stripePromise = null;
const getStripe = (key) => {
    if (!stripePromise) stripePromise = loadStripe(key, { betas: [] });
    return stripePromise;
};

/* ── Stripe element style ── */
const CARD_ELEMENT_STYLE = {
    base: {
        color: "#f1f5f9",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "15px",
        fontWeight: "500",
        "::placeholder": { color: "#475569" },
        lineHeight: "24px",
    },
    invalid: { color: "#ef4444", iconColor: "#ef4444" },
};

/* ═══════════════════════════════════════════════
   ADD FUNDS PAYMENT FORM
   ═══════════════════════════════════════════════ */
const AddFundsForm = ({ amount, user, clientSecret, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const [field, setField] = useState({
        number: { focused: false, complete: false, error: false },
        expiry: { focused: false, complete: false, error: false },
        cvc:    { focused: false, complete: false, error: false },
    });

    const updateField = (name, patch) =>
        setField((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));

    const inputClass = (name) => {
        const s = field[name];
        const base = "w-full bg-[#0d1321] rounded-xl px-4 py-3 transition-all duration-300 border";
        if (s.error)    return `${base} border-red-500/50 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]`;
        if (s.focused)  return `${base} border-emerald-primary/50 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]`;
        if (s.complete) return `${base} border-emerald-primary/25`;
        return `${base} border-white/[0.08] hover:border-white/[0.15]`;
    };

    const labelClass = (name) => {
        const s = field[name];
        const base = "block text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-200";
        if (s.error)   return `${base} text-red-400`;
        if (s.focused) return `${base} text-emerald-primary`;
        return `${base} text-slate-500`;
    };

    const onNumberChange = (e) => {
        updateField("number", { complete: e.complete, error: !!e.error });
        if (e.complete) elements?.getElement(CardExpiryElement)?.focus();
    };
    const onExpiryChange = (e) => {
        updateField("expiry", { complete: e.complete, error: !!e.error });
        if (e.complete) elements?.getElement(CardCvcElement)?.focus();
    };
    const onCvcChange = (e) => {
        updateField("cvc", { complete: e.complete, error: !!e.error });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setErrorMsg(null);

        const cardNumberElement = elements.getElement(CardNumberElement);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardNumberElement,
                billing_details: {
                    name: user?.name || "",
                    email: user?.email || "",
                },
            },
        });

        if (error) {
            setErrorMsg(error.message);
            setProcessing(false);
            return;
        }

        if (paymentIntent?.status === "succeeded") {
            try {
                const { data } = await axios.post(
                    `${API_URL}/api/wallet/confirm-funds`,
                    { paymentIntentId: paymentIntent.id, amount },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                toast.success(`₹${amount} added to wallet!`);
                onSuccess(data.balance);
            } catch {
                toast.error("Payment received but wallet update delayed. Please refresh.");
            }
        }
        setProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className={labelClass("number")}>Card Number</label>
                <div className={inputClass("number")}>
                    <CardNumberElement
                        options={{ style: CARD_ELEMENT_STYLE, showIcon: true }}
                        onChange={onNumberChange}
                        onFocus={() => updateField("number", { focused: true })}
                        onBlur={() =>  updateField("number", { focused: false })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className={labelClass("expiry")}>Expiry Date</label>
                    <div className={inputClass("expiry")}>
                        <CardExpiryElement
                            options={{ style: CARD_ELEMENT_STYLE }}
                            onChange={onExpiryChange}
                            onFocus={() => updateField("expiry", { focused: true })}
                            onBlur={() =>  updateField("expiry", { focused: false })}
                        />
                    </div>
                </div>
                <div>
                    <label className={labelClass("cvc")}>CVC</label>
                    <div className={inputClass("cvc")}>
                        <CardCvcElement
                            options={{ style: CARD_ELEMENT_STYLE }}
                            onChange={onCvcChange}
                            onFocus={() => updateField("cvc", { focused: true })}
                            onBlur={() =>  updateField("cvc", { focused: false })}
                        />
                    </div>
                </div>
            </div>

            {errorMsg && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
                >
                    <span className="text-red-400 text-sm font-semibold">⚠️ {errorMsg}</span>
                </motion.div>
            )}

            <motion.button
                type="submit"
                disabled={processing || !stripe || !elements}
                whileHover={!processing ? { scale: 1.01, y: -1 } : {}}
                whileTap={!processing ? { scale: 0.98 } : {}}
                className={`
                    w-full mt-5 py-4 rounded-xl font-bold text-base
                    transition-all duration-300 flex items-center justify-center gap-3
                    ripple-btn btn-press
                    ${processing
                        ? "bg-midnight-300 text-slate-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-primary to-emerald-glow text-midnight shadow-glow hover:shadow-glow-lg"
                    }
                `}
            >
                {processing ? (
                    <>
                        <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                        <span>Processing…</span>
                    </>
                ) : (
                    <>
                        <Lock size={16} />
                        <span>Add ₹{amount} to Wallet</span>
                    </>
                )}
            </motion.button>
        </form>
    );
};

/* ═══════════════════════════════════════════════
   WALLET PAGE
   ═══════════════════════════════════════════════ */
const WalletPage = () => {
    const { user } = useContext(UserContext);
    const { balance, transactions, fetchBalance } = useContext(WalletContext);
    const navigate = useNavigate();

    const [addAmount, setAddAmount] = useState("");
    const [stripePk, setStripePk] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [initiating, setInitiating] = useState(false);

    const presets = [500, 1000, 2000, 5000];

    const handleInitiatePayment = async () => {
        const amount = Number(addAmount);
        if (!amount || amount < 1) {
            toast.error("Enter a valid amount (minimum ₹1).");
            return;
        }
        if (amount > 100000) {
            toast.error("Maximum ₹1,00,000 per transaction.");
            return;
        }

        setInitiating(true);
        try {
            const { data: cfg } = await axios.get(`${API_URL}/api/payment/config`);
            setStripePk(cfg.publishableKey);

            const { data } = await axios.post(
                `${API_URL}/api/wallet/add-funds`,
                { amount },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setClientSecret(data.clientSecret);
            setShowPaymentForm(true);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to initiate payment.");
        } finally {
            setInitiating(false);
        }
    };

    const handlePaymentSuccess = (newBalance) => {
        setShowPaymentForm(false);
        setClientSecret(null);
        setAddAmount("");
        fetchBalance();
    };

    // Format date nicely
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-midnight">

                {/* ═══ HEADER ═══ */}
                <div className="border-b border-glass-light bg-midnight-50/80 backdrop-blur-xl">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Back</span>
                        </motion.button>
                        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
                            <Wallet size={22} className="text-emerald-primary" />
                            My Wallet
                        </h1>
                    </div>
                </div>

                {/* ═══ CONTENT ═══ */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                        {/* ──── LEFT COLUMN (7/12) ──── */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* BALANCE CARD */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative overflow-hidden bg-gradient-to-br from-emerald-deep/30 via-surface to-midnight-100 border border-emerald-primary/20 rounded-2xl p-6 sm:p-8"
                            >
                                {/* Decorative glow */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-primary/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-glow/5 rounded-full blur-2xl pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-10 h-10 bg-emerald-primary/15 rounded-xl flex items-center justify-center">
                                            <Wallet size={20} className="text-emerald-glow" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Available Balance</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg text-emerald-glow font-semibold">₹</span>
                                        <motion.span
                                            key={balance}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-5xl sm:text-6xl font-black text-slate-100 tracking-tight"
                                        >
                                            {balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </motion.span>
                                    </div>
                                    <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                                        <ShieldCheck size={12} />
                                        Secured by Stripe • Instant top-up
                                    </p>
                                </div>
                            </motion.div>

                            {/* ADD FUNDS SECTION */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                                className="bg-surface border border-glass-light rounded-2xl p-5 sm:p-6"
                            >
                                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                                        <Plus size={15} className="text-emerald-primary" />
                                    </div>
                                    Add Funds
                                </h2>

                                {!showPaymentForm ? (
                                    <>
                                        {/* Preset amounts */}
                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            {presets.map((amt) => (
                                                <motion.button
                                                    key={amt}
                                                    whileHover={{ scale: 1.03, y: -1 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => setAddAmount(String(amt))}
                                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                                                        Number(addAmount) === amt
                                                            ? "bg-emerald-primary/15 border-emerald-primary/40 text-emerald-glow shadow-glow"
                                                            : "bg-midnight-100 border-glass-light text-slate-400 hover:text-slate-200 hover:border-white/15"
                                                    }`}
                                                >
                                                    ₹{amt.toLocaleString("en-IN")}
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Custom amount input */}
                                        <div className="relative mb-4">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</div>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100000"
                                                value={addAmount}
                                                onChange={(e) => setAddAmount(e.target.value)}
                                                placeholder="Enter amount"
                                                className="w-full bg-midnight-100 border border-glass-light rounded-xl px-4 pl-8 py-3.5 text-slate-100 text-base font-semibold placeholder:text-slate-600 focus:outline-none focus:border-emerald-primary/50 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] transition-all duration-300 input-glow"
                                            />
                                        </div>

                                        {/* Proceed button */}
                                        <motion.button
                                            onClick={handleInitiatePayment}
                                            disabled={initiating || !addAmount || Number(addAmount) < 1}
                                            whileHover={!initiating ? { scale: 1.01, y: -1 } : {}}
                                            whileTap={!initiating ? { scale: 0.98 } : {}}
                                            className={`
                                                w-full py-4 rounded-xl font-bold text-base
                                                transition-all duration-300 flex items-center justify-center gap-3
                                                ripple-btn btn-press
                                                ${initiating || !addAmount || Number(addAmount) < 1
                                                    ? "bg-midnight-300 text-slate-600 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-emerald-primary to-emerald-glow text-midnight shadow-glow hover:shadow-glow-lg"
                                                }
                                            `}
                                        >
                                            {initiating ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                                    <span>Connecting…</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard size={16} />
                                                    <span>Proceed to Pay {addAmount ? `₹${Number(addAmount).toLocaleString("en-IN")}` : ""}</span>
                                                </>
                                            )}
                                        </motion.button>
                                    </>
                                ) : (
                                    /* Stripe Payment Form */
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Lock size={13} />
                                                <span className="text-xs font-semibold">SSL Encrypted</span>
                                            </div>
                                            <button
                                                onClick={() => { setShowPaymentForm(false); setClientSecret(null); }}
                                                className="text-xs text-slate-500 hover:text-slate-300 font-semibold transition-colors"
                                            >
                                                ← Change amount
                                            </button>
                                        </div>

                                        <div className="mb-4 p-3 bg-emerald-primary/5 border border-emerald-primary/15 rounded-xl flex items-center justify-between">
                                            <span className="text-sm text-slate-400">Adding to wallet</span>
                                            <span className="text-lg font-bold text-emerald-glow">₹{Number(addAmount).toLocaleString("en-IN")}</span>
                                        </div>

                                        {stripePk && clientSecret && (
                                            <Elements
                                                stripe={getStripe(stripePk)}
                                                options={{
                                                    fonts: [
                                                        { cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" },
                                                    ],
                                                }}
                                            >
                                                <AddFundsForm
                                                    amount={Number(addAmount)}
                                                    user={user}
                                                    clientSecret={clientSecret}
                                                    onSuccess={handlePaymentSuccess}
                                                />
                                            </Elements>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </div>

                        {/* ──── RIGHT COLUMN (5/12) — TRANSACTION HISTORY ──── */}
                        <div className="lg:col-span-5">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-surface border border-glass-light rounded-2xl overflow-hidden lg:sticky lg:top-20"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-midnight-200 to-surface-light px-5 py-4 border-b border-glass-light flex items-center justify-between">
                                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5">
                                        <Clock size={16} className="text-emerald-primary" />
                                        Transaction History
                                    </h2>
                                    <span className="text-xs text-slate-500 font-semibold">
                                        {transactions.length} record{transactions.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                {/* Transaction list */}
                                <div className="max-h-[520px] overflow-y-auto">
                                    {transactions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                            <div className="w-14 h-14 bg-midnight-200 rounded-2xl flex items-center justify-center mb-4">
                                                <TrendingUp size={24} className="text-slate-600" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-500 mb-1">No transactions yet</p>
                                            <p className="text-xs text-slate-600">Add funds to get started!</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-glass-light">
                                            {transactions.map((tx, i) => (
                                                <motion.div
                                                    key={tx._id || i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                            tx.type === "credit"
                                                                ? "bg-emerald-primary/10"
                                                                : "bg-red-500/10"
                                                        }`}>
                                                            {tx.type === "credit"
                                                                ? <ArrowDownLeft size={16} className="text-emerald-glow" />
                                                                : <ArrowUpRight size={16} className="text-red-400" />
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-200 truncate">
                                                                {tx.description || (tx.type === "credit" ? "Funds Added" : "Purchase")}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                                                        </div>
                                                        <span className={`text-sm font-bold flex-shrink-0 ${
                                                            tx.type === "credit" ? "text-emerald-glow" : "text-red-400"
                                                        }`}>
                                                            {tx.type === "credit" ? "+" : "−"}₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="bg-midnight-100 px-5 py-3 border-t border-glass-light flex items-center justify-center gap-2 text-slate-600">
                                    <ShieldCheck size={11} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">All transactions are encrypted</span>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default WalletPage;
