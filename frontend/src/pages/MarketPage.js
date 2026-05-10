import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import ScrollReveal, { StaggerContainer, StaggerItem } from "../components/ScrollReveal";
import { MapPin, Plus, X, TrendingUp, Brain, Zap, Timer, Gavel, ShoppingCart } from "lucide-react";
import { API_URL } from "../utils/api";

const MarketPage = () => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [auctions, setAuctions] = useState([]);
    const [auctionTimers, setAuctionTimers] = useState({});
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("All");
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ amount: "", price: "", isAuction: false, duration: 24, energyType: "Solar" });

    const buyerAddr = user?.address || {};
    const hasCompleteAddress = buyerAddr.city && buyerAddr.country;
    const buyerLocationDisplay = hasCompleteAddress ? `${buyerAddr.city}${buyerAddr.state ? ", " + buyerAddr.state : ""}, ${buyerAddr.country}` : null;

    useEffect(() => {
        if (!user || !hasCompleteAddress) return;
        let cancelled = false;
        const fetchDynamicFeed = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${API_URL}/api/market/dynamic-feed?buyerEmail=${encodeURIComponent(user.email)}`);
                if (cancelled) return;
                setListings(data.listings); setAuctions(data.auctions || []); setMarketData(data.market);
            } catch (err) { if (!cancelled && err.response?.status !== 403) toast.error("Failed to fetch market data."); }
            if (!cancelled) setLoading(false);
        };
        fetchDynamicFeed();
        return () => { cancelled = true; };
    }, [user, hasCompleteAddress]);

    const handleListEnergy = async (e) => {
        e.preventDefault();
        if (!user) return toast.error("Please Login to Sell");
        try {
            await axios.post(`${API_URL}/api/market/list`, { sellerAddress: user.email, energyAmount: formData.amount, pricePerKwh: formData.price, isAuction: formData.isAuction, durationHours: formData.duration, energyType: formData.energyType });
            toast.success("Listed Successfully!"); setShowForm(false); setListings([]); setAuctions([]); setLoading(true);
            const { data } = await axios.get(`${API_URL}/api/market/dynamic-feed?buyerEmail=${encodeURIComponent(user.email)}`);
            setListings(data.listings); setAuctions(data.auctions || []); setMarketData(data.market); setLoading(false);
        } catch (err) { toast.error("Failed to list: " + (err.response?.data?.message || err.message)); }
    };

    const handleBuyClick = (item) => { if (!user) return toast.error("Please Login First"); navigate(`/listing/${item._id}`, { state: { item: { ...item, pricePerKwh: item.dynamicPrice }, marketData } }); };
    const handleBidClick = (item) => { if (!user) return toast.error("Please Login First"); navigate("/auction", { state: { item } }); };

    useEffect(() => {
        if (auctions.length === 0) return;
        const tick = () => {
            const now = new Date(); const timers = {};
            auctions.forEach((a) => {
                const diff = new Date(a.auctionEndsAt) - now;
                if (diff <= 0) timers[a._id] = "EXPIRED";
                else { const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); const s = Math.floor((diff % 60000) / 1000); timers[a._id] = `${h}h ${m}m ${s}s`; }
            });
            setAuctionTimers(timers);
        };
        tick(); const interval = setInterval(tick, 1000); return () => clearInterval(interval);
    }, [auctions]);

    const filteredListings = filter === "All" ? listings : listings.filter((item) => item.energyType === filter);
    const filteredAuctions = filter === "All" ? auctions : auctions.filter((item) => item.energyType === filter);
    const multiplierColor = (m) => (m > 1.2 ? "text-red-400" : m < 0.9 ? "text-accent-cyan" : "text-emerald-glow");

    if (!user || !hasCompleteAddress) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, type: "spring" }} className="max-w-md w-full text-center">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20 bg-accent-amber/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <MapPin size={36} className="text-accent-amber" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-slate-100 mb-3">Profile Address Required</h1>
                        <p className="text-slate-400 mb-8 leading-relaxed">Complete your profile address to view nearby energy listings.</p>
                        <div className="bg-surface border border-glass-light rounded-2xl p-6 mb-6 shadow-card">
                            <p className="text-slate-500 text-sm mb-4">Add your <strong className="text-slate-300">city</strong> and <strong className="text-slate-300">country</strong> to get started.</p>
                            <motion.a whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} href="/profile" className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl transition-colors shadow-glow ripple-btn btn-press">Go to Profile <MapPin size={16} /></motion.a>
                        </div>
                    </motion.div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-midnight py-8 px-4 sm:px-6 lg:px-8">

                {/* HEADER */}
                <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                            Live Energy Market <span className="live-dot" />
                        </h1>
                        <p className="text-slate-500 mt-1">Showing listings near <strong className="text-slate-300">{marketData?.city || buyerLocationDisplay}</strong></p>
                    </div>
                    <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl transition-colors shadow-glow hover:shadow-glow-lg flex items-center gap-2 ripple-btn btn-press">
                        <Plus size={18} /> Sell Energy
                    </motion.button>
                </motion.div>

                {/* SELL FORM */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -20, height: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }} className="max-w-3xl mx-auto mb-10 overflow-hidden">
                            <div className="bg-surface border border-glass-light rounded-2xl p-8 shadow-card relative">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-xl text-slate-100">Create New Listing</h3>
                                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowForm(false)} className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition">
                                        <X size={20} />
                                    </motion.button>
                                </div>
                                <form onSubmit={handleListEnergy} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Energy Amount (kWh)</label><input type="number" required className="w-full p-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-100 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 input-glow transition-all" onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
                                        <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{formData.isAuction ? "Starting Bid Price (₹)" : "Base Price per Unit (₹)"}</label><input type="number" required className="w-full p-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-100 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 input-glow transition-all" onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-midnight-100 p-4 rounded-xl border border-glass-light">
                                        <motion.button type="button" onClick={() => setFormData({ ...formData, isAuction: !formData.isAuction })} whileTap={{ scale: 0.9 }} className={`w-11 h-6 rounded-full transition-all duration-300 relative ${formData.isAuction ? 'bg-accent-violet' : 'bg-midnight-300'}`}>
                                            <motion.span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow" animate={{ left: formData.isAuction ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                                        </motion.button>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-300 text-sm">Auction Mode</p>
                                            <p className="text-xs text-slate-500">Allow buyers to bid on your energy</p>
                                        </div>
                                        <AnimatePresence>
                                            {formData.isAuction && (
                                                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}>
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">Duration: {formData.duration}h</label>
                                                    <input type="range" min="1" max="48" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full h-1.5 bg-midnight-300 rounded-lg appearance-none cursor-pointer accent-accent-violet" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <motion.button type="submit" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} className="w-full py-4 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl transition-colors shadow-glow hover:shadow-glow-lg flex items-center justify-center gap-2 ripple-btn btn-press">
                                        <Zap size={18} /> List on Market
                                    </motion.button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI HUD */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <ScrollReveal direction="left">
                        <div className="bg-surface border border-glass-light rounded-2xl p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div><h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-primary" /> Live Index</h2><p className="text-sm text-slate-500 font-medium">{marketData?.condition || "Loading..."}</p></div>
                                <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className={`text-2xl font-bold px-3 py-1 rounded-lg border ${(marketData?.multiplier || 1) > 1 ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-primary/10 border-emerald-primary/20 text-emerald-glow"}`}>{marketData?.multiplier || "—"}x</motion.span>
                            </div>
                            <div className="bg-midnight-100 p-3 rounded-xl border border-glass-light">
                                <div className="flex items-center justify-between"><span className="text-xs text-slate-500 font-medium flex items-center gap-1"><MapPin size={12} /> Your Area</span><span className="text-sm font-semibold text-slate-300">{buyerLocationDisplay}</span></div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="right">
                        <div className="bg-gradient-to-br from-surface to-midnight-200 border border-glass-light rounded-2xl p-6 relative overflow-hidden">
                            <motion.div animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-10 -right-10 w-40 h-40 bg-accent-cyan/5 rounded-full blur-[80px]" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                                        <Brain size={24} className="text-accent-cyan" />
                                    </motion.div>
                                    <h2 className="text-lg font-bold text-shimmer">AI Sentinel</h2>
                                </div>
                                {marketData ? (
                                    <div>
                                        <p className="text-xl font-bold text-slate-100 mb-2">{marketData.trend}</p>
                                        <p className="text-slate-500 italic text-sm">"{marketData.advice}"</p>
                                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                            {[`Demand: ${marketData.demandScore}`, `Supply: ${marketData.supplyScore}`, `Listings: ${marketData.activeListings}`].map((tag) => (
                                                <span key={tag} className="bg-midnight-100 border border-glass-light px-3 py-1 rounded-lg text-slate-400">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="skeleton h-5 w-3/4 rounded-lg" />
                                        <div className="skeleton h-4 w-full rounded-lg" />
                                        <div className="skeleton h-4 w-2/3 rounded-lg" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* FILTERS */}
                <div className="max-w-7xl mx-auto mb-6 flex gap-2">
                    {["All", "Solar", "Wind"].map((type) => (
                        <motion.button key={type} onClick={() => setFilter(type)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === type ? "bg-emerald-primary text-midnight shadow-glow" : "bg-surface border border-glass-light text-slate-400 hover:text-slate-200 hover:bg-surface-light"}`}>
                            {type}
                        </motion.button>
                    ))}
                </div>

                {/* LISTING CARDS */}
                <StaggerContainer className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-500 font-medium">Finding nearby listings...</p>
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <p className="text-center col-span-full text-slate-600 py-16 text-lg">No listings available near <strong className="text-slate-400">{buyerLocationDisplay}</strong> right now.</p>
                    ) : (
                        filteredListings.map((item) => (
                            <StaggerItem key={item._id}>
                                <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} onClick={() => handleBuyClick(item)} className="bg-surface border border-glass-light rounded-2xl overflow-hidden card-hover border-glow-animate group cursor-pointer">
                                    <div className={`h-1 ${item.energyType === "Wind" ? "bg-accent-cyan" : "bg-gradient-to-r from-accent-amber to-emerald-primary"}`} />
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{item.energyType}</span>
                                                <h3 className="text-2xl font-bold text-slate-100 mt-1">{item.energyAmount} <span className="text-sm text-slate-500 font-normal">kWh</span></h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Dynamic Rate</span>
                                                <h3 className={`text-xl font-bold ${multiplierColor(marketData?.multiplier || 1)}`}>₹{item.dynamicPrice}</h3>
                                                {item.dynamicPrice !== item.basePrice && <p className="text-[10px] text-slate-600 line-through">₹{item.basePrice}</p>}
                                            </div>
                                        </div>
                                        <div className="border-t border-glass-light pt-4 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-md bg-midnight-200 flex items-center justify-center text-[10px] font-bold text-slate-400">{item.sellerAddress?.charAt(0).toUpperCase() || "U"}</div>
                                                <div><p className="text-[10px] text-slate-600">Seller</p><p className="font-semibold text-slate-400 text-xs truncate w-20">{item.sellerAddress}</p></div>
                                            </div>
                                            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleBuyClick(item); }} className="px-5 py-2 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold text-sm rounded-lg transition-colors shadow-glow hover:shadow-glow-lg flex items-center gap-1.5 ripple-btn btn-press">
                                                <ShoppingCart size={14} /> Buy Now
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            </StaggerItem>
                        ))
                    )}
                </StaggerContainer>

                {/* AUCTIONS */}
                {filteredAuctions.length > 0 && (
                    <div className="max-w-7xl mx-auto mt-16">
                        <ScrollReveal className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                                <Gavel size={22} className="text-accent-violet" /> Active Auctions
                                <motion.span animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 bg-accent-violet rounded-full" />
                            </h2>
                            <p className="text-slate-500 mt-1">Place bids on energy auctions ending soon.</p>
                        </ScrollReveal>
                        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
                            {filteredAuctions.map((item) => (
                                <StaggerItem key={item._id}>
                                    <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="bg-surface border border-accent-violet/15 rounded-2xl overflow-hidden card-hover">
                                        <div className="h-1 bg-gradient-to-r from-accent-violet to-accent-cyan" />
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-0.5 bg-accent-violet/10 text-accent-violet text-[10px] font-bold uppercase rounded-md">Auction</span>
                                                        <span className="text-[10px] text-slate-500 font-semibold uppercase">{item.energyType}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-slate-100">{item.energyAmount} <span className="text-sm text-slate-500 font-normal">kWh</span></h3>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{item.highestBid > 0 ? "Current Bid" : "Starting Bid"}</span>
                                                    <h3 className="text-xl font-bold text-accent-violet">₹{item.highestBid > 0 ? item.highestBid : item.pricePerKwh}</h3>
                                                </div>
                                            </div>
                                            <div className="bg-midnight-100 rounded-xl p-3 flex items-center justify-between mb-4 border border-glass-light">
                                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Timer size={12} /> Time Left</span>
                                                <motion.span animate={auctionTimers[item._id] !== "EXPIRED" ? { opacity: [1, 0.6, 1] } : {}} transition={{ duration: 1, repeat: Infinity }} className={`font-mono font-bold text-sm ${auctionTimers[item._id] === "EXPIRED" ? "text-red-400" : "text-accent-violet"}`}>
                                                    {auctionTimers[item._id] || "Loading..."}
                                                </motion.span>
                                            </div>
                                            <div className="border-t border-glass-light pt-4 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-md bg-accent-violet/10 flex items-center justify-center text-[10px] font-bold text-accent-violet">{item.sellerAddress?.charAt(0).toUpperCase() || "U"}</div>
                                                    <div><p className="text-[10px] text-slate-600">Seller</p><p className="font-semibold text-slate-400 text-xs truncate w-20">{item.sellerAddress}</p></div>
                                                </div>
                                                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} onClick={() => handleBidClick(item)} disabled={auctionTimers[item._id] === "EXPIRED"} className={`px-5 py-2 font-bold text-sm rounded-lg transition-all flex items-center gap-1.5 ripple-btn btn-press ${auctionTimers[item._id] === "EXPIRED" ? "bg-midnight-300 text-slate-600 cursor-not-allowed" : "bg-accent-violet hover:bg-accent-violet/80 text-white shadow-glow-violet"}`}>
                                                    <Gavel size={14} /> {auctionTimers[item._id] === "EXPIRED" ? "Ended" : "Place Bid"}
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default MarketPage;