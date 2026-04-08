import React, { useState, useContext } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import UserContext from "../context/UserContext";
import ContactSellerModal from "./ContactSellerModal";

const ContactSellerButton = ({ sellerEmail }) => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!user || !sellerEmail) return null;

    return (
        <>
            <motion.button
                onClick={() => setIsModalOpen(true)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 z-40 bg-emerald-primary hover:bg-emerald-glow text-midnight px-5 py-3 rounded-xl shadow-glow hover:shadow-glow-lg transition-colors flex items-center gap-2 font-bold text-sm focus:outline-none ripple-btn"
                aria-label="Contact Seller"
            >
                <MessageCircle size={18} />
                <span className="hidden sm:inline">Contact Seller</span>
            </motion.button>

            <ContactSellerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} sellerEmail={sellerEmail} />
        </>
    );
};

export default ContactSellerButton;
