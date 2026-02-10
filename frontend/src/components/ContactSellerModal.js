import React, { useState, useEffect } from "react";
import axios from "axios";
import { Phone, Mail, X, User, Loader2 } from "lucide-react";

/**
 * ContactSellerModal - Modal displaying seller contact information
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {function} props.onClose - Function to close modal
 * @param {string} props.sellerEmail - Email of seller to fetch contact info
 */
const ContactSellerModal = ({ isOpen, onClose, sellerEmail }) => {
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && sellerEmail) {
            fetchSellerInfo();
        }
    }, [isOpen, sellerEmail]);

    const fetchSellerInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/users/seller/${encodeURIComponent(sellerEmail)}`
            );
            setSeller(res.data);
        } catch (err) {
            console.error("Error fetching seller info:", err);
            setError("Unable to load seller contact info");
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User size={20} />
                        Seller Contact
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded-full"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="animate-spin text-green-600 mb-3" size={32} />
                            <p className="text-gray-500">Loading seller info...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-500 font-medium">{error}</p>
                            <button
                                onClick={fetchSellerInfo}
                                className="mt-3 text-green-600 hover:underline text-sm font-medium"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : seller ? (
                        <div className="space-y-4">
                            {/* Seller Name */}
                            <div className="text-center pb-4 border-b border-gray-100">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl font-bold text-green-600">
                                        {seller.name?.charAt(0).toUpperCase() || "S"}
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold text-gray-800">{seller.name}</h4>
                                <p className="text-sm text-gray-500">Energy Seller</p>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                {/* Email */}
                                <a
                                    href={`mailto:${seller.email}`}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
                                >
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <Mail className="text-green-600" size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                                        <p className="text-gray-800 font-medium truncate group-hover:text-green-600 transition">
                                            {seller.email}
                                        </p>
                                    </div>
                                </a>

                                {/* Phone */}
                                {seller.phoneNumber ? (
                                    <a
                                        href={`tel:${seller.phoneNumber}`}
                                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
                                    >
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <Phone className="text-green-600" size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 uppercase font-bold">Phone</p>
                                            <p className="text-gray-800 font-medium group-hover:text-green-600 transition">
                                                {seller.phoneNumber}
                                            </p>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl opacity-60">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <Phone className="text-gray-400" size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 uppercase font-bold">Phone</p>
                                            <p className="text-gray-400 font-medium italic">Not provided</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 text-center">
                    <p className="text-xs text-gray-400">
                        Contact seller for questions about energy listings
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
};

export default ContactSellerModal;
