import React, { useState, useContext } from "react";
import { MessageCircle } from "lucide-react";
import UserContext from "../context/UserContext";
import ContactSellerModal from "./ContactSellerModal";

/**
 * ContactSellerButton - Floating button to contact seller
 * Only visible to logged-in users
 * @param {Object} props
 * @param {string} props.sellerEmail - Email of the seller to contact
 */
const ContactSellerButton = ({ sellerEmail }) => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Don't render if user is not logged in or no seller email
    if (!user || !sellerEmail) {
        return null;
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-green-600 hover:bg-green-700 text-white 
                   px-5 py-3 rounded-full shadow-lg hover:shadow-xl 
                   transition-all duration-300 transform hover:-translate-y-1 
                   flex items-center gap-2 font-bold text-sm
                   focus:outline-none focus:ring-4 focus:ring-green-300"
                aria-label="Contact Seller"
            >
                <MessageCircle size={18} />
                <span className="hidden sm:inline">Contact Seller</span>
            </button>

            {/* Modal */}
            <ContactSellerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                sellerEmail={sellerEmail}
            />
        </>
    );
};

export default ContactSellerButton;
