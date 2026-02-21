"use client";

import { motion, useScroll, useVelocity, useTransform, useSpring } from "framer-motion";
import { ReactNode, useRef } from "react";

interface KineticScrollProps {
    children: ReactNode;
    active?: boolean;
}

export function KineticScroll({ children, active = true }: KineticScrollProps) {
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);

    // Smooth out the velocity for a liquid feel
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 300
    });

    // Map velocity to skew and scale
    // Velocity can be quite high, so we map it to a subtle aesthetic range
    const skew = useTransform(smoothVelocity, [-3000, 3000], [-8, 8]);
    const scale = useTransform(smoothVelocity, [-3000, 3000], [0.96, 1.04]);

    if (!active) return <>{children}</>;

    return (
        <motion.div
            style={{
                skewY: skew,
                scale,
                transformOrigin: "center center"
            }}
            transition={{
                type: "spring",
                damping: 20,
                stiffness: 100
            }}
        >
            {children}
        </motion.div>
    );
}
