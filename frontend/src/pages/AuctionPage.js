import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import ContactSellerButton from "../components/ContactSellerButton";
import { ArrowLeft, Timer, Gavel, Crown, Trophy, CreditCard, TrendingUp } from "lucide-react";

const AuctionPage = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { item } = location.state || {};
    const [listing, setListing] = useState(item);
    const [bidAmount, setBidAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [fetchingLatest, setFetchingLatest] = useState(true);

    useEffect(() => {
        if (!item) { navigate("/market"); return; }
        const fetchLatestListing = async () => {
            try { const res = await axios.get(`http://localhost:5000/api/market/auctions`); const latestItem = res.data.find(l => l._id === item._id); if (latestItem) setListing(latestItem); } catch (err) { console.error(err); }
            setFetchingLatest(false);
        };
        fetchLatestListing();
    }, [item, navigate]);

    useEffect(() => {
        if (!listing) return;
        const timer = setInterval(() => {
            const diff = new Date(listing.auctionEndsAt) - new Date();
            if (diff <= 0) { setTimeLeft("EXPIRED"); clearInterval(timer); }
            else { const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); const s = Math.floor((diff % 60000) / 1000); setTimeLeft(`${h}h ${m}m ${s}s`); }
        }, 1000);
        return () => clearInterval(timer);
    }, [listing]);

    const handlePlaceBid = async (e) => {
        e.preventDefault(); setLoading(true);
        const currentHighest = listing.highestBid > 0 ? listing.highestBid : listing.pricePerKwh;
        if (Number(bidAmount) <= currentHighest) { toast.error(`Bid must be higher than ₹${currentHighest}`); setLoading(false); return; }
        try {
            const res = await axios.post(`http://localhost:5000/api/market/bid/${listing._id}`, { bidderEmail: user.email, bidAmount: Number(bidAmount) });
            if (res.data.success) { toast.success("Bid Placed Successfully!"); setListing({ ...listing, highestBid: res.data.newHighest, bids: [...(listing.bids || []), { bidderEmail: user.email, amount: Number(bidAmount), timestamp: new Date().toISOString() }] }); setBidAmount(""); }
        } catch (err) { toast.error(err.response?.data?.message || "Bidding Failed"); }
        setLoading(false);
    };

    const getHighestBidder = () => { if (!listing?.bids?.length) return null; return [...listing.bids].sort((a, b) => b.amount - a.amount)[0]?.bidderEmail; };
    const getSortedBids = () => { if (!listing?.bids?.length) return []; return [...listing.bids].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); };
    const formatBidTime = (ts) => !ts ? "N/A" : new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const maskEmail = (email) => { if (!email) return "Anonymous"; const [local, domain] = email.split('@'); return `${local.substring(0, 2)}***@${domain}`; };
    const isCurrentUserWinner = timeLeft === "EXPIRED" && listing?.highestBid > 0 && getHighestBidder() === user?.email;

    if (!listing) return null;

    return (
        <PageTransition>
            <div className="min-h-screen bg-midnight py-10 px-4 flex justify-center">
                <div className="max-w-4xl w-full">
                    <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate("/market")} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 font-semibold text-sm mb-6 transition-colors">
                        <ArrowLeft size={16} /> Back to Market
                    </motion.button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT */}
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="bg-surface border border-accent-violet/15 rounded-2xl p-8 relative overflow-hidden">
                            <motion.div initial={{ x: 50 }} animate={{ x: 0 }} transition={{ delay: 0.3, type: "spring" }} className="absolute top-0 right-0 bg-accent-violet text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">Live Auction</motion.div>
                            <h1 className="text-4xl font-black text-slate-100 mb-2 mt-4">{listing.energyAmount} kWh</h1>
                            <p className="text-slate-500 mb-8 text-sm">Listed by {listing.sellerAddress}</p>
                            <div className="mb-8">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Current Highest Bid</p>
                                <motion.p key={listing.highestBid} initial={{ scale: 1.2, color: "#a78bfa" }} animate={{ scale: 1, color: "#8b5cf6" }} transition={{ duration: 0.3 }} className="text-5xl font-black text-accent-violet">₹{listing.highestBid || listing.pricePerKwh}</motion.p>
                            </div>
                            <div className="bg-midnight-100 rounded-xl p-4 flex items-center justify-between border border-glass-light">
                                <span className="font-semibold text-slate-400 flex items-center gap-2"><Timer size={16} /> Time Remaining</span>
                                <motion.span animate={timeLeft !== "EXPIRED" ? { opacity: [1, 0.5, 1] } : {}} transition={{ duration: 1, repeat: Infinity }} className={`font-mono font-bold text-xl ${timeLeft === "EXPIRED" ? "text-red-400" : "text-accent-amber"}`}>{timeLeft}</motion.span>
                            </div>
                        </motion.div>

                        {/* RIGHT */}
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="bg-surface border border-glass-light rounded-2xl p-8 h-fit">
                            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2"><Gavel size={20} className="text-accent-violet" /> Place Your Bid</h2>
                            <AnimatePresence mode="wait">
                                {timeLeft === "EXPIRED" ? (
                                    <motion.div key="expired" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                                        <p className="font-bold text-lg text-slate-500">Auction Ended</p>
                                        {isCurrentUserWinner ? (
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 p-5 bg-emerald-primary/10 border border-emerald-primary/20 rounded-xl">
                                                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, delay: 0.5 }}><Trophy size={32} className="text-emerald-primary mx-auto mb-3" /></motion.div>
                                                <p className="text-emerald-glow font-bold mb-1">Congratulations! You won!</p>
                                                <p className="text-sm text-slate-400 mb-4">Winning: ₹{listing.highestBid} for {listing.energyAmount} kWh</p>
                                                <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/checkout", { state: { item: { ...listing, winningTotalAmount: listing.highestBid, isAuction: true, winnerEmail: user.email } } })} className="w-full py-3 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl transition-colors shadow-glow flex items-center justify-center gap-2 ripple-btn btn-press">
                                                    <CreditCard size={16} /> Pay ₹{listing.highestBid} Now
                                                </motion.button>
                                            </motion.div>
                                        ) : listing?.highestBid > 0 ? (
                                            <div className="mt-4 p-4 bg-midnight-100 border border-glass-light rounded-xl"><p className="text-slate-400 font-semibold">Winner: {getHighestBidder()}</p></div>
                                        ) : <p className="text-slate-600 mt-4">No bids were placed.</p>}
                                    </motion.div>
                                ) : (
                                    <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handlePlaceBid} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Offer (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                                <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-100 font-bold text-lg focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/30 input-glow transition-all" placeholder={`Min ${listing.highestBid > 0 ? listing.highestBid + 1 : listing.pricePerKwh + 1}`} />
                                            </div>
                                            <p className="text-xs text-slate-600 mt-2">Must be higher than ₹{listing.highestBid > 0 ? listing.highestBid : listing.pricePerKwh}</p>
                                        </div>
                                        <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} className="w-full py-4 bg-accent-violet hover:bg-accent-violet/80 text-white font-bold rounded-xl transition-colors shadow-glow-violet disabled:opacity-50 flex items-center justify-center gap-2 ripple-btn btn-press">
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Gavel size={16} /> Submit Bid</>}
                                        </motion.button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* BID HISTORY */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 bg-surface border border-glass-light rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-accent-violet" /> Bid History</h3>
                        {getSortedBids().length === 0 ? (
                            <p className="text-slate-600 text-center py-4">No bids placed yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                <AnimatePresence>
                                    {getSortedBids().map((bid, index) => (
                                        <motion.div key={`${bid.bidderEmail}-${bid.amount}-${index}`} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${index === 0 ? 'bg-accent-violet/5 border-accent-violet/20' : 'bg-midnight-100 border-glass-light'}`}>
                                            <div className="flex items-center gap-3">
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + index * 0.05, type: "spring" }} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-accent-violet text-white' : 'bg-midnight-300 text-slate-500'}`}>
                                                    {index === 0 ? <Crown size={14} /> : index + 1}
                                                </motion.div>
                                                <div>
                                                    <p className="font-semibold text-slate-200 text-sm">{bid.bidderEmail === user?.email ? 'You' : maskEmail(bid.bidderEmail)}</p>
                                                    <p className="text-xs text-slate-600">{formatBidTime(bid.timestamp)}</p>
                                                </div>
                                            </div>
                                            <p className={`font-bold text-lg ${index === 0 ? 'text-accent-violet' : 'text-slate-400'}`}>₹{bid.amount}</p>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </div>
                <ContactSellerButton sellerEmail={listing?.sellerAddress} />
            </div>
        </PageTransition>
    );
};

export default AuctionPage;