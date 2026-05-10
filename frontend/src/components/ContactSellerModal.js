import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, X, User, Loader2 } from "lucide-react";
import { API_URL } from "../utils/api";

const ContactSellerModal = ({ isOpen, onClose, sellerEmail }) => {
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { if (isOpen && sellerEmail) fetchSellerInfo(); }, [isOpen, sellerEmail]);

    const fetchSellerInfo = async () => {
        setLoading(true); setError(null);
        try { const res = await axios.get(`${API_URL}/api/users/seller/${encodeURIComponent(sellerEmail)}`); setSeller(res.data); }
        catch (err) { console.error(err); setError("Unable to load seller contact info"); }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="bg-surface border border-glass-light rounded-2xl shadow-card max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-deep to-emerald-primary px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><User size={20} /> Seller Contact</h3>
                            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="text-white/70 hover:text-white transition p-1 hover:bg-white/10 rounded-lg" aria-label="Close modal"><X size={20} /></motion.button>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="animate-spin text-emerald-primary mb-3" size={32} />
                                    <p className="text-slate-500">Loading seller info...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <p className="text-red-400 font-medium">{error}</p>
                                    <button onClick={fetchSellerInfo} className="mt-3 text-emerald-primary hover:text-emerald-glow text-sm font-medium transition-colors">Try Again</button>
                                </div>
                            ) : seller ? (
                                <div className="space-y-4">
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center pb-4 border-b border-glass-light">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.15 }} className="w-16 h-16 bg-emerald-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <span className="text-2xl font-bold text-emerald-primary">{seller.name?.charAt(0).toUpperCase() || "S"}</span>
                                        </motion.div>
                                        <h4 className="text-xl font-bold text-slate-100">{seller.name}</h4>
                                        <p className="text-sm text-slate-500">Energy Seller</p>
                                    </motion.div>

                                    <div className="space-y-3">
                                        <motion.a initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} href={`mailto:${seller.email}`} className="flex items-center gap-4 p-4 bg-surface-light rounded-xl hover:bg-midnight-300 transition group">
                                            <div className="w-10 h-10 bg-emerald-primary/10 rounded-lg flex items-center justify-center"><Mail className="text-emerald-primary" size={18} /></div>
                                            <div className="flex-1 min-w-0"><p className="text-xs text-slate-500 uppercase font-bold">Email</p><p className="text-slate-200 font-medium truncate group-hover:text-emerald-glow transition">{seller.email}</p></div>
                                        </motion.a>
                                        {seller.phoneNumber ? (
                                            <motion.a initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} href={`tel:${seller.phoneNumber}`} className="flex items-center gap-4 p-4 bg-surface-light rounded-xl hover:bg-midnight-300 transition group">
                                                <div className="w-10 h-10 bg-emerald-primary/10 rounded-lg flex items-center justify-center"><Phone className="text-emerald-primary" size={18} /></div>
                                                <div className="flex-1 min-w-0"><p className="text-xs text-slate-500 uppercase font-bold">Phone</p><p className="text-slate-200 font-medium group-hover:text-emerald-glow transition">{seller.phoneNumber}</p></div>
                                            </motion.a>
                                        ) : (
                                            <div className="flex items-center gap-4 p-4 bg-surface-light rounded-xl opacity-50">
                                                <div className="w-10 h-10 bg-midnight-200 rounded-lg flex items-center justify-center"><Phone className="text-slate-500" size={18} /></div>
                                                <div className="flex-1"><p className="text-xs text-slate-500 uppercase font-bold">Phone</p><p className="text-slate-500 font-medium italic">Not provided</p></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className="bg-midnight-100 px-6 py-3 text-center border-t border-glass-light"><p className="text-xs text-slate-600">Contact seller for questions about energy listings</p></div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContactSellerModal;
