"use client";

import { motion, useScroll, useTransform } from "framer-motion";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { KineticScroll } from "./KineticScroll";

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    "/costumeshow/Image 11-07-2026 at 13.13 (2).png",
    "/costumeshow/Image 11-07-2026 at 13.13.png",
    "/costumeshow/Image 11-07-2026 at 13.14 (2).png",
    "/costumeshow/Image 11-07-2026 at 13.41 (1).png",
    "/costumeshow/Image 11-07-2026 at 13.41.png",
    "/costumeshow/Image 11-07-2026 at 13.43 (1).png",
    "/costumeshow/Image 11-07-2026 at 13.45 (1).png",
    "/costumeshow/Image 11-07-2026 at 13.48.png",
    "/costumeshow/Image 11-07-2026 at 13.53.png",
    "/costumeshow/Image 11-07-2026 at 13.54.png",
    "/costumeshow/Image 11-07-2026 at 14.02 (1).png",
    "/costumeshow/Image 11-07-2026 at 13.12 (1).png",
    "/costumeshow/Image 11-07-2026 at 13.12.png"
  ];

  useEffect(() => {
    setIsLoaded(true);

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000); // 6 seconds

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 800], [0, 200]);

  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-black flex items-center justify-center font-outfit pt-24 md:pt-[136px]">
      {/* Background Image - Single high-impact premium image */}
      <div className="absolute inset-0 z-0">
        <motion.div
          key={heroImages[currentImageIndex]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          style={{ y: yBg }}
          className="absolute inset-0 scale-110"
        >
          <img
            src={heroImages[currentImageIndex]}
            alt="Hero background"
            className="w-full h-full object-cover object-top opacity-60"
            loading="eager"
          />
        </motion.div>
        {/* Cinematic Overlays for better text readability and premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 z-10" />
      </div>

      {/* Main Content Container - Centered and Minimal */}
      <div className="relative z-30 container mx-auto px-6 text-center pt-8 md:pt-0">
        <KineticScroll>
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
            {/* Minimalist CTA Button Only */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex items-center justify-center"
            >
              <Link
                href="/costume-show-shop"
                className="group relative px-8 md:px-14 py-5 md:py-7 bg-lime-500 hover:bg-lime-400 text-slate-950 font-black rounded-2xl overflow-hidden transition-all duration-500 shadow-[0_20px_50px_rgba(132,204,22,0.4)] hover:shadow-[0_30px_70px_rgba(132,204,22,0.6)] flex items-center justify-center gap-3 active:scale-95"
              >
                <span className="relative z-10 text-xs md:text-base tracking-widest uppercase">Shop 2026 Costume Collections</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </KineticScroll>
      </div>

      {/* Subtle Scroll Indicator */}
      <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-30 transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col items-center gap-4">
          <span className="text-[10px] uppercase font-black tracking-[0.5em] text-gray-500">Scroll</span>
          <div className="w-[2px] h-12 bg-gradient-to-b from-lime-500 to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
}
