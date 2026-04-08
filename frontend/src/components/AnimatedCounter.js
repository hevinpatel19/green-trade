import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/**
 * AnimatedCounter — smoothly counts up from 0 to target value.
 * Triggers when scrolled into view.
 */
const AnimatedCounter = ({
    target,
    duration = 1.5,
    prefix = "",
    suffix = "",
    decimals = 0,
    className = "",
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        const num = parseFloat(target) || 0;
        if (num === 0) { setCount(0); return; }

        const startTime = performance.now();
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(eased * num);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isInView, target, duration]);

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4 }}
        >
            {prefix}{count.toFixed(decimals)}{suffix}
        </motion.span>
    );
};

export default AnimatedCounter;
