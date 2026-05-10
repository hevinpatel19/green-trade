import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import UserContext from "../context/UserContext";
import PageTransition from "../components/PageTransition";
import ScrollReveal from "../components/ScrollReveal";
import { MapPin, Sun, RefreshCw, Zap, Trash2, Gavel, TrendingUp, Battery, BatteryWarning, Info } from "lucide-react";
import { WEATHER_API_KEY } from "../utils/weatherUtils";
import { API_URL, ML_URL } from "../utils/api";

const formatTimeWithOffset = (unixTimestamp, timezoneOffsetSeconds) => {
  const utcMs = unixTimestamp * 1000;
  const cityMs = utcMs + timezoneOffsetSeconds * 1000;
  const cityDate = new Date(cityMs);
  return cityDate.getUTCHours().toString().padStart(2, "0") + ":" + cityDate.getUTCMinutes().toString().padStart(2, "0");
};

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const [consumption, setConsumption] = useState(15);
  const [sellAmount, setSellAmount] = useState("");
  const [solarCapacity, setSolarCapacity] = useState("");
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [advisorTip, setAdvisorTip] = useState(null);
  const [basePrice, setBasePrice] = useState("");
  const [isAuction, setIsAuction] = useState(false);
  const [auctionDuration, setAuctionDuration] = useState(24);
  const [myListings, setMyListings] = useState([]);

  const sellerAddr = user?.address || {};
  const hasCompleteAddress = sellerAddr.city && sellerAddr.country;

  useEffect(() => { if (user) fetchListings(); }, [user]);

  useEffect(() => {
    if (user && hasCompleteAddress) runAutoForecast();
  }, [user?.address?.city, user?.address?.state, user?.address?.country]);

  const fetchListings = async () => {
    try { const res = await axios.get(`${API_URL}/api/market/mylistings/${user.email}`); setMyListings(res.data); } catch (e) { console.error(e); }
  };

  const runAutoForecast = async () => {
    if (!hasCompleteAddress) return;
    setLoading(true);
    try {
      const query = `${sellerAddr.city},${sellerAddr.state || ""},${sellerAddr.country}`;
      const geoRes = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${WEATHER_API_KEY}`);
      if (!geoRes.data.length) { toast.error("Could not locate your profile city."); setLoading(false); return; }
      const match = geoRes.data[0];
      await processWeather(match.lat, match.lon, `${match.name}, ${match.country}`);
    } catch (e) { toast.error("AI server error. Check port 5001."); setLoading(false); }
  };

  const processWeather = async (lat, lon, displayLoc) => {
    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&cnt=8`;
      const [weatherRes, forecastRes] = await Promise.all([axios.get(weatherUrl), axios.get(forecastUrl)]);
      const d = weatherRes.data;
      setWeatherData({ location: displayLoc || d.name + ", " + d.sys.country, temp: d.main.temp, feels_like: d.main.feels_like, clouds: d.clouds.all, humidity: d.main.humidity, sunrise: formatTimeWithOffset(d.sys.sunrise, d.timezone), sunset: formatTimeWithOffset(d.sys.sunset, d.timezone) });
      const forecastPoints = forecastRes.data.list.map((i) => ({ dt: i.dt, temp: i.main.temp, humidity: i.main.humidity, clouds: i.clouds.all }));
      const aiRes = await axios.post(`${ML_URL}/predict-energy-forecast`, { forecast: forecastPoints, sunrise: d.sys.sunrise, sunset: d.sys.sunset, timezone_offset: d.timezone, expected_consumption_24h: parseFloat(consumption), solar_capacity_kw: parseFloat(solarCapacity) || 1.0 });
      setPredictionData({ generated: aiRes.data.total_generated, consumed: aiRes.data.user_consumption, net: aiRes.data.net_energy });
      setSellAmount(aiRes.data.net_energy > 0 ? aiRes.data.net_energy : "");
      setAdvisorTip(aiRes.data.advisor);
    } catch (e) { toast.error("AI server error. Check port 5001."); }
    setLoading(false);
  };

  const handleListEnergy = async (e) => {
    e.preventDefault();
    if (!predictionData || !basePrice || !sellAmount) return;
    if (parseFloat(sellAmount) > predictionData.net) return toast.error(`Maximum excess available is ${predictionData.net} kWh`);
    try {
      await axios.post(`${API_URL}/api/market/list`, { sellerAddress: user.email, energyAmount: parseFloat(sellAmount), pricePerKwh: parseFloat(basePrice), energyType: "Solar", source: "AI Prediction", isAuction, durationHours: isAuction ? auctionDuration : null });
      toast.success("Listed Successfully!");
      fetchListings();
    } catch (e) { toast.error("Listing error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete listing?")) return;
    try { await axios.delete(`${API_URL}/api/market/` + id); setMyListings((prev) => prev.filter((i) => i._id !== id)); } catch (e) { toast.error("Delete failed"); }
  };

  if (!hasCompleteAddress) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, type: "spring" }} className="max-w-md w-full text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20 bg-accent-amber/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapPin size={36} className="text-accent-amber" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-100 mb-3">Profile Address Required</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">Complete your profile address to unlock AI-powered solar forecasting.</p>
            <motion.a whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} href="/profile" className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl transition-colors shadow-glow btn-press ripple-btn">
              Go to Profile <MapPin size={16} />
            </motion.a>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-midnight py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <Zap className="text-emerald-primary" size={28} />
                </motion.div>
                Seller Dashboard
              </h1>
              <p className="text-slate-500 mt-1">Real-time solar forecasting & peer-to-peer trading</p>
            </div>
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="px-4 py-2 bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-glow rounded-lg text-sm font-semibold">
              {user?.role || "Trader"}
            </motion.span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: AI & WEATHER */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-surface border border-glass-light rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-primary" /> Smart Market AI
              </h2>

              <div className="space-y-4 bg-midnight-100 p-5 rounded-xl border border-glass-light mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5"><MapPin size={14} /> Forecast Location</span>
                  <span className="font-semibold text-slate-200">{sellerAddr.city}, {sellerAddr.state ? sellerAddr.state + ", " : ""}{sellerAddr.country}</span>
                </div>
                <p className="text-[10px] text-slate-600">Auto-synced from your profile address</p>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Solar Capacity (kW)</label>
                  <input type="number" value={solarCapacity} onChange={(e) => { const val = e.target.value; if (val === "" || Number(val) >= 0) setSolarCapacity(val); }} step="0.1" min="0" placeholder="e.g. 3.5" className="w-full mt-1.5 p-3 bg-midnight border border-glass-light rounded-xl text-emerald-glow font-semibold focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 input-glow transition-all placeholder-slate-600" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected Consumption (kWh / 24h)</label>
                  <input type="number" value={consumption} onChange={(e) => setConsumption(e.target.value)} className="w-full mt-1.5 p-3 bg-midnight border border-glass-light rounded-xl text-emerald-glow font-semibold focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 input-glow transition-all" />
                </div>

                <motion.button onClick={runAutoForecast} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full py-3 bg-surface-light hover:bg-midnight-300 border border-glass-light text-slate-200 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 btn-press">
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  {loading ? "Analyzing..." : "Refresh Forecast"}
                </motion.button>
              </div>

              {/* Prediction Results */}
              <AnimatePresence>
                {predictionData && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5 }} className="space-y-4 overflow-hidden">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center justify-between text-sm bg-midnight-100 p-4 rounded-xl border border-glass-light">
                      <span className="text-slate-400 flex items-center gap-1.5"><MapPin size={14} className="text-emerald-primary" />{weatherData?.location}</span>
                      <span className="text-slate-300 font-mono">{weatherData?.temp.toFixed(1)}°C • {weatherData?.clouds}% clouds</span>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Generated", value: predictionData.generated, color: "emerald-primary", bgClass: "bg-emerald-primary/5 border-emerald-primary/15" },
                        { label: "Consumed", value: predictionData.consumed, color: "red-400", bgClass: "bg-red-500/5 border-red-500/15" },
                        { label: "Excess", value: predictionData.net, color: predictionData.net > 0 ? "accent-cyan" : "slate-500", bgClass: predictionData.net > 0 ? "bg-accent-cyan/5 border-accent-cyan/15" : "bg-midnight-200 border-glass-light" },
                      ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className={`${stat.bgClass} p-4 rounded-xl text-center border card-hover`}>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">{stat.label}</p>
                          <p className={`text-xl font-bold text-${stat.color}`}>{stat.value} <span className="text-xs text-slate-500">kWh</span></p>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`p-5 rounded-xl border ${predictionData.net > 0 ? "bg-gradient-to-r from-emerald-primary/10 to-accent-cyan/5 border-emerald-primary/20" : "bg-red-500/5 border-red-500/20"}`}>
                      <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 mb-2">
                        <Info size={16} className={predictionData.net > 0 ? "text-emerald-primary" : "text-red-400"} /> AI Strategic Advisor
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{advisorTip?.message}</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* RIGHT: LISTING & INVENTORY */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-surface border border-glass-light rounded-2xl p-6">
                <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                  <Battery size={20} className="text-emerald-primary" /> List Energy to Market
                </h2>
                {predictionData?.net > 0 ? (
                  <form onSubmit={handleListEnergy} className="space-y-5">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Energy to Sell (kWh)</label>
                      <input type="number" step="0.1" value={sellAmount} onChange={(e) => setSellAmount(e.target.value)} required placeholder="Enter amount" className="w-full mt-1.5 p-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-100 font-semibold focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 input-glow transition-all placeholder-slate-600" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Price (₹/kWh)</label>
                      <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required min="1" placeholder="e.g. 10" className="w-full mt-1.5 p-3 bg-midnight-100 border border-glass-light rounded-xl text-slate-100 font-semibold focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 input-glow transition-all placeholder-slate-600" />
                    </div>
                    <div className="flex items-center justify-between bg-midnight-100 p-4 rounded-xl border border-glass-light">
                      <div className="flex items-center gap-3">
                        <motion.button type="button" onClick={() => setIsAuction(!isAuction)} whileTap={{ scale: 0.9 }} className={`w-11 h-6 rounded-full transition-all duration-300 relative ${isAuction ? 'bg-accent-violet' : 'bg-midnight-300'}`}>
                          <motion.span layout className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow`} animate={{ left: isAuction ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                        </motion.button>
                        <label className="font-semibold text-slate-300 text-sm cursor-pointer" onClick={() => setIsAuction(!isAuction)}>Auction Mode</label>
                      </div>
                      <AnimatePresence>
                        {isAuction && (
                          <motion.select initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} value={auctionDuration} onChange={(e) => setAuctionDuration(e.target.value)} className="p-2 bg-midnight border border-glass-light rounded-lg text-sm font-semibold text-slate-300 focus:outline-none">
                            <option value="12">12 hrs</option><option value="24">24 hrs</option><option value="48">48 hrs</option>
                          </motion.select>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.button type="submit" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} className="w-full py-4 bg-emerald-primary hover:bg-emerald-glow text-midnight font-bold rounded-xl transition-colors shadow-glow hover:shadow-glow-lg flex items-center justify-center gap-2 ripple-btn btn-press">
                      {isAuction ? <><Gavel size={18} /> Start Auction</> : <><Zap size={18} /> Sell {sellAmount || 0} kWh</>}
                    </motion.button>
                  </form>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-48 flex flex-col items-center justify-center border border-dashed border-glass-light rounded-xl bg-midnight-100 px-6 text-center">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                      <BatteryWarning size={32} className="text-slate-600 mb-3" />
                    </motion.div>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      {predictionData?.net <= 0 ? "Current generation doesn't cover your consumption." : "Waiting for AI Forecast to unlock listing tools."}
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {/* Active Listings */}
              <ScrollReveal delay={0.3}>
                <div className="bg-surface border border-glass-light rounded-2xl p-6">
                  <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Sun size={18} className="text-accent-amber" /> Your Active Listings
                  </h3>
                  {myListings.length === 0 ? (
                    <p className="text-slate-600 italic text-sm">No active listings found.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-glass-light">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-midnight-100 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                          <tr><th className="px-4 py-3 text-center">Energy</th><th className="px-4 py-3 text-center">Price</th><th className="px-4 py-3 text-right pr-4">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-glass-light">
                          {myListings.map((item, i) => (
                            <motion.tr key={item._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-midnight-100/50 transition-colors">
                              <td className="px-4 py-3.5 font-semibold text-slate-200 text-center text-sm">{item.energyAmount} kWh</td>
                              <td className="px-4 py-3.5 font-semibold text-emerald-glow text-center text-sm">₹{item.pricePerKwh}</td>
                              <td className="px-4 py-3.5 text-right">
                                <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(item._id)} className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors" title="Delete listing">
                                  <Trash2 size={16} />
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;