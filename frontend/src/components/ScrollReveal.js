import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * ScrollReveal — animates children when they scroll into viewport.
 * Wraps content in a motion.div with configurable animation.
 */
const ScrollReveal = ({
    children,
    className = "",
    direction = "up",      // "up" | "down" | "left" | "right" | "none"
    delay = 0,
    duration = 0.6,
    distance = 30,
    once = true,
    scale = 1,
    ...props
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: "-50px" });

    const directionMap = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { x: distance, y: 0 },
        right: { x: -distance, y: 0 },
        none: { x: 0, y: 0 },
    };

    const offset = directionMap[direction] || directionMap.up;

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{
                opacity: 0,
                x: offset.x,
                y: offset.y,
                scale: scale < 1 ? scale : 1,
            }}
            animate={isInView ? {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
            } : {}}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

/**
 * StaggerContainer — staggers children animations.
 */
export const StaggerContainer = ({
    children,
    className = "",
    staggerDelay = 0.1,
    delay = 0,
    ...props
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: delay,
                    },
                },
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

/**
 * StaggerItem — child of StaggerContainer.
 */
export const StaggerItem = ({
    children,
    className = "",
    direction = "up",
    distance = 25,
    ...props
}) => {
    const directionMap = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
    };
    const offset = directionMap[direction] || directionMap.up;

    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, ...offset },
                visible: { opacity: 1, x: 0, y: 0 },
            }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default ScrollReveal;
