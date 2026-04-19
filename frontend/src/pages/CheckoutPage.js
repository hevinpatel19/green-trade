import React, { useEffect, useState, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import ContactSellerButton from "../components/ContactSellerButton";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import {
    ShieldCheck, Zap, ArrowLeft, Lock, Package,
    CreditCard, CheckCircle2, ArrowRight, User, Mail, MapPin
} from "lucide-react";

/* ── Stripe singleton ── */
let stripePromise = null;
const getStripe = (key) => {
    if (!stripePromise) stripePromise = loadStripe(key, { betas: [] });
    return stripePromise;
};

/* ═══════════════════════════════════════════════════
   PROGRESS BAR — compact inline stepper
   ═══════════════════════════════════════════════════ */
const stepData = [
    { id: 1, label: "Cart", icon: Package },
    { id: 2, label: "Checkout", icon: CreditCard },
    { id: 3, label: "Payment", icon: Lock },
    { id: 4, label: "Done", icon: CheckCircle2 },
];

const ProgressBar = ({ current = 3 }) => (
    <div className="flex items-center gap-1 w-full max-w-lg">
        {stepData.map((s, i) => {
            const done = s.id < current;
            const active = s.id === current;
            return (
                <React.Fragment key={s.id}>
                    <div className="flex items-center gap-2">
                        <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all
                            ${done
                                ? "bg-emerald-primary text-midnight"
                                : active
                                    ? "bg-emerald-primary/15 text-emerald-glow border border-emerald-primary/50"
                                    : "bg-midnight-200 text-slate-600 border border-glass-light"
                            }
                        `}>
                            {done ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
                        </div>
                        <span className={`
                            text-xs font-semibold uppercase tracking-wide hidden sm:inline
                            ${done ? "text-emerald-glow" : active ? "text-emerald-primary" : "text-slate-600"}
                        `}>
                            {s.label}
                        </span>
                    </div>
                    {i < stepData.length - 1 && (
                        <div className="flex-1 h-0.5 mx-2 rounded-full overflow-hidden bg-midnight-300">
                            {done && <div className="h-full bg-emerald-primary w-full" />}
                        </div>
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

/* ═══════════════════════════════════════════════════
   SHARED STRIPE ELEMENT STYLE
   These apply inside each Stripe iframe input.
   ═══════════════════════════════════════════════════ */
const CARD_ELEMENT_STYLE = {
    base: {
        color: "#f1f5f9",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "15px",
        fontWeight: "500",
        "::placeholder": { color: "#475569" },
        lineHeight: "24px",
    },
    invalid: {
        color: "#ef4444",
        iconColor: "#ef4444",
    },
};

/* ═══════════════════════════════════════════════════
   SVG CARD BRAND LOGOS
   Clean inline SVGs matching real card brand visuals.
   ═══════════════════════════════════════════════════ */
const VisaLogo = () => (
    <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#1A1F71" />
        <path d="M16.2 15.5h-2.4l1.5-9.3h2.4l-1.5 9.3z" fill="#fff" />
        <path d="M24.2 6.4c-.5-.2-1.2-.4-2.1-.4-2.3 0-3.9 1.2-3.9 2.9 0 1.3 1.2 2 2 2.4.9.4 1.2.7 1.2 1.1 0 .6-.7.9-1.4.9-.9 0-1.4-.1-2.2-.5l-.3-.1-.3 2c.5.2 1.5.5 2.5.5 2.4 0 4-1.2 4-3 0-1-.6-1.8-1.9-2.4-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.8 1.3-.8.7 0 1.3.2 1.7.3l.2.1.3-1.9z" fill="#fff" />
        <path d="M28.4 6.2h-1.8c-.6 0-1 .2-1.2.7l-3.4 8.6h2.4l.5-1.3h2.9l.3 1.3h2.1l-1.8-9.3zm-2.7 6l1.2-3.3.7 3.3h-1.9z" fill="#fff" />
        <path d="M12.6 6.2l-2.3 6.3-.2-1.3c-.4-1.4-1.7-3-3.1-3.7l2 7.9h2.4l3.6-9.3h-2.4z" fill="#fff" />
        <path d="M8.4 6.2H4.7l0 .2c2.9.7 4.8 2.5 5.6 4.6l-.8-4.1c-.1-.5-.6-.7-1.1-.7z" fill="#F7B600" />
    </svg>
);

const MastercardLogo = () => (
    <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#252525" />
        <circle cx="15" cy="12" r="7" fill="#EB001B" />
        <circle cx="23" cy="12" r="7" fill="#F79E1B" />
        <path d="M19 6.8a6.98 6.98 0 0 0-2.5 5.2A6.98 6.98 0 0 0 19 17.2a6.98 6.98 0 0 0 2.5-5.2A6.98 6.98 0 0 0 19 6.8z" fill="#FF5F00" />
    </svg>
);

const AmexLogo = () => (
    <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#006FCF" />
        <path d="M5 14.5h1.5l.3-.8h.7l.3.8H9.5V13.9l.2.6h1.4l.2-.6v.6h5.5l.7-.8.6.8h3L19 12l2.1-2.5h-3l-.7.8-.6-.8h-5.6l-.4.9-.4-.9H9l-.3.8V9.5H7.3l-.5 1.2-.5-1.2H4.5v5zm.7-1l1.5-3.5h.9l1.5 3.5h-.8l-.3-.8H7.8l-.3.8h-.8zm2-1.5l-.5-1.3-.5 1.3h1zm2.8 1.5v-3.5h1.2l.7 2.2.7-2.2h1.2v3.5h-.8v-2.6l-.8 2.6h-.7l-.8-2.6v2.6h-.7zm5.2 0v-3.5h3.2l.8 1 .8-1h1l-1.4 1.8 1.4 1.7h-1l-.8-1-.8 1h-3.2zm.8-.7h2l.8-1-.8-1h-2v.7h1.8v.6h-1.8v.7z" fill="#fff" />
    </svg>
);

const DiscoverLogo = () => (
    <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#fff" />
        <rect x="0.5" y="0.5" width="37" height="23" rx="3.5" stroke="#E6E6E6" />
        <path d="M0 12h38v8a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4v-8z" fill="#F48120" opacity="0.15" />
        <circle cx="22" cy="12" r="5" fill="#F48120" />
        <text x="6" y="13.5" fontSize="6.5" fontWeight="700" fontFamily="Arial, sans-serif" fill="#231F20">DISC</text>
        <text x="27" y="13.5" fontSize="5" fontWeight="700" fontFamily="Arial, sans-serif" fill="#231F20">VER</text>
    </svg>
);

const BRAND_LOGOS = {
    visa:       VisaLogo,
    mastercard: MastercardLogo,
    amex:       AmexLogo,
    discover:   DiscoverLogo,
};

const BRAND_ORDER = ["visa", "mastercard", "amex", "discover"];

/* ═══════════════════════════════════════════════════
   CARD BRAND DISPLAY
   Default: overlapping stack of all brand logos
   Detected: smooth transition to single brand logo
   ═══════════════════════════════════════════════════ */
const CardBrandBadges = ({ brand }) => {
    const detected = brand && brand !== "unknown";

    return (
        <div className="flex items-center" style={{ height: 24 }}>
            <AnimatePresence mode="popLayout">
                {detected && BRAND_LOGOS[brand] ? (
                    /* ── Single detected brand ── */
                    <motion.div
                        key={`detected-${brand}`}
                        initial={{ opacity: 0, scale: 0.7, x: 8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.7, x: 8 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="flex-shrink-0 rounded overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
                    >
                        {React.createElement(BRAND_LOGOS[brand])}
                    </motion.div>
                ) : (
                    /* ── Overlapping stack of all brands ── */
                    <motion.div
                        key="brand-stack"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center"
                    >
                        {BRAND_ORDER.map((id, i) => {
                            const Logo = BRAND_LOGOS[id];
                            return (
                                <motion.div
                                    key={id}
                                    initial={{ x: 10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                    className="flex-shrink-0 rounded overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
                                    style={{
                                        marginLeft: i === 0 ? 0 : -8,
                                        zIndex: BRAND_ORDER.length - i,
                                        opacity: 0.7,
                                    }}
                                >
                                    <Logo />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ═══════════════════════════════════════════════════
   PAYMENT FORM — Split card elements
   ● Card number: full-width row + brand badges
   ● Expiry + CVC: side-by-side row
   ● Auto-focus: number → expiry → CVC
   ● Focus glow, complete check, error highlight
   ● Zero dynamic fields. Fully static layout.
   ═══════════════════════════════════════════════════ */
const PaymentForm = ({ totalAmount, listingId, user, navigate, clientSecret }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMsg, setErrorMsg] = useState(null);
    const [processing, setProcessing] = useState(false);

    /* Per-field interactive state */
    const [cardBrand, setCardBrand] = useState("unknown");
    const [field, setField] = useState({
        number: { focused: false, complete: false, error: false },
        expiry: { focused: false, complete: false, error: false },
        cvc:    { focused: false, complete: false, error: false },
    });

    const updateField = (name, patch) =>
        setField((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));

    /* Dynamic container class based on field state */
    const inputClass = (name) => {
        const s = field[name];
        const base = "w-full bg-[#0d1321] rounded-xl px-4 py-3 transition-all duration-300 border";
        if (s.error)    return `${base} border-red-500/50 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]`;
        if (s.focused)  return `${base} border-emerald-primary/50 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]`;
        if (s.complete) return `${base} border-emerald-primary/25`;
        return `${base} border-white/[0.08] hover:border-white/[0.15]`;
    };

    /* Label class — highlight on focus */
    const labelClass = (name) => {
        const s = field[name];
        const base = "block text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-200";
        if (s.error)   return `${base} text-red-400`;
        if (s.focused) return `${base} text-emerald-primary`;
        return `${base} text-slate-500`;
    };

    /* ── Card Number change: detect brand + auto-focus → expiry ── */
    const onNumberChange = (e) => {
        setCardBrand(e.brand || "unknown");
        updateField("number", { complete: e.complete, error: !!e.error });
        if (e.complete) elements?.getElement(CardExpiryElement)?.focus();
    };

    /* ── Expiry change: auto-focus → CVC ── */
    const onExpiryChange = (e) => {
        updateField("expiry", { complete: e.complete, error: !!e.error });
        if (e.complete) elements?.getElement(CardCvcElement)?.focus();
    };

    /* ── CVC change ── */
    const onCvcChange = (e) => {
        updateField("cvc", { complete: e.complete, error: !!e.error });
    };

    /* ── Submit ── */
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

    /* Small green check for completed fields */
    const CompleteCheck = ({ visible }) => (
        <AnimatePresence>
            {visible && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 20 }}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-primary/15"
                >
                    <CheckCircle2 size={10} className="text-emerald-glow" />
                </motion.span>
            )}
        </AnimatePresence>
    );

    return (
        <form onSubmit={handleSubmit}>
            {/* ROW 1: Card Number — full width */}
            <div className="mb-3">
                <label className={labelClass("number")}>
                    Card Number
                    <CompleteCheck visible={field.number.complete && !field.number.focused} />
                </label>
                <div className="relative">
                    <div className={inputClass("number")}>
                        <CardNumberElement
                            options={{ style: CARD_ELEMENT_STYLE, showIcon: true }}
                            onChange={onNumberChange}
                            onFocus={() => updateField("number", { focused: true })}
                            onBlur={() =>  updateField("number", { focused: false })}
                        />
                    </div>
                    {/* Card brand badges — right side */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CardBrandBadges brand={cardBrand} />
                    </div>
                </div>
            </div>

            {/* ROW 2: Expiry + CVC — side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className={labelClass("expiry")}>
                        Expiry Date
                        <CompleteCheck visible={field.expiry.complete && !field.expiry.focused} />
                    </label>
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
                    <label className={labelClass("cvc")}>
                        CVC
                        <CompleteCheck visible={field.cvc.complete && !field.cvc.focused} />
                    </label>
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

            {/* Error message */}
            {errorMsg && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
                >
                    <span className="text-red-400 text-sm font-semibold">⚠️ {errorMsg}</span>
                </motion.div>
            )}

            {/* CTA — always visible */}
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
                        <span>Place Order — ₹{totalAmount.toFixed(2)}</span>
                        <ArrowRight size={16} />
                    </>
                )}
            </motion.button>
        </form>
    );
};

/* ═══════════════════════════════════════════════════
   CHECKOUT PAGE — Static, No-Scroll, Readable
   ═══════════════════════════════════════════════════ */
const CheckoutPage = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { item } = location.state || {};
    const [stripePk, setStripePk] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [amountError, setAmountError] = useState(null);

    const totalAmount = useMemo(() => {
        if (!item) return 0;
        if (item.isAuction && item.winningTotalAmount) return Number(item.winningTotalAmount);
        return (Number(item.pricePerKwh) || 0) * (Number(item.energyAmount) || 0);
    }, [item]);

    const pricePerKwh = item?.isAuction
        ? (item.winningTotalAmount / item.energyAmount).toFixed(2)
        : item?.pricePerKwh;

    useEffect(() => {
        if (!item) { navigate("/market"); return; }
        if (item.isAuction && (!item.winnerEmail || item.winnerEmail !== user?.email)) {
            toast.error("Unauthorized: You are not the auction winner.");
            navigate("/market"); return;
        }
        if (totalAmount < 1) { setAmountError("Minimum payable amount is ₹1."); return; }

        let cancelled = false;
        (async () => {
            try {
                const { data: cfg } = await axios.get("http://localhost:5000/api/payment/config");
                if (cancelled) return;
                setStripePk(cfg.publishableKey);
                const { data } = await axios.post("http://localhost:5000/api/payment/create-intent", {
                    amount: totalAmount, listingId: item._id,
                });
                if (cancelled) return;
                setClientSecret(data.clientSecret);
            } catch (err) {
                if (cancelled) return;
                if (err.response?.data?.code === "AMOUNT_TOO_LOW") setAmountError(err.response.data.error);
                else toast.error(err.response?.data?.error || "Payment gateway error.");
            }
        })();
        return () => { cancelled = true; };
    }, [item, navigate, user, totalAmount]);

    if (!item) return null;

    const addr = user?.address || {};
    const addressDisplay = [addr.city, addr.state, addr.country].filter(Boolean).join(", ") || "—";

    return (
        <PageTransition>
            <div className="min-h-screen bg-midnight flex flex-col">

                {/* ═══ STICKY HEADER ═══ */}
                <div className="border-b border-glass-light bg-midnight-50/80 backdrop-blur-xl sticky top-0 z-20">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => navigate("/market")}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors group flex-shrink-0"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Back</span>
                        </motion.button>

                        <ProgressBar current={3} />

                        <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                            <Lock size={13} />
                            <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">Secure</span>
                        </div>
                    </div>
                </div>

                {/* ═══ PAGE CONTENT ═══ */}
                <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-6xl mx-auto">

                        {/* Page title */}
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold text-slate-100 flex items-center gap-3 mb-6"
                        >
                            <Zap size={22} className="text-emerald-primary" />
                            Checkout
                        </motion.h1>

                        {/* ═══ TWO-COLUMN LAYOUT ═══ */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                            {/* ──── LEFT COLUMN (7/12) ──── */}
                            <div className="lg:col-span-7 space-y-5">

                                {/* BUYER DETAILS — static, all visible upfront */}
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="bg-surface border border-glass-light rounded-2xl p-5 sm:p-6"
                                >
                                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                                            <User size={15} className="text-emerald-primary" />
                                        </div>
                                        Buyer Information
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { icon: User, label: "Name", value: user?.name || "—" },
                                            { icon: Mail, label: "Email", value: user?.email || "—" },
                                            { icon: MapPin, label: "Location", value: addressDisplay },
                                        ].map((field) => (
                                            <div
                                                key={field.label}
                                                className="bg-midnight-100 rounded-xl px-4 py-3 border border-glass-light"
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <field.icon size={12} className="text-slate-500" />
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{field.label}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-200 truncate">{field.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* PAYMENT — fully static, split card elements */}
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.12 }}
                                    className="bg-surface border border-glass-light rounded-2xl p-5 sm:p-6"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                                                <ShieldCheck size={15} className="text-emerald-primary" />
                                            </div>
                                            Payment Details
                                        </h2>
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Lock size={12} />
                                            <span className="text-xs font-semibold">SSL Encrypted</span>
                                        </div>
                                    </div>

                                    {/* Amount error — static conditional */}
                                    {amountError && (
                                        <div className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                            <p className="text-sm text-red-400 font-semibold">⚠️ {amountError}</p>
                                            <button
                                                onClick={() => navigate("/market")}
                                                className="mt-2 text-sm text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                                            >
                                                Return to Market
                                            </button>
                                        </div>
                                    )}

                                    {/* Split card elements — NO PaymentElement, NO dynamic fields */}
                                    {stripePk && clientSecret && !amountError ? (
                                        <Elements
                                            stripe={getStripe(stripePk)}
                                            options={{
                                                fonts: [
                                                    { cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" },
                                                ],
                                            }}
                                        >
                                            <PaymentForm
                                                totalAmount={totalAmount}
                                                listingId={item._id}
                                                user={user}
                                                navigate={navigate}
                                                clientSecret={clientSecret}
                                            />
                                        </Elements>
                                    ) : !amountError ? (
                                        <div className="flex items-center justify-center py-14 gap-4">
                                            <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-slate-400 text-sm font-medium">Connecting to payment gateway…</p>
                                        </div>
                                    ) : null}
                                </motion.div>
                            </div>

                            {/* ──── RIGHT COLUMN (5/12) — ORDER SUMMARY ──── */}
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
                                            <Zap size={16} className="text-emerald-primary" />
                                            Order Summary
                                        </h2>
                                        {item.isAuction && (
                                            <span className="px-2.5 py-1 bg-accent-violet/10 text-accent-violet text-xs font-bold uppercase rounded-lg border border-accent-violet/20">
                                                Auction Win
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-5 space-y-5">

                                        {/* Energy item card */}
                                        <div className="flex items-center gap-4 p-4 bg-midnight-100 rounded-xl border border-glass-light">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                item.energyType === "Wind"
                                                    ? "bg-accent-cyan/10"
                                                    : "bg-emerald-primary/10"
                                            }`}>
                                                <Zap size={20} className={item.energyType === "Wind" ? "text-accent-cyan" : "text-emerald-primary"} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-slate-200">{item.energyType || "Solar"} Energy</p>
                                                <p className="text-sm text-slate-500">{item.energyAmount} kWh × ₹{pricePerKwh}/unit</p>
                                            </div>
                                        </div>

                                        {/* Price breakdown */}
                                        <div className="space-y-3">
                                            {[
                                                { label: "Rate per Unit", value: `₹${pricePerKwh}` },
                                                { label: "Quantity", value: `${item.energyAmount} kWh` },
                                                { label: "Platform Fee", value: "₹0.00", muted: true },
                                                { label: "GST / Taxes", value: "₹0.00", muted: true },
                                            ].map((row) => (
                                                <div key={row.label} className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-400">{row.label}</span>
                                                    <span className={`text-sm ${row.muted ? "text-slate-600" : "text-slate-200 font-medium"}`}>
                                                        {row.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total */}
                                        <div className="border-t-2 border-dashed border-glass-light pt-4 flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-300">Total Due</span>
                                            <span className="text-3xl font-black text-emerald-glow">
                                                ₹{totalAmount.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* TX */}
                                        <p className="text-xs text-slate-600 font-mono text-center pt-1">
                                            TX: {item._id}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="bg-midnight-100 px-5 py-3 border-t border-glass-light flex items-center justify-center gap-2 text-slate-600">
                                        <Lock size={11} />
                                        <span className="text-xs font-semibold uppercase tracking-wider">256-bit SSL Encrypted</span>
                                    </div>
                                </motion.div>
                            </div>

                        </div>
                    </div>
                </div>

                <ContactSellerButton sellerEmail={item?.sellerAddress} />
            </div>
        </PageTransition>
    );
};

export default CheckoutPage;