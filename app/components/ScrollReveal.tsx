"use client";

import { motion, useInView, useAnimation, Variant } from "framer-motion";
import { useEffect, useRef, ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    duration?: number;
    y?: number;
    x?: number;
    scale?: number;
    once?: boolean;
}

export const ScrollReveal = ({
    children,
    width = "100%",
    delay = 0.2,
    duration = 0.8,
    y = 50,
    x = 0,
    scale = 0.95,
    once = true,
}: ScrollRevealProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, {
        once,
        amount: 0.2, // Trigger when 20% of element is in view
    });
    const mainControls = useAnimation();

    useEffect(() => {
        if (isInView) {
            mainControls.start("visible");
        }
    }, [isInView, mainControls]);

    return (
        <div ref={ref} style={{ position: "relative", width, overflow: "visible" }}>
            <motion.div
                variants={{
                    hidden: { opacity: 0, y, x, scale, filter: "blur(10px)" },
                    visible: { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" },
                }}
                initial="hidden"
                animate={mainControls}
                transition={{
                    duration,
                    delay,
                    ease: [0.22, 1, 0.36, 1], // Custom premium cubic-bezier
                }}
            >
                {children}
            </motion.div>
        </div>
    );
};
