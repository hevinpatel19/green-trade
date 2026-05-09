import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UserContext from "../context/UserContext";
import WalletContext from "../context/WalletContext";
import { Menu, X, LogOut, ChevronDown, Shield, LayoutDashboard, ShoppingCart, BarChart3, User, Wallet } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useContext(UserContext);
  const { balance } = useContext(WalletContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); setProfileOpen(false); setMobileOpen(false); };
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", public: true },
    { path: "/market", label: "Market", public: true },
    { path: "/dashboard", label: "Dashboard", auth: true, icon: LayoutDashboard },
    { path: "/orders", label: "Orders", auth: true, icon: ShoppingCart },
  ];
  const visibleLinks = navLinks.filter((link) => link.public || (link.auth && user));

  return (
    <nav className="sticky top-0 z-50 bg-midnight-50/80 backdrop-blur-xl border-b border-glass-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center relative">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0" onClick={() => setMobileOpen(false)}>
            <motion.div whileHover={{ rotate: 15, scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-9 h-9 bg-gradient-to-br from-emerald-primary to-emerald-glow rounded-lg flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </motion.div>
            <span className="text-lg font-bold text-slate-100 tracking-tight">Green<span className="text-emerald-primary">Trade</span></span>
          </Link>

          {/* Desktop Nav — absolutely centered */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {visibleLinks.map((link) => (
              <motion.div key={link.path} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                <Link to={link.path} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive(link.path) ? "bg-emerald-primary/10 text-emerald-glow" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}>
                  {link.label}
                </Link>
              </motion.div>
            ))}
            {user?.role === "admin" && (
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                <Link to="/admin" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${isActive("/admin") ? "bg-accent-violet/10 text-accent-violet" : "text-accent-violet/70 hover:text-accent-violet hover:bg-accent-violet/5"}`}>
                  <Shield size={14} /> Admin
                </Link>
              </motion.div>
            )}
          </div>

          {/* Right Section — Wallet + Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Wallet Button (Desktop) */}
            {user && (
              <div className="hidden md:flex items-center">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/wallet"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      isActive("/wallet")
                        ? "bg-emerald-primary/10 border-emerald-primary/30 text-emerald-glow shadow-glow"
                        : "border-glass-light text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/15"
                    }`}
                  >
                    <Wallet size={15} />
                    <span className="font-bold">₹{balance.toLocaleString("en-IN")}</span>
                  </Link>
                </motion.div>
              </div>
            )}
            {user ? (
              <div className="relative">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200 group">
                  <span className="hidden sm:block text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">{user.name}</span>
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-primary to-emerald-deep rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-glow">{user.name.charAt(0).toUpperCase()}</div>
                  <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} className="text-slate-500" /></motion.div>
                </motion.button>

                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }} className="absolute right-0 top-full mt-2 w-56 bg-surface border border-glass-light rounded-xl shadow-card overflow-hidden z-50">
                        <div className="p-3 border-b border-glass-light">
                          <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <div className="p-1.5">
                          {[
                            { to: "/profile", icon: User, label: "Profile" },
                            { to: "/orders", icon: BarChart3, label: "My Orders" },
                          ].map((item, i) => (
                            <motion.div key={item.to} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                              <Link to={item.to} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                                <item.icon size={15} /> {item.label}
                              </Link>
                            </motion.div>
                          ))}
                          <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
                            <LogOut size={15} /> Log Out
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">Log In</Link>
                <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/register" className="px-5 py-2 bg-emerald-primary hover:bg-emerald-glow text-midnight font-semibold text-sm rounded-lg transition-colors shadow-glow hover:shadow-glow-lg">Sign Up</Link>
                </motion.div>
              </div>
            )}

            {/* Mobile Toggle */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={20} /></motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={20} /></motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="md:hidden border-t border-glass-light bg-midnight-50/95 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-4 space-y-1">
              {visibleLinks.map((link, i) => (
                <motion.div key={link.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={link.path} onClick={() => setMobileOpen(false)} className={`block px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive(link.path) ? "bg-emerald-primary/10 text-emerald-glow" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}>{link.label}</Link>
                </motion.div>
              ))}
              {user?.role === "admin" && <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-accent-violet/70 hover:text-accent-violet">🛡️ Admin</Link>}
              {user && (<>
                <Link to="/wallet" onClick={() => setMobileOpen(false)} className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive("/wallet") ? "bg-emerald-primary/10 text-emerald-glow" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}>
                  <span className="flex items-center gap-2"><Wallet size={15} /> Wallet</span>
                  <span className="font-bold text-emerald-glow">₹{balance.toLocaleString("en-IN")}</span>
                </Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5">Profile</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5">Log Out</button>
              </>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;