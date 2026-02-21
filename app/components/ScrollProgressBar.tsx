"use client";

import { motion, useScroll } from "framer-motion";

export function ScrollProgressBar() {
    const { scrollYProgress } = useScroll();

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-lime-500 origin-left z-[9999]"
            style={{ scaleX: scrollYProgress }}
        />
    );
}
