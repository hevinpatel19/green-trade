import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import ScrollReveal, { StaggerContainer, StaggerItem } from "../components/ScrollReveal";
import AnimatedCounter from "../components/AnimatedCounter";
import { Zap, Brain, Shield, ArrowRight, TrendingUp, Users, Activity } from "lucide-react";
import { API_URL } from "../utils/api";

const HomePage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalVolume: 0, avgPrice: 0, activeListings: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/market/stats`);
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const handleGetStarted = () => {
    if (user) navigate("/market");
    else navigate("/register");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-midnight animated-gradient-bg">

        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />

          {/* Floating Particles */}
          <div className="particle particle-1" style={{ top: '10%', left: '15%' }} />
          <div className="particle particle-2" style={{ top: '60%', right: '10%' }} />
          <div className="particle particle-3" style={{ bottom: '20%', left: '40%' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 md:pt-32 md:pb-28">
            <div className="text-center max-w-4xl mx-auto relative">

              {/* ── Pulsing Glow Orb ── */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0" aria-hidden="true">
                {/* Outer bloom — vibrant emerald */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.25, 0.5, 0.25] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-[360px] h-[360px] md:w-[520px] md:h-[520px] rounded-full blur-[120px] md:blur-[160px]"
                  style={{ background: "radial-gradient(circle, #10b981 0%, #059669 40%, transparent 70%)" }}
                />
                {/* Core glow — bright green */}
                <motion.div
                  animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.45, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  className="absolute w-[220px] h-[220px] md:w-[320px] md:h-[320px] rounded-full blur-[90px] md:blur-[120px]"
                  style={{ background: "radial-gradient(circle, #34d399 0%, #10b981 50%, transparent 75%)" }}
                />
                {/* Teal accent ring */}
                <motion.div
                  animate={{ scale: [0.95, 1.25, 0.95], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                  className="absolute w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-full blur-[100px] md:blur-[140px]"
                  style={{ background: "radial-gradient(circle, #14b8a6 0%, #0d9488 50%, transparent 75%)" }}
                />
              </div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-primary/10 border border-emerald-primary/20 mb-8"
              >
                <span className="live-dot" />
                <span className="text-emerald-glow text-xs font-semibold uppercase tracking-wider">Live Energy Trading Platform</span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6"
              >
                The Future of{" "}
                <span className="text-shimmer">Peer-to-Peer</span>
                <br />Energy Trading
              </motion.h1>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                Trade solar & wind energy directly with your neighbors. AI-driven pricing.
                Instant settlements. Zero middlemen.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <motion.button
                  onClick={handleGetStarted}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold text-base rounded-xl transition-colors shadow-glow hover:shadow-glow-lg flex items-center justify-center gap-2 ripple-btn"
                >
                  Start Trading Now
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                    <ArrowRight size={18} />
                  </motion.span>
                </motion.button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/market"
                    className="px-8 py-4 bg-surface-light hover:bg-midnight-300 text-slate-200 font-semibold text-base rounded-xl border border-glass-light transition-colors flex items-center justify-center gap-2"
                  >
                    View Live Market
                    <Activity size={18} />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* ── LIVE STATS BAR ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="relative border-t border-glass-light bg-midnight-50/50 backdrop-blur-md"
          >
            <div className="max-w-7xl mx-auto grid grid-cols-3 divide-x divide-glass-light text-center">
              <div className="py-6 px-4">
                <p className="text-slate-500 text-[10px] uppercase tracking-[0.15em] font-semibold mb-1">Total Volume</p>
                <p className="text-2xl md:text-3xl font-mono font-bold text-slate-100">
                  <AnimatedCounter target={stats.totalVolume} duration={2} className="text-2xl md:text-3xl font-mono font-bold text-slate-100" />
                  <span className="text-sm text-slate-500 ml-1">kWh</span>
                </p>
              </div>
              <div className="py-6 px-4">
                <p className="text-slate-500 text-[10px] uppercase tracking-[0.15em] font-semibold mb-1">Market Rate</p>
                <p className="text-2xl md:text-3xl font-mono font-bold text-emerald-glow">
                  <AnimatedCounter target={stats.avgPrice} prefix="₹" duration={1.8} className="text-2xl md:text-3xl font-mono font-bold text-emerald-glow" />
                  <span className="text-sm text-slate-500 ml-1">/unit</span>
                </p>
              </div>
              <div className="py-6 px-4">
                <p className="text-slate-500 text-[10px] uppercase tracking-[0.15em] font-semibold mb-1">Active Listings</p>
                <p className="text-2xl md:text-3xl font-mono font-bold text-accent-cyan">
                  <AnimatedCounter target={stats.activeListings} duration={1.5} className="text-2xl md:text-3xl font-mono font-bold text-accent-cyan" />
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3">Why GreenTrade?</h2>
              <p className="text-slate-500 text-lg">A completely decentralized energy ecosystem.</p>
            </ScrollReveal>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.15}>
              {[
                {
                  icon: Brain, color: "emerald",
                  title: "AI Price Forecasting",
                  desc: "Our Neural Network analyzes weather patterns to predict energy spikes, ensuring you buy low and sell high.",
                },
                {
                  icon: Zap, color: "cyan",
                  title: "Instant P2P Trading",
                  desc: "Bypass the main grid. Trade surplus solar energy directly with other users in your local cluster.",
                },
                {
                  icon: Shield, color: "violet",
                  title: "Secure & Transparent",
                  desc: "Every transaction is verified. Sellers get paid instantly, and buyers get certified green energy.",
                },
              ].map((feature) => (
                <StaggerItem key={feature.title}>
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`group bg-surface border border-glass-light rounded-2xl p-8 card-hover border-glow-animate`}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color === 'emerald' ? 'bg-emerald-primary/10' :
                          feature.color === 'cyan' ? 'bg-accent-cyan/10' : 'bg-accent-violet/10'
                        }`}
                    >
                      <feature.icon size={22} className={
                        feature.color === 'emerald' ? 'text-emerald-primary' :
                          feature.color === 'cyan' ? 'text-accent-cyan' : 'text-accent-violet'
                      } />
                    </motion.div>
                    <h3 className="text-lg font-bold text-slate-100 mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24 border-t border-glass-light relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-16">How It Works</h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Animated connecting line */}
              <ScrollReveal direction="none" className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  className="h-full bg-gradient-to-r from-emerald-primary/0 via-emerald-primary/30 to-emerald-primary/0 origin-left"
                />
              </ScrollReveal>

              {[
                { step: "01", icon: Users, title: "Connect", desc: "Register your account and set up your energy profile with your location." },
                { step: "02", icon: TrendingUp, title: "List Energy", desc: "Have excess solar? List it on the market. Our AI suggests the best price." },
                { step: "03", icon: Zap, title: "Earn & Save", desc: "Get paid instantly for selling, or save money by buying cheaper green energy." },
              ].map((item, i) => (
                <ScrollReveal key={item.step} delay={i * 0.2} className="relative">
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="w-24 h-24 bg-surface border border-glass-light rounded-2xl flex items-center justify-center mb-6 relative card-hover"
                    >
                      <item.icon size={32} className="text-emerald-primary" />
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.2, type: "spring", stiffness: 400 }}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-primary text-midnight text-xs font-bold rounded-lg flex items-center justify-center"
                      >
                        {item.step}
                      </motion.span>
                    </motion.div>
                    <h3 className="text-lg font-bold text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-slate-500 text-sm max-w-xs">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <ScrollReveal>
          <footer className="border-t border-glass-light bg-midnight-50 py-10">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-primary to-emerald-glow rounded-md flex items-center justify-center">
                  <Zap size={14} className="text-midnight" />
                </div>
                <span className="font-bold text-slate-200">Green<span className="text-emerald-primary">Trade</span></span>
              </motion.div>
              <div className="flex gap-8 text-sm">
                <Link to="/market" className="text-slate-500 hover:text-emerald-primary transition-colors">Market</Link>
                <Link to="/register" className="text-slate-500 hover:text-emerald-primary transition-colors">Register</Link>
                <Link to="/login" className="text-slate-500 hover:text-emerald-primary transition-colors">Login</Link>
              </div>
              <p className="text-xs text-slate-600">© 2026 GreenTrade. All rights reserved.</p>
            </div>
          </footer>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
};

export default HomePage;