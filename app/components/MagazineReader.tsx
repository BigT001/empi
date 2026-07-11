"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Grid, 
  X, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause,
  Download,
  Info
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function MagazineReader() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGridView, setShowGridView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch sorted magazine images from our API
  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch("/api/costumeshow-magazine");
        const data = await res.json();
        if (data.success && data.images) {
          setImages(data.images);
        }
      } catch (err) {
        console.error("Failed to load magazine images", err);
      } finally {
        setLoading(false);
      }
    }
    loadImages();
  }, []);

  // Autoplay handler
  useEffect(() => {
    if (isPlaying && images.length > 0) {
      autoplayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 3500);
    } else {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    }
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isPlaying, images.length]);

  const handleNext = () => {
    if (images.length === 0) return;
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, isFullscreen]);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-zinc-950 rounded-3xl border border-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
          <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Loading Magazine...</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  // Format index helper
  const formatIndex = (index: number) => {
    return String(index + 1).padStart(2, "0");
  };

  return (
    <div ref={containerRef} className={`w-full flex flex-col justify-between overflow-hidden relative transition-all duration-700 ${
      isFullscreen 
        ? "fixed inset-0 z-50 bg-black p-6" 
        : "h-[680px] md:h-[800px] rounded-3xl border border-zinc-200/50 dark:border-white/5 bg-[#faf9f6] dark:bg-[#0a0a0a] shadow-2xl"
    }`}>
      
      {/* Top Bar controls */}
      <div className="w-full flex items-center justify-between px-6 py-4 border-b border-zinc-200/50 dark:border-white/5 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-lime-600 dark:text-lime-400" />
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
              Runway Publication
            </h4>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              TCS MAGAZINE <span className="text-lime-600 dark:text-lime-400 ml-1">/ VOL. I</span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all active:scale-95"
            title={isPlaying ? "Pause Autoplay" : "Start Autoplay"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowGridView(true)}
            className="p-2.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all active:scale-95 flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider"
            title="All Pages Grid"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">Pages</span>
          </button>

          <a
            href={images[currentIndex]}
            download={`TCS_Magazine_Page_${currentIndex + 1}.png`}
            className="p-2.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all active:scale-95"
            title="Download Page"
            target="_blank"
            rel="noreferrer"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all active:scale-95"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-grow flex items-center justify-center p-4 md:p-8 relative">
        {/* Decorative shadow effects */}
        <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-black/10 dark:to-black/60" />

        {/* Page Slider Frame */}
        <div className="relative w-full max-w-[480px] aspect-[4/5] max-h-[500px] md:max-h-[580px] shadow-2xl rounded-2xl overflow-hidden group select-none border border-zinc-300/40 dark:border-white/5">
          {/* Magazine Spine Overlay Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-8 z-20 pointer-events-none bg-gradient-to-r from-black/25 via-black/5 to-transparent" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="w-full h-full relative bg-zinc-900"
            >
              <Image
                src={images[currentIndex]}
                alt={`TCS Magazine - Page ${currentIndex + 1}`}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </motion.div>
          </AnimatePresence>

          {/* Quick Hover Navigation Overlays */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 z-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 z-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer controls: Scrubber + Counter */}
      <div className="w-full flex flex-col gap-4 px-6 py-5 border-t border-zinc-200/50 dark:border-white/5 z-10 bg-[#faf9f6]/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md">
        {/* Page Tracker */}
        <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
          <span>PAGE {formatIndex(currentIndex)}</span>
          <span className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-[10px]">
            {currentIndex === 0 ? "Cover Story" : currentIndex === images.length - 1 ? "Back Cover" : "Runway Feature"}
          </span>
          <span>{formatIndex(images.length - 1)} TOTAL</span>
        </div>

        {/* Page Scrubber Range Input */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="0"
            max={images.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(parseInt(e.target.value));
            }}
            className="flex-grow accent-lime-600 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 cursor-pointer"
          />

          <button
            onClick={handleNext}
            className="p-2 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Grid Overlay Modal */}
      <AnimatePresence>
        {showGridView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
              <div className="flex items-center gap-2 text-white">
                <Grid className="w-5 h-5 text-lime-400" />
                <span className="font-black uppercase tracking-widest text-sm">All Pages ({images.length})</span>
              </div>
              <button
                onClick={() => setShowGridView(false)}
                className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Scroll Area */}
            <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 pb-6">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowGridView(false);
                    }}
                    className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 group text-left ${
                      idx === currentIndex 
                        ? "border-lime-500 shadow-lg shadow-lime-500/10" 
                        : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Page ${idx + 1}`}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end p-2.5">
                      <span className="text-[10px] font-black text-white bg-black/80 px-2 py-0.5 rounded">
                        Page {formatIndex(idx)}
                      </span>
                    </div>
                    {/* Corner Page Marker */}
                    <div className="absolute top-2 right-2 text-[9px] font-black text-white bg-black/80 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
