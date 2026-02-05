import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const AdminPage = () => {
    const { user, loading: authLoading } = useContext(UserContext);
    const navigate = useNavigate();

    // --- STATE ---
    const [showTrades, setShowTrades] = useState(false);
    const [trades, setTrades] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- SEARCH & FILTER STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [tradeStatusFilter, setTradeStatusFilter] = useState("All");

    // --- EXPANDED TRADE STATE ---
    const [expandedTrade, setExpandedTrade] = useState(null);

    // --- ACCESS CONTROL ---
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate("/login");
            } else if (user.role !== "admin") {
                navigate("/");
                toast.error("Access denied. Admin privileges required.");
            }
        }
    }, [user, authLoading, navigate]);

    // --- FETCH STATS ---
    useEffect(() => {
        if (user?.role === "admin" && user?.token) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/admin/stats", {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error("Stats fetch error:", err);
        }
    };

    // --- FETCH TRADES ---
    const fetchTrades = async () => {
        if (!user?.token) return;

        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("http://localhost:5000/api/admin/trades", {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setTrades(res.data);
        } catch (err) {
            console.error("❌ Fetch trades error:", err);
            setError(err.response?.data?.message || "Failed to fetch trades");
            toast.error("Failed to fetch trades");
        } finally {
            setLoading(false);
        }
    };

    // --- TOGGLE TRADES VIEW ---
    const handleToggleTrades = () => {
        if (!showTrades) {
            fetchTrades();
        }
        setShowTrades(!showTrades);
    };

    // --- FILTER & SEARCH LOGIC ---
    const filteredTrades = trades.filter(trade => {
        // Search filter
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            trade._id.toLowerCase().includes(searchLower) ||
            (trade.buyerInfo?.email || trade.buyerAddress || "").toLowerCase().includes(searchLower) ||
            (trade.sellerInfo?.email || trade.sellerAddress || "").toLowerCase().includes(searchLower) ||
            (trade.buyerInfo?.name || "").toLowerCase().includes(searchLower) ||
            (trade.sellerInfo?.name || "").toLowerCase().includes(searchLower);

        // Payment status filter (lowercase)
        const tradePaymentStatus = trade.paymentStatus || "pending";
        const matchesPayment = paymentFilter === "All" || tradePaymentStatus === paymentFilter;

        // Trade status filter (lowercase)
        const tradeStatus = trade.status || "pending";
        const matchesTradeStatus = tradeStatusFilter === "All" || tradeStatus === tradeStatusFilter;

        return matchesSearch && matchesPayment && matchesTradeStatus;
    });

    // --- FORMAT DATE ---
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    };

    // --- GET STATUS BADGE COLOR ---
    const getPaymentBadgeColor = (status) => {
        switch (status) {
            case "paid": return "bg-green-100 text-green-700";
            case "failed": return "bg-red-100 text-red-700";
            case "refunded": return "bg-purple-100 text-purple-700";
            default: return "bg-yellow-100 text-yellow-700";
        }
    };

    const getTradeBadgeColor = (status) => {
        switch (status) {
            case "completed":
            case "Delivered": return "bg-green-100 text-green-700";
            case "cancelled":
            case "Cancelled": return "bg-red-100 text-red-700";
            case "matched":
            case "Processing": return "bg-blue-100 text-blue-700";
            default: return "bg-yellow-100 text-yellow-700";
        }
    };

    // --- LOADING / ACCESS CHECK ---
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            {/* HEADER */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-green-500 rounded-full blur-[120px] opacity-20"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500 rounded-full blur-[100px] opacity-20"></div>
                    <div className="relative z-10">
                        <p className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-2">🛡️ Admin Dashboard</p>
                        <h1 className="text-4xl font-extrabold mb-2">
                            Welcome, {user.name || "Admin"}
                        </h1>
                        <p className="text-gray-400">Green Trade - Solar Energy P2P Trading Platform</p>
                    </div>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="text-3xl mb-2">⚡</div>
                        <p className="text-sm text-gray-500 font-medium">Total Trades</p>
                        <p className="text-2xl font-extrabold text-gray-900">{stats?.totalTrades || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="text-3xl mb-2">📊</div>
                        <p className="text-sm text-gray-500 font-medium">Active Listings</p>
                        <p className="text-2xl font-extrabold text-gray-900">{stats?.totalListings || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="text-3xl mb-2">👥</div>
                        <p className="text-sm text-gray-500 font-medium">Total Users</p>
                        <p className="text-2xl font-extrabold text-gray-900">{stats?.totalUsers || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="text-3xl mb-2">🔋</div>
                        <p className="text-sm text-gray-500 font-medium">Energy Traded</p>
                        <p className="text-2xl font-extrabold text-green-600">{stats?.totalEnergyTraded || 0} kWh</p>
                    </div>
                </div>
            </div>

            {/* ACTION CARDS */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trades History Card */}
                    <div
                        onClick={handleToggleTrades}
                        className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${showTrades
                            ? "bg-green-50 border-green-300 shadow-lg"
                            : "bg-white border-gray-200 hover:border-green-300 hover:shadow-lg"
                            }`}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${showTrades ? "bg-green-500 text-white" : "bg-gray-100"
                                }`}>
                                ⚡
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">View All Trades History</h3>
                                <p className="text-sm text-gray-500">Browse all P2P energy trades (read-only)</p>
                            </div>
                        </div>
                        <button className={`w-full py-3 rounded-xl font-bold transition ${showTrades
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-900 text-white hover:bg-gray-800"
                            }`}>
                            {showTrades ? "Hide Trades ▲" : "View All Trades ▼"}
                        </button>
                    </div>

                    {/* Platform Volume Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-purple-500 text-white flex items-center justify-center text-2xl">
                                💰
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Total Trade Volume</h3>
                                <p className="text-3xl font-extrabold text-purple-600">₹{stats?.totalVolume || "0.00"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-white/60 p-2 rounded-lg">
                                <span className="text-green-600 font-bold">{stats?.paymentStats?.paid || 0}</span> Paid
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg">
                                <span className="text-yellow-600 font-bold">{stats?.paymentStats?.pending || 0}</span> Pending
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TRADES SECTION */}
            {showTrades && (
                <div className="max-w-7xl mx-auto animate-fade-in">
                    {/* Search & Filters */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search</label>
                                <input
                                    type="text"
                                    placeholder="Search by Trade ID, buyer/seller email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Payment Status Filter */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Status</label>
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-white"
                                >
                                    <option value="All">All Payments</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>

                            {/* Trade Status Filter */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trade Status</label>
                                <select
                                    value={tradeStatusFilter}
                                    onChange={(e) => setTradeStatusFilter(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-white"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="matched">Matched</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-10">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">Loading trades...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                            <p className="text-red-600 font-bold">{error}</p>
                            <button
                                onClick={fetchTrades}
                                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Trades List */}
                    {!loading && !error && (
                        <div className="space-y-4">
                            {filteredTrades.length === 0 ? (
                                <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
                                    <p className="text-gray-500 text-lg">No trades found matching your criteria.</p>
                                </div>
                            ) : (
                                filteredTrades.map((trade) => (
                                    <div
                                        key={trade._id}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        {/* Trade Header - Always visible */}
                                        <div
                                            className="p-6 cursor-pointer"
                                            onClick={() => setExpandedTrade(expandedTrade === trade._id ? null : trade._id)}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                                        ⚡
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{trade.energyAmount} kWh @ ₹{trade.pricePerKwh}/kWh</p>
                                                        <p className="text-sm text-gray-500">{trade.energyType || "Solar"} Energy</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    {/* Trade ID */}
                                                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-mono text-gray-600">
                                                        #{trade._id.slice(-8)}
                                                    </span>

                                                    {/* Payment Status Badge */}
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getPaymentBadgeColor(trade.paymentStatus || "Pending")}`}>
                                                        💳 {trade.paymentStatus || "Pending"}
                                                    </span>

                                                    {/* Trade Status Badge */}
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getTradeBadgeColor(trade.status || "Pending")}`}>
                                                        {trade.status || "Pending"}
                                                    </span>

                                                    {/* Expand Icon */}
                                                    <span className={`transition-transform text-gray-400 ${expandedTrade === trade._id ? "rotate-180" : ""}`}>
                                                        ▼
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quick Info Row */}
                                            <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-500">
                                                <span>📅 {formatDate(trade.updatedAt || trade.createdAt)}</span>
                                                <span className="font-bold text-green-600">
                                                    Total: ₹{(trade.energyAmount * trade.pricePerKwh).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expanded Details (READ-ONLY) */}
                                        {expandedTrade === trade._id && (
                                            <div className="border-t border-gray-100 p-6 bg-gray-50 animate-fade-in">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Trade Details */}
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                            <span className="text-lg">📋</span> Trade Details
                                                        </h4>
                                                        <div className="space-y-3 text-sm bg-white p-4 rounded-xl border border-gray-100">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Trade ID:</span>
                                                                <span className="font-mono text-gray-900 text-xs">{trade._id}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Energy Type:</span>
                                                                <span className="text-gray-900">{trade.energyType || "Solar"}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Amount:</span>
                                                                <span className="text-gray-900 font-bold">{trade.energyAmount} kWh</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Price per kWh:</span>
                                                                <span className="text-gray-900">₹{trade.pricePerKwh}</span>
                                                            </div>
                                                            <div className="flex justify-between border-t border-gray-100 pt-2">
                                                                <span className="text-gray-500 font-bold">Total Amount:</span>
                                                                <span className="font-bold text-green-600">₹{(trade.energyAmount * trade.pricePerKwh).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Timestamp:</span>
                                                                <span className="text-gray-900">{formatDate(trade.updatedAt || trade.createdAt)}</span>
                                                            </div>
                                                            {trade.transactionId && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-500">Gateway TXN ID:</span>
                                                                    <span className="font-mono text-xs text-gray-900">{trade.transactionId}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Buyer Info */}
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                            <span className="text-lg">🛒</span> Buyer
                                                        </h4>
                                                        <div className="space-y-3 text-sm bg-white p-4 rounded-xl border border-gray-100">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                                    {(trade.buyerInfo?.name || trade.buyerAddress || "?").charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900">{trade.buyerInfo?.name || "Unknown"}</p>
                                                                    <p className="text-xs text-gray-500">{trade.buyerInfo?.email || trade.buyerAddress}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Seller Info */}
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                            <span className="text-lg">⚡</span> Seller
                                                        </h4>
                                                        <div className="space-y-3 text-sm bg-white p-4 rounded-xl border border-gray-100">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                                                    {(trade.sellerInfo?.name || trade.sellerAddress || "?").charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900">{trade.sellerInfo?.name || "Unknown"}</p>
                                                                    <p className="text-xs text-gray-500">{trade.sellerInfo?.email || trade.sellerAddress}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Section (READ-ONLY) */}
                                                <div className="mt-6 p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl border border-gray-200">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-3">Status Information (Read-Only)</p>
                                                    <div className="flex flex-wrap gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-500 text-sm">Payment:</span>
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getPaymentBadgeColor(trade.paymentStatus || "Pending")}`}>
                                                                {trade.paymentStatus || "Pending"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-500 text-sm">Trade Status:</span>
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getTradeBadgeColor(trade.status || "Pending")}`}>
                                                                {trade.status || "Pending"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-3 italic">
                                                        ℹ️ Payment and trade status are managed by the payment gateway and cannot be manually edited.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPage;
