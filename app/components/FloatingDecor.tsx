"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Wand2, Star } from "lucide-react";

export function FloatingDecor() {
    const { scrollYProgress } = useScroll();

    const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const r1 = useTransform(scrollYProgress, [0, 1], [0, 360]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
            <motion.div
                style={{ y: y1, rotate: r1 }}
                className="absolute top-[20%] left-[10%] opacity-20 text-lime-500"
            >
                <Sparkles size={80} />
            </motion.div>

            <motion.div
                style={{ y: y2, rotate: -r1 }}
                className="absolute top-[60%] right-[10%] opacity-15 text-slate-400"
            >
                <Wand2 size={120} />
            </motion.div>

            <motion.div
                style={{ y: y1 }}
                className="absolute top-[80%] left-[15%] opacity-10 text-lime-600"
            >
                <Star size={40} />
            </motion.div>
        </div>
    );
}
