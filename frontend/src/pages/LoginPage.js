import React, { useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import { Mail, Lock, ArrowRight, Zap } from "lucide-react";

const LoginPage = () => {
  const { login } = useContext(UserContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);
      toast.success(`Welcome back, ${res.data.name}!`);
      login(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Invalid Email or Password");
    }
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background orbs */}
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-[400px] h-[400px] bg-emerald-primary/5 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ x: [0, -40, 30, 0], y: [0, 30, -50, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-[350px] h-[350px] bg-accent-violet/5 rounded-full blur-[120px]"
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, type: "spring", stiffness: 300 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="w-10 h-10 bg-gradient-to-br from-emerald-primary to-emerald-glow rounded-xl flex items-center justify-center shadow-glow"
              >
                <Zap size={20} className="text-midnight" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to your GreenTrade account</p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-surface border border-glass-light rounded-2xl p-8 shadow-card"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { name: "email", type: "email", label: "Email", icon: Mail, placeholder: "you@example.com" },
                { name: "password", type: "password", label: "Password", icon: Lock, placeholder: "••••••••" },
              ].map((field, i) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                >
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{field.label}</label>
                  <div className="relative">
                    <field.icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={field.placeholder}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 input-glow transition-all"
                    />
                  </div>
                </motion.div>
              ))}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="w-full py-3.5 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl transition-colors shadow-glow hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ripple-btn btn-press"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-slate-500">
                New here?{" "}
                <Link to="/register" className="text-emerald-primary hover:text-emerald-glow font-semibold transition-colors">
                  Create Account
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default LoginPage;