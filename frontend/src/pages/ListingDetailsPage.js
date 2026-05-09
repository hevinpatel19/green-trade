import React, { useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import {
    Zap, ArrowLeft, ShoppingCart, TrendingUp, TrendingDown,
    Calendar, User, MapPin, BarChart3, Activity, Clock,
    ArrowRight, ShieldCheck, Gauge, Package
} from "lucide-react";

/* ── Seeded PRNG for deterministic mock data ── */
const seededRandom = (seed) => {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s & 0x7fffffff) / 2147483647; };
};

/* ── Generate realistic price history ── */
const generatePriceHistory = (item) => {
    const id = item._id || "default";
    const rand = seededRandom(id);
    const basePrice = Number(item.basePrice || item.pricePerKwh || 5);
    const dynamicPrice = Number(item.dynamicPrice || basePrice);
    const createdAt = new Date(item.createdAt || Date.now() - 7 * 86400000);
    const now = new Date();
    const totalMs = now - createdAt;
    const points = Math.min(48, Math.max(20, Math.floor(totalMs / 3600000)));
    const stepMs = totalMs / (points - 1);
    const data = [];
    let price = basePrice;
    const drift = (dynamicPrice - basePrice) / points;

    for (let i = 0; i < points; i++) {
        const t = new Date(createdAt.getTime() + stepMs * i);
        const noise = (rand() - 0.5) * basePrice * 0.12;
        price = price + drift + noise;
        price = Math.max(basePrice * 0.7, Math.min(basePrice * 1.5, price));
        if (i === points - 1) price = dynamicPrice;
        data.push({
            time: t.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " " + t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            price: parseFloat(price.toFixed(2)),
            idx: i,
        });
    }
    return data;
};

/* ── Custom Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-midnight-50 border border-glass-light rounded-xl px-4 py-3 shadow-card">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-base font-bold text-emerald-glow">₹{payload[0].value.toFixed(2)}<span className="text-xs text-slate-500 ml-1">/kWh</span></p>
        </div>
    );
};

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, color = "text-slate-200", sub }) => (
    <div className="bg-midnight-100 rounded-xl p-4 border border-glass-light">
        <div className="flex items-center gap-2 mb-2">
            <Icon size={13} className="text-slate-500" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
);

/* ═══════════════════════════════════════════════
   LISTING DETAILS PAGE
   ═══════════════════════════════════════════════ */
const ListingDetailsPage = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { item, marketData } = location.state || {};

    // Redirect if no data
    if (!item) { navigate("/market"); return null; }

    const basePrice = Number(item.basePrice || item.pricePerKwh);
    const dynamicPrice = Number(item.dynamicPrice || basePrice);
    const totalAmount = dynamicPrice * Number(item.energyAmount);
    const priceChange = basePrice > 0 ? (((dynamicPrice - basePrice) / basePrice) * 100).toFixed(1) : 0;
    const isUp = priceChange > 0;
    const isDown = priceChange < 0;

    const priceData = useMemo(() => generatePriceHistory(item), [item]);
    const highPrice = Math.max(...priceData.map(d => d.price)).toFixed(2);
    const lowPrice = Math.min(...priceData.map(d => d.price)).toFixed(2);

    const handleCheckout = () => {
        if (!user) { navigate("/login"); return; }
        navigate("/checkout", { state: { item: { ...item, pricePerKwh: dynamicPrice } } });
    };

    const listingDate = new Date(item.createdAt || Date.now());
    const multiplier = marketData?.multiplier || 1;
    const isSold = item.isSold || item.status === "completed";
    const statusLabel = isSold ? "Sold" : "Active";
    const statusColor = isSold ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-primary/10 text-emerald-glow border-emerald-primary/20";

    return (
        <PageTransition>
            <div className="min-h-screen bg-midnight">

                {/* ═══ HEADER ═══ */}
                <div className="border-b border-glass-light bg-midnight-50/80 backdrop-blur-xl sticky top-0 z-20">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/market")}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Back to Market</span>
                        </motion.button>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-600 font-mono hidden sm:inline">ID: {item._id?.slice(-8)}</span>
                            <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-lg border ${statusColor}`}>{statusLabel}</span>
                        </div>
                    </div>
                </div>

                {/* ═══ CONTENT ═══ */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

                    {/* Title row */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.energyType === "Wind" ? "bg-accent-cyan/10" : "bg-emerald-primary/10"}`}>
                                <Zap size={26} className={item.energyType === "Wind" ? "text-accent-cyan" : "text-emerald-primary"} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-100">{item.energyType || "Solar"} Energy</h1>
                                <p className="text-sm text-slate-500">{item.energyAmount} kWh available</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-3xl font-black text-emerald-glow">₹{dynamicPrice}</span>
                                <span className="text-sm text-slate-500">/kWh</span>
                            </div>
                            {priceChange != 0 && (
                                <div className={`flex items-center gap-1 justify-end mt-1 ${isUp ? "text-red-400" : "text-emerald-glow"}`}>
                                    {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    <span className="text-sm font-bold">{isUp ? "+" : ""}{priceChange}%</span>
                                    <span className="text-xs text-slate-600 ml-1">vs base</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                        {/* ──── LEFT COLUMN (8/12) ──── */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* PRICE CHART */}
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                                className="bg-surface border border-glass-light rounded-2xl p-5 sm:p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                                            <Activity size={15} className="text-emerald-primary" />
                                        </div>
                                        Price History
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className="live-dot" />
                                        <span className="text-xs font-semibold text-slate-500">{isSold ? "Final" : "Live"}</span>
                                    </div>
                                </div>

                                <div className="h-[280px] sm:h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={priceData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#475569" }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} interval="preserveStartEnd" />
                                            <YAxis tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `₹${v}`} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2.5} fill="url(#priceGradient)" dot={false} activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: "#0a0f1a" }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* PRICE STATISTICS */}
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard icon={TrendingUp} label="Current" value={`₹${dynamicPrice}`} color="text-emerald-glow" />
                                <StatCard icon={BarChart3} label="Base Price" value={`₹${basePrice}`} sub="Listed rate" />
                                <StatCard icon={TrendingUp} label="High" value={`₹${highPrice}`} color="text-red-400" />
                                <StatCard icon={TrendingDown} label="Low" value={`₹${lowPrice}`} color="text-accent-cyan" />
                            </motion.div>

                            {/* OVERVIEW / DETAILS */}
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                className="bg-surface border border-glass-light rounded-2xl p-5 sm:p-6">
                                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                                        <Package size={15} className="text-emerald-primary" />
                                    </div>
                                    Listing Details
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: Zap, label: "Energy Type", value: item.energyType || "Solar" },
                                        { icon: Gauge, label: "Quantity", value: `${item.energyAmount} kWh` },
                                        { icon: BarChart3, label: "Total Value", value: `₹${totalAmount.toFixed(2)}` },
                                        { icon: Calendar, label: "Listed On", value: listingDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                                        { icon: Activity, label: "Market Multiplier", value: `${multiplier}x` },
                                        { icon: Clock, label: "Status", value: statusLabel },
                                    ].map((row) => (
                                        <div key={row.label} className="flex items-center gap-3 bg-midnight-100 rounded-xl px-4 py-3 border border-glass-light">
                                            <div className="w-9 h-9 rounded-lg bg-midnight-200 flex items-center justify-center flex-shrink-0">
                                                <row.icon size={15} className="text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{row.label}</p>
                                                <p className="text-sm font-bold text-slate-200 truncate">{row.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* ──── RIGHT COLUMN (4/12) ──── */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* SELLER INFO */}
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                                className="bg-surface border border-glass-light rounded-2xl p-5 sm:p-6 lg:sticky lg:top-20">
                                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                                        <User size={15} className="text-emerald-primary" />
                                    </div>
                                    Seller Information
                                </h2>

                                <div className="flex items-center gap-3 mb-5 p-3 bg-midnight-100 rounded-xl border border-glass-light">
                                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-primary to-emerald-deep rounded-xl flex items-center justify-center text-white font-bold text-base shadow-glow">
                                        {item.sellerAddress?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-200 truncate">{item.sellerAddress || "Unknown"}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><ShieldCheck size={10} /> Verified Seller</p>
                                    </div>
                                </div>

                                {/* Market condition */}
                                {marketData && (
                                    <div className="space-y-3 mb-5">
                                        <div className="flex items-center justify-between p-3 bg-midnight-100 rounded-xl border border-glass-light">
                                            <span className="text-xs text-slate-500 font-semibold">Market</span>
                                            <span className="text-xs font-bold text-emerald-glow">{marketData.condition || "Normal"}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-midnight-100 rounded-xl border border-glass-light">
                                            <span className="text-xs text-slate-500 font-semibold">Trend</span>
                                            <span className="text-xs font-bold text-slate-300">{marketData.trend || "STABLE"}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-midnight-100 rounded-xl border border-glass-light text-center">
                                                <p className="text-[10px] text-slate-600 font-semibold uppercase">Demand</p>
                                                <p className="text-sm font-bold text-slate-300">{marketData.demandScore ?? "—"}</p>
                                            </div>
                                            <div className="p-3 bg-midnight-100 rounded-xl border border-glass-light text-center">
                                                <p className="text-[10px] text-slate-600 font-semibold uppercase">Supply</p>
                                                <p className="text-sm font-bold text-slate-300">{marketData.supplyScore ?? "—"}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PRICE SUMMARY */}
                                <div className="border-t border-glass-light pt-5 space-y-3 mb-5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Rate</span>
                                        <span className="text-sm font-semibold text-slate-200">₹{dynamicPrice}/kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Quantity</span>
                                        <span className="text-sm font-semibold text-slate-200">{item.energyAmount} kWh</span>
                                    </div>
                                    <div className="border-t-2 border-dashed border-glass-light pt-3 flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-300">Total</span>
                                        <span className="text-2xl font-black text-emerald-glow">₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* CTA */}
                                {!isSold ? (
                                    <motion.button onClick={handleCheckout}
                                        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                                        className="w-full py-4 bg-gradient-to-r from-emerald-primary to-emerald-glow text-midnight font-bold text-base rounded-xl transition-all shadow-glow hover:shadow-glow-lg flex items-center justify-center gap-3 ripple-btn btn-press">
                                        <ShoppingCart size={18} />
                                        <span>Proceed to Checkout</span>
                                        <ArrowRight size={16} />
                                    </motion.button>
                                ) : (
                                    <div className="w-full py-4 bg-midnight-300 text-slate-600 font-bold text-base rounded-xl flex items-center justify-center gap-3 cursor-not-allowed">
                                        This listing has been sold
                                    </div>
                                )}

                                <p className="text-xs text-slate-600 text-center mt-3 flex items-center justify-center gap-1.5">
                                    <ShieldCheck size={10} /> Secured by GreenTrade
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default ListingDetailsPage;
