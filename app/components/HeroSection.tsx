"use client";

import { motion, useScroll, useTransform } from "framer-motion";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { KineticScroll } from "./KineticScroll";

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 800], [0, 200]);

  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-black flex items-center justify-center font-outfit">
      {/* Background Image - Single high-impact premium image */}
      <div className="absolute inset-0 z-0">
        <motion.div
          style={{ y: yBg }}
          className="absolute inset-0 scale-110"
        >
          <Image
            src="/empiimages/IMG_1217.JPG"
            alt="Hero background"
            fill
            className="object-cover object-top opacity-60"
            priority
          />
        </motion.div>
        {/* Cinematic Overlays for better text readability and premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 z-10" />
      </div>

      {/* Main Content Container - Centered and Minimal */}
      <div className="relative z-30 container mx-auto px-6 text-center">
        <KineticScroll>
          <div className="max-w-4xl mx-auto">
            {/* Accent Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-lime-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-10"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              Lagos&apos;s Premier Costume Maker
            </motion.div>

            {/* Title - Playfair for Elegance */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-5xl md:text-8xl lg:text-[10rem] font-black text-white leading-[0.9] mb-12 font-playfair"
            >
              Vision <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-lime-600 italic">
                Unfolded.
              </span>
            </motion.h1>

            {/* Description - Brief and impactful */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto mb-16 leading-relaxed font-medium"
            >
              Crafting premium bespoke experiences and elite costume rentals for those who demand excellence in every detail.
            </motion.p>

            {/* Single Focused Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link
                href="/shop"
                className="group relative px-12 py-6 bg-lime-500 hover:bg-lime-400 text-slate-950 font-black rounded-2xl overflow-hidden transition-all duration-500 shadow-[0_20px_40px_rgba(132,204,22,0.3)] hover:shadow-[0_30px_60px_rgba(132,204,22,0.4)] flex items-center gap-3 active:scale-95"
              >
                <span className="relative z-10">Explore the Gallery</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>

              <Link
                href="/custom-costumes"
                className="px-12 py-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl backdrop-blur-xl transition-all duration-500 flex items-center gap-3 active:scale-95"
              >
                Start Custom Design
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
