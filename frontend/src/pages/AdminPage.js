import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import ScrollReveal, { StaggerContainer, StaggerItem } from "../components/ScrollReveal";
import AnimatedCounter from "../components/AnimatedCounter";
import { Shield, Zap, Users, BarChart3, Battery, DollarSign, Search, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

const AdminPage = () => {
    const { user, loading: authLoading } = useContext(UserContext);
    const navigate = useNavigate();
    const [showTrades, setShowTrades] = useState(false);
    const [trades, setTrades] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [tradeStatusFilter, setTradeStatusFilter] = useState("All");
    const [expandedTrade, setExpandedTrade] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) navigate("/login");
            else if (user.role !== "admin") { navigate("/"); toast.error("Access denied."); }
        }
    }, [user, authLoading, navigate]);

    useEffect(() => { if (user?.role === "admin" && user?.token) fetchStats(); }, [user]);

    const fetchStats = async () => { try { const res = await axios.get("http://localhost:5000/api/admin/stats", { headers: { Authorization: `Bearer ${user.token}` } }); setStats(res.data); } catch (err) { console.error(err); } };

    const fetchTrades = async () => {
        if (!user?.token) return; setLoading(true); setError(null);
        try { const res = await axios.get("http://localhost:5000/api/admin/trades", { headers: { Authorization: `Bearer ${user.token}` } }); setTrades(res.data); }
        catch (err) { setError(err.response?.data?.message || "Failed to fetch trades"); toast.error("Failed to fetch trades"); }
        finally { setLoading(false); }
    };

    const handleToggleTrades = () => { if (!showTrades) fetchTrades(); setShowTrades(!showTrades); };

    const filteredTrades = trades.filter(trade => {
        const s = searchTerm.toLowerCase();
        const matchesSearch = trade._id.toLowerCase().includes(s) || (trade.buyerInfo?.email || trade.buyerAddress || "").toLowerCase().includes(s) || (trade.sellerInfo?.email || trade.sellerAddress || "").toLowerCase().includes(s) || (trade.buyerInfo?.name || "").toLowerCase().includes(s) || (trade.sellerInfo?.name || "").toLowerCase().includes(s);
        const matchesPayment = paymentFilter === "All" || (trade.paymentStatus || "pending") === paymentFilter;
        const matchesTradeStatus = tradeStatusFilter === "All" || (trade.status || "pending") === tradeStatusFilter;
        return matchesSearch && matchesPayment && matchesTradeStatus;
    });

    const formatDate = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A";
    const getPaymentBadgeColor = (s) => ({ paid: "bg-emerald-primary/10 text-emerald-glow border-emerald-primary/20", failed: "bg-red-500/10 text-red-400 border-red-500/20", refunded: "bg-accent-violet/10 text-accent-violet border-accent-violet/20" }[s] || "bg-accent-amber/10 text-accent-amber border-accent-amber/20");
    const getTradeBadgeColor = (s) => ({ completed: "bg-emerald-primary/10 text-emerald-glow border-emerald-primary/20", Delivered: "bg-emerald-primary/10 text-emerald-glow border-emerald-primary/20", cancelled: "bg-red-500/10 text-red-400 border-red-500/20", Cancelled: "bg-red-500/10 text-red-400 border-red-500/20", matched: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20", Processing: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20" }[s] || "bg-accent-amber/10 text-accent-amber border-accent-amber/20");

    if (authLoading) return <div className="min-h-screen bg-midnight flex items-center justify-center"><div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" /></div>;
    if (!user || user.role !== "admin") return null;

    return (
        <PageTransition>
            <div className="min-h-screen bg-midnight py-8 px-4 sm:px-6 lg:px-8">
                {/* HEADER */}
                <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto mb-10">
                    <div className="bg-gradient-to-r from-surface to-midnight-200 rounded-2xl p-8 border border-glass-light relative overflow-hidden">
                        <motion.div animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }} transition={{ duration: 15, repeat: Infinity }} className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-primary/5 rounded-full blur-[120px]" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-accent-violet" /><p className="text-accent-violet text-xs font-bold uppercase tracking-wider">Admin Dashboard</p></div>
                            <h1 className="text-3xl font-bold text-slate-100 mb-1">Welcome, {user.name || "Admin"}</h1>
                            <p className="text-slate-500 text-sm">GreenTrade — P2P Energy Trading Platform</p>
                        </div>
                    </div>
                </motion.div>

                {/* STATS */}
                <div className="max-w-7xl mx-auto mb-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Zap, label: "Total Trades", value: stats?.totalTrades || 0, color: "emerald" },
                            { icon: BarChart3, label: "Active Listings", value: stats?.totalListings || 0, color: "cyan" },
                            { icon: Users, label: "Total Users", value: stats?.totalUsers || 0, color: "violet" },
                            { icon: Battery, label: "Energy Traded", value: stats?.totalEnergyTraded || 0, color: "amber", suffix: " kWh" },
                        ].map((stat, i) => (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} whileHover={{ y: -4, scale: 1.02 }} className="bg-surface border border-glass-light p-5 rounded-2xl card-hover">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color === 'emerald' ? 'bg-emerald-primary/10' : stat.color === 'cyan' ? 'bg-accent-cyan/10' : stat.color === 'violet' ? 'bg-accent-violet/10' : 'bg-accent-amber/10'}`}>
                                    <stat.icon size={18} className={stat.color === 'emerald' ? 'text-emerald-primary' : stat.color === 'cyan' ? 'text-accent-cyan' : stat.color === 'violet' ? 'text-accent-violet' : 'text-accent-amber'} />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-100 mt-1">
                                    <AnimatedCounter target={typeof stat.value === 'string' ? parseFloat(stat.value) : stat.value} suffix={stat.suffix || ""} className="text-2xl font-bold text-slate-100" />
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="max-w-7xl mx-auto mb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div whileHover={{ y: -3 }} onClick={handleToggleTrades} className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 card-hover ${showTrades ? "bg-emerald-primary/5 border-emerald-primary/20 shadow-glow" : "bg-surface border-glass-light"}`}>
                            <div className="flex items-center gap-4 mb-4">
                                <motion.div animate={showTrades ? { rotate: 360 } : {}} transition={{ duration: 0.5 }} className={`w-12 h-12 rounded-xl flex items-center justify-center ${showTrades ? "bg-emerald-primary text-midnight" : "bg-midnight-200 text-slate-400"}`}><Zap size={20} /></motion.div>
                                <div><h3 className="text-lg font-bold text-slate-100">View All Trades</h3><p className="text-sm text-slate-500">Browse all P2P energy trades (read-only)</p></div>
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 btn-press ${showTrades ? "bg-emerald-primary hover:bg-emerald-glow text-midnight" : "bg-midnight-200 hover:bg-midnight-300 text-slate-300"}`}>
                                {showTrades ? <><ChevronUp size={16} /> Hide Trades</> : <><ChevronDown size={16} /> View All Trades</>}
                            </motion.button>
                        </motion.div>
                        <ScrollReveal direction="right">
                            <div className="bg-gradient-to-br from-accent-violet/5 to-surface border border-accent-violet/15 p-6 rounded-2xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-accent-violet/10 text-accent-violet flex items-center justify-center"><DollarSign size={20} /></div>
                                    <div><h3 className="text-lg font-bold text-slate-100">Total Volume</h3><p className="text-2xl font-bold text-accent-violet">₹<AnimatedCounter target={parseFloat(stats?.totalVolume) || 0} decimals={2} className="text-2xl font-bold text-accent-violet" /></p></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-midnight-100 p-2.5 rounded-lg border border-glass-light"><span className="text-emerald-glow font-bold">{stats?.paymentStats?.paid || 0}</span><span className="text-slate-500 ml-1">Paid</span></div>
                                    <div className="bg-midnight-100 p-2.5 rounded-lg border border-glass-light"><span className="text-accent-amber font-bold">{stats?.paymentStats?.pending || 0}</span><span className="text-slate-500 ml-1">Pending</span></div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* TRADES */}
                <AnimatePresence>
                    {showTrades && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto overflow-hidden">
                            {/* Filters */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-glass-light p-6 rounded-2xl mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Search</label><div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" /><input type="text" placeholder="Search by ID, buyer/seller..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 input-glow transition-all" /></div></div>
                                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Payment</label><select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="w-full p-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-200 focus:outline-none focus:border-emerald-primary/50"><option value="All">All</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></div>
                                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Status</label><select value={tradeStatusFilter} onChange={(e) => setTradeStatusFilter(e.target.value)} className="w-full p-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-200 focus:outline-none focus:border-emerald-primary/50"><option value="All">All</option><option value="pending">Pending</option><option value="matched">Matched</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                                </div>
                            </motion.div>

                            {loading && <div className="text-center py-10"><div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500">Loading trades...</p></div>}

                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                                    <p className="text-red-400 font-bold">{error}</p>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchTrades} className="mt-4 px-6 py-2 bg-red-500/20 text-red-400 rounded-xl font-bold flex items-center gap-2 mx-auto btn-press"><RefreshCw size={14} /> Retry</motion.button>
                                </motion.div>
                            )}

                            {!loading && !error && (
                                <StaggerContainer className="space-y-3" staggerDelay={0.04}>
                                    {filteredTrades.length === 0 ? (
                                        <div className="bg-surface rounded-2xl p-10 text-center border border-glass-light"><p className="text-slate-500 text-lg">No trades found matching your criteria.</p></div>
                                    ) : (
                                        filteredTrades.map((trade) => (
                                            <StaggerItem key={trade._id}>
                                                <motion.div whileHover={{ x: 3 }} className="bg-surface rounded-2xl border border-glass-light overflow-hidden card-hover">
                                                    <div className="p-5 cursor-pointer" onClick={() => setExpandedTrade(expandedTrade === trade._id ? null : trade._id)}>
                                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-primary/10 flex items-center justify-center"><Zap size={16} className="text-emerald-primary" /></div>
                                                                <div><p className="font-bold text-slate-200 text-sm">{trade.energyAmount} kWh @ ₹{trade.pricePerKwh}/kWh</p><p className="text-xs text-slate-500">{trade.energyType || "Solar"}</p></div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="px-2.5 py-1 bg-midnight-200 rounded-lg text-[10px] font-mono text-slate-500">#{trade._id.slice(-8)}</span>
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${getPaymentBadgeColor(trade.paymentStatus || "pending")}`}>{trade.paymentStatus || "pending"}</span>
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${getTradeBadgeColor(trade.status || "pending")}`}>{trade.status || "pending"}</span>
                                                                <motion.div animate={{ rotate: expandedTrade === trade._id ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} className="text-slate-500" /></motion.div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500"><span>📅 {formatDate(trade.updatedAt || trade.createdAt)}</span><span className="font-bold text-emerald-glow">Total: ₹{(trade.energyAmount * trade.pricePerKwh).toFixed(2)}</span></div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {expandedTrade === trade._id && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                                                <div className="border-t border-glass-light p-6 bg-midnight-50">
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                        <div><h4 className="font-bold text-slate-200 mb-3 text-sm">Trade Details</h4><div className="space-y-2 text-xs bg-surface p-4 rounded-xl border border-glass-light"><div className="flex justify-between"><span className="text-slate-500">ID:</span><span className="font-mono text-slate-400 text-[10px]">{trade._id}</span></div><div className="flex justify-between"><span className="text-slate-500">Type:</span><span className="text-slate-300">{trade.energyType || "Solar"}</span></div><div className="flex justify-between"><span className="text-slate-500">Amount:</span><span className="text-slate-300 font-bold">{trade.energyAmount} kWh</span></div><div className="flex justify-between"><span className="text-slate-500">Price:</span><span className="text-slate-300">₹{trade.pricePerKwh}</span></div><div className="flex justify-between border-t border-glass-light pt-2"><span className="text-slate-500 font-bold">Total:</span><span className="font-bold text-emerald-glow">₹{(trade.energyAmount * trade.pricePerKwh).toFixed(2)}</span></div><div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="text-slate-300">{formatDate(trade.updatedAt || trade.createdAt)}</span></div>{trade.transactionId && <div className="flex justify-between"><span className="text-slate-500">TXN:</span><span className="font-mono text-[10px] text-slate-400">{trade.transactionId}</span></div>}</div></div>
                                                                        <div><h4 className="font-bold text-slate-200 mb-3 text-sm">Buyer</h4><div className="bg-surface p-4 rounded-xl border border-glass-light"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold text-sm">{(trade.buyerInfo?.name || trade.buyerAddress || "?").charAt(0).toUpperCase()}</div><div><p className="font-bold text-slate-200 text-sm">{trade.buyerInfo?.name || "Unknown"}</p><p className="text-[10px] text-slate-500">{trade.buyerInfo?.email || trade.buyerAddress}</p></div></div></div></div>
                                                                        <div><h4 className="font-bold text-slate-200 mb-3 text-sm">Seller</h4><div className="bg-surface p-4 rounded-xl border border-glass-light"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-emerald-primary/10 flex items-center justify-center text-emerald-primary font-bold text-sm">{(trade.sellerInfo?.name || trade.sellerAddress || "?").charAt(0).toUpperCase()}</div><div><p className="font-bold text-slate-200 text-sm">{trade.sellerInfo?.name || "Unknown"}</p><p className="text-[10px] text-slate-500">{trade.sellerInfo?.email || trade.sellerAddress}</p></div></div></div></div>
                                                                    </div>
                                                                    <div className="mt-5 p-3 bg-midnight-100 rounded-xl border border-glass-light"><p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Status (Read-Only)</p><div className="flex flex-wrap gap-3 text-xs"><div className="flex items-center gap-1.5"><span className="text-slate-500">Payment:</span><span className={`px-2.5 py-0.5 rounded-md font-bold uppercase border ${getPaymentBadgeColor(trade.paymentStatus || "pending")}`}>{trade.paymentStatus || "pending"}</span></div><div className="flex items-center gap-1.5"><span className="text-slate-500">Trade:</span><span className={`px-2.5 py-0.5 rounded-md font-bold uppercase border ${getTradeBadgeColor(trade.status || "pending")}`}>{trade.status || "pending"}</span></div></div></div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            </StaggerItem>
                                        ))
                                    )}
                                </StaggerContainer>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

export default AdminPage;
