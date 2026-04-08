import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import axios from "axios";
import toast from "react-hot-toast";
import { User, Mail, Phone, MapPin, Edit3, Save, X, ShieldCheck } from "lucide-react";

const ProfilePage = () => {
    const { user, updateUser } = useContext(UserContext);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const parseAddress = (addr) => {
        if (addr && typeof addr === "object") return { streetAddress: addr.streetAddress || "", city: addr.city || "", state: addr.state || "", country: addr.country || "" };
        return { streetAddress: addr || "", city: "", state: "", country: "" };
    };

    const [formData, setFormData] = useState({ name: user?.name || "", email: user?.email || "", phoneNumber: user?.phoneNumber || "", address: parseAddress(user?.address) });

    const handleUpdateProfile = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await axios.put("http://localhost:5000/api/auth/profile", { id: user._id, name: formData.name, email: formData.email, address: formData.address, token: user.token });
            updateUser(res.data); setIsEditing(false); toast.success("Profile Updated Successfully!");
        } catch (error) { toast.error(error.response?.data?.message || "Update Failed"); }
        setLoading(false);
    };

    if (!user) return <div className="min-h-screen bg-midnight flex items-center justify-center text-slate-500">Please Login</div>;
    const isAddressComplete = formData.address.city && formData.address.country;

    return (
        <PageTransition>
            <div className="min-h-screen bg-midnight flex items-center justify-center relative overflow-hidden px-4 py-12">
                <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-primary/5 rounded-full blur-[150px]" />
                <motion.div animate={{ x: [0, -40, 30, 0], y: [0, 30, -50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent-cyan/5 rounded-full blur-[120px]" />

                <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="relative z-10 w-full max-w-lg">
                    <div className="bg-surface border border-glass-light rounded-2xl overflow-hidden shadow-card">
                        {/* Avatar */}
                        <div className="pt-12 pb-6 flex flex-col items-center relative">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.2 }} className="relative group">
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-primary to-emerald-glow rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500" />
                                <motion.div whileHover={{ scale: 1.05 }} className="relative w-24 h-24 bg-midnight-200 rounded-full flex items-center justify-center text-3xl font-bold text-emerald-glow shadow-glow ring-4 ring-surface">
                                    {user.name.charAt(0).toUpperCase()}
                                </motion.div>
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="absolute -bottom-1 -right-1 bg-emerald-primary text-midnight text-[9px] font-bold px-2.5 py-0.5 rounded-full border-2 border-surface uppercase tracking-wide">
                                    {user.role}
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Form */}
                        <div className="px-8 pb-8">
                            <h2 className="text-xl font-bold text-slate-100 text-center mb-6">Digital Identity</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-5">
                                {[
                                    { name: "name", icon: User, label: "Full Name", value: formData.name, editable: true, onChange: (v) => setFormData({ ...formData, name: v }) },
                                    { name: "email", icon: Mail, label: "Email", value: formData.email, editable: true, onChange: (v) => setFormData({ ...formData, email: v }) },
                                ].map((field, i) => (
                                    <motion.div key={field.name} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                                        <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest flex items-center gap-1.5 mb-1.5"><field.icon size={10} /> {field.label}</label>
                                        <input type={field.name === "email" ? "email" : "text"} disabled={!isEditing} value={field.value} onChange={(e) => field.onChange(e.target.value)} className={`w-full bg-transparent border-b-2 py-2 px-1 text-base font-semibold focus:outline-none transition-all ${isEditing ? 'border-emerald-primary/50 text-slate-100' : 'border-glass-light text-slate-300 text-center'}`} />
                                    </motion.div>
                                ))}

                                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                                    <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest flex items-center gap-1.5 mb-1.5"><Phone size={10} /> Phone Number</label>
                                    <input type="tel" disabled value={formData.phoneNumber || "Not provided"} className="w-full bg-transparent border-b-2 border-glass-light py-2 px-1 text-base font-semibold text-slate-500 focus:outline-none text-center cursor-not-allowed" />
                                    <p className="text-[9px] text-slate-600 mt-1 text-center">Phone number is set during registration</p>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
                                    <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest flex items-center gap-1.5"><MapPin size={10} /> Address</label>
                                    {[
                                        { key: "streetAddress", placeholder: "Street Address", value: formData.address.streetAddress, full: true },
                                    ].map(f => (
                                        <input key={f.key} type="text" disabled={!isEditing} value={isEditing ? f.value : (f.value || "Not provided")} placeholder={isEditing ? f.placeholder : ""} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, [f.key]: e.target.value } })} className={`w-full bg-transparent border-b-2 py-2 px-1 text-sm font-semibold focus:outline-none transition-all ${isEditing ? 'border-emerald-primary/50 text-slate-100 placeholder-slate-600' : `border-glass-light text-center ${f.value ? 'text-slate-300' : 'text-slate-600 italic'}`}`} />
                                    ))}
                                    <div className="flex gap-3">
                                        {[{ key: "city", placeholder: "City *" }, { key: "state", placeholder: "State" }].map(f => (
                                            <input key={f.key} type="text" disabled={!isEditing} value={isEditing ? formData.address[f.key] : (formData.address[f.key] || "—")} placeholder={isEditing ? f.placeholder : ""} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, [f.key]: e.target.value } })} className={`flex-1 bg-transparent border-b-2 py-2 px-1 text-sm font-semibold focus:outline-none transition-all ${isEditing ? 'border-emerald-primary/50 text-slate-100 placeholder-slate-600' : `border-glass-light text-center ${formData.address[f.key] ? 'text-slate-300' : 'text-slate-600 italic'}`}`} />
                                        ))}
                                    </div>
                                    <input type="text" disabled={!isEditing} value={isEditing ? formData.address.country : (formData.address.country || "—")} placeholder={isEditing ? "Country *" : ""} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} className={`w-full bg-transparent border-b-2 py-2 px-1 text-sm font-semibold focus:outline-none transition-all ${isEditing ? 'border-emerald-primary/50 text-slate-100 placeholder-slate-600' : `border-glass-light text-center ${formData.address.country ? 'text-slate-300' : 'text-slate-600 italic'}`}`} />
                                    <AnimatePresence>
                                        {isEditing && !isAddressComplete && (
                                            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[10px] text-accent-amber font-medium pl-1 flex items-center gap-1">⚠️ City and Country are required for marketplace access</motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Buttons */}
                                <div className="pt-4">
                                    <AnimatePresence mode="wait">
                                        {isEditing ? (
                                            <motion.div key="editing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-3">
                                                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setIsEditing(false); setFormData({ name: user.name, email: user.email, phoneNumber: user.phoneNumber || "", address: parseAddress(user.address) }); }} className="flex-1 py-3 bg-midnight-200 hover:bg-midnight-300 text-slate-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 btn-press">
                                                    <X size={14} /> Cancel
                                                </motion.button>
                                                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} className="flex-1 py-3 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl shadow-glow transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ripple-btn btn-press">
                                                    {loading ? <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
                                                </motion.button>
                                            </motion.div>
                                        ) : (
                                            <motion.button key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} type="button" onClick={() => setIsEditing(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full py-3 bg-midnight-200 hover:bg-midnight-300 border border-glass-light text-slate-300 hover:text-emerald-glow font-semibold rounded-xl transition-all flex items-center justify-center gap-2 btn-press">
                                                <Edit3 size={14} /> Edit Profile
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </form>

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 text-center flex items-center justify-center gap-1.5">
                                <ShieldCheck size={12} className="text-emerald-primary/40" />
                                <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em]">GreenTrade Verified ID</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
};

export default ProfilePage;