import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import ScrollReveal, { StaggerContainer, StaggerItem } from "../components/ScrollReveal";
import AnimatedCounter from "../components/AnimatedCounter";
import { Zap, Wind, TrendingUp, ShoppingCart, BarChart3, DollarSign } from "lucide-react";

const OrderPage = () => {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEnergy: 0, totalSpent: 0, saved: 0 });
  const GOVT_GRID_RATE = 15.0;

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/myorders/${encodeURIComponent(user.email)}`);
      setOrders(res.data); calculateAIStats(res.data); setLoading(false);
    } catch (error) { console.error(error); setLoading(false); }
  };

  const calculateAIStats = (data) => {
    let energy = 0, spent = 0;
    data.forEach(item => { energy += parseFloat(item.energyAmount); spent += parseFloat(item.totalAmount || (item.energyAmount * item.pricePerKwh)); });
    setStats({ totalEnergy: energy.toFixed(1), totalSpent: spent.toFixed(0), saved: (energy * GOVT_GRID_RATE - spent).toFixed(0) });
  };

  if (!user) return <div className="min-h-screen bg-midnight flex items-center justify-center text-slate-500">Please Login to view orders.</div>;

  return (
    <PageTransition>
      <div className="min-h-screen bg-midnight py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}><BarChart3 size={28} className="text-emerald-primary" /></motion.div>
                My Portfolio
              </h2>
              <p className="text-slate-500 mt-1">Track your P2P energy acquisitions and savings.</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/market" className="text-emerald-primary hover:text-emerald-glow font-semibold text-sm transition-colors flex items-center gap-1.5">
                <ShoppingCart size={14} /> Buy More Energy
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -4, scale: 1.01 }} className="bg-gradient-to-br from-accent-cyan/10 to-surface border border-accent-cyan/15 p-6 rounded-2xl relative overflow-hidden card-hover">
              <div className="absolute top-3 right-3 opacity-10"><Zap size={48} /></div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Energy Acquired</p>
              <h3 className="text-3xl font-bold text-slate-100">
                <AnimatedCounter target={stats.totalEnergy} decimals={1} className="text-3xl font-bold text-slate-100" />
                <span className="text-sm text-slate-500 ml-1">kWh</span>
              </h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -4, scale: 1.01 }} className="bg-surface border border-glass-light p-6 rounded-2xl card-hover">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Investment</p>
              <h3 className="text-3xl font-bold text-slate-100">
                <AnimatedCounter target={stats.totalSpent} prefix="₹" className="text-3xl font-bold text-slate-100" />
              </h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} whileHover={{ y: -4, scale: 1.01 }} className={`p-6 rounded-2xl border card-hover ${stats.saved >= 0 ? "bg-emerald-primary/5 border-emerald-primary/15" : "bg-red-500/5 border-red-500/15"}`}>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><TrendingUp size={12} /> AI Value Analysis</p>
              <h3 className={`text-3xl font-bold ${stats.saved >= 0 ? "text-emerald-glow" : "text-red-400"}`}>
                <AnimatedCounter target={Math.abs(stats.saved)} prefix={stats.saved >= 0 ? "+₹" : "-₹"} className={`text-3xl font-bold ${stats.saved >= 0 ? "text-emerald-glow" : "text-red-400"}`} />
              </h3>
            </motion.div>
          </div>

          {/* Transaction History */}
          <ScrollReveal><h3 className="text-lg font-bold text-slate-200 mb-4">Transaction History</h3></ScrollReveal>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Syncing records...</p>
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-surface rounded-2xl border border-dashed border-glass-light">
              <DollarSign size={40} className="text-slate-700 mx-auto mb-4" />
              <p className="text-lg text-slate-500 font-medium">No transactions found for <b className="text-slate-400">{user.email}</b></p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/market" className="mt-4 inline-flex items-center gap-2 bg-emerald-primary hover:bg-emerald-glow text-midnight px-6 py-2.5 rounded-xl font-bold transition-colors shadow-glow ripple-btn btn-press"><ShoppingCart size={14} /> Go to Market</Link>
              </motion.div>
            </motion.div>
          ) : (
            <StaggerContainer className="space-y-3" staggerDelay={0.06}>
              {orders.map((order) => (
                <StaggerItem key={order._id}>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="bg-surface border border-glass-light rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 card-hover">
                    <div className="flex items-center gap-4">
                      <motion.div whileHover={{ rotate: 15 }} className={`p-2.5 rounded-xl ${order.energyType === 'Wind' ? 'bg-accent-cyan/10' : 'bg-accent-amber/10'}`}>
                        {order.energyType === 'Wind' ? <Wind size={20} className="text-accent-cyan" /> : <Zap size={20} className="text-accent-amber" />}
                      </motion.div>
                      <div>
                        <h4 className="font-bold text-slate-200 flex items-center gap-2">
                          {order.energyAmount} kWh Bundle
                          <span className="text-[10px] bg-midnight-200 text-slate-500 px-2 py-0.5 rounded border border-glass-light">{order.energyType || "Solar"}</span>
                        </h4>
                        <p className="text-xs text-slate-600 font-mono mt-0.5">ID: {order._id}</p>
                        <p className="text-xs text-slate-500">Seller: {order.sellerAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-semibold">Total Paid</p><p className="font-bold text-lg text-slate-100">₹{(order.totalAmount || (order.pricePerKwh * order.energyAmount)).toFixed(2)}</p></div>
                      <span className="px-3 py-1 bg-emerald-primary/10 text-emerald-glow text-xs rounded-lg font-bold border border-emerald-primary/20">✓ PAID</span>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default OrderPage;