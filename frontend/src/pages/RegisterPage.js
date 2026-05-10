import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";
import { User, Mail, Phone, Lock, ArrowRight, Zap } from "lucide-react";
import { API_URL } from "../utils/api";

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phoneNumber: "" });
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "phoneNumber") setPhoneError("");
  };

  const validatePhone = (phone) => {
    if (!phone) return "Phone number is required";
    if (!/^[0-9]+$/.test(phone)) return "Phone number must contain only digits";
    if (phone.length < 10 || phone.length > 15) return "Phone number must be 10-15 digits";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneValidationError = validatePhone(formData.phoneNumber);
    if (phoneValidationError) { setPhoneError(phoneValidationError); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, formData);
      toast.success("Registration Successful! Please Login.");
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration Failed");
    }
    setLoading(false);
  };

  const fields = [
    { name: "name", type: "text", label: "Full Name", placeholder: "John Doe", icon: User, required: true },
    { name: "email", type: "email", label: "Email Address", placeholder: "you@example.com", icon: Mail, required: true },
    { name: "phoneNumber", type: "tel", label: "Phone Number", placeholder: "10-15 digit number", icon: Phone, required: true, error: phoneError },
    { name: "password", type: "password", label: "Password", placeholder: "••••••••", icon: Lock, required: true },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4 relative overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-20 w-[400px] h-[400px] bg-emerald-primary/5 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ x: [0, -40, 30, 0], y: [0, 30, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-20 w-[350px] h-[350px] bg-accent-cyan/5 rounded-full blur-[120px]"
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 w-full max-w-md py-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, type: "spring", stiffness: 300 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="w-10 h-10 bg-gradient-to-br from-emerald-primary to-emerald-glow rounded-xl flex items-center justify-center shadow-glow">
                <Zap size={20} className="text-midnight" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Create Account</h1>
            <p className="text-slate-500 text-sm">Join the future of energy trading</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-surface border border-glass-light rounded-2xl p-8 shadow-card"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {fields.map((field, i) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
                >
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{field.label}</label>
                  <div className="relative">
                    <field.icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      className={`w-full pl-11 pr-4 py-3 bg-midnight-100 border rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none input-glow transition-all ${field.error ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30" : "border-glass-light focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30"
                        }`}
                    />
                  </div>
                  {field.error && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs mt-1.5 pl-1">
                      {field.error}
                    </motion.p>
                  )}
                </motion.div>
              ))}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="w-full py-3.5 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl transition-colors shadow-glow hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ripple-btn btn-press"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </motion.button>
            </form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="text-emerald-primary hover:text-emerald-glow font-semibold transition-colors">Sign In</Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default RegisterPage;