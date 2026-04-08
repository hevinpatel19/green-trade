import React from "react";
import { motion } from "framer-motion";

/**
 * PageTransition — wraps page content with enter/exit animations.
 * Use inside each page component for consistent route transitions.
 */
const PageTransition = ({ children, className = "" }) => {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
                duration: 0.35,
                ease: [0.25, 0.1, 0.25, 1],
            }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
