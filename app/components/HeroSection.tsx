"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react";

const HERO_IMAGES = [
  "/empiimages/IMG_0729.JPG",
  "/empiimages/IMG_0732.JPG",
  "/empiimages/IMG_0734.JPG",
  "/empiimages/IMG_0793.JPG",
  "/empiimages/IMG_0794.JPG",
  "/empiimages/IMG_1216.JPG",
  "/empiimages/IMG_1217.JPG",
  "/empiimages/IMG_9345.JPG",
  "/empiimages/IMG_9906.JPG",
  "/empiimages/5A024C20-1DD3-43CF-988E-363834FB5D30.JPG",
  "/empiimages/d7376ba7-6379-410e-bd4a-627a6e521ffc.JPG",
  "/empiimages/copy_7979C370-B7E7-4284-816A-EAE4E6A18D90.JPEG",
];

const SLIDE_TEXTS = [
  {
    title: "Mastering the Art",
    subtitle: "of Costume Design",
    description: "Crafting Excellence in Lagos Since Day One",
    accent: "Award Winning",
  },
  {
    title: "Premium Quality",
    subtitle: "Uncompromised Artistry",
    description: "Every stitch tells a story of perfection and cultural heritage",
    accent: "Handcrafted",
  },
  {
    title: "Bespoke Creation",
    subtitle: "Tailored to You",
    description: "Your imagination, our creation. Made for your most special moments",
    accent: "Unlimited Customization",
  },
  {
    title: "Exceptional Details",
    subtitle: "Precision in Every Piece",
    description: "A blend of traditional techniques and modern aesthetics",
    accent: "Eco-Friendly Fabrics",
  },
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDE_TEXTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoplay]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDE_TEXTS.length);
    setIsAutoplay(false);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDE_TEXTS.length) % SLIDE_TEXTS.length);
    setIsAutoplay(false);
  }, []);

  const currentText = SLIDE_TEXTS[currentIndex];
  const currentImage = HERO_IMAGES[currentIndex % HERO_IMAGES.length];

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden bg-black flex items-center justify-center">
      {/* Background Images Layer */}
      {SLIDE_TEXTS.map((_, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
        >
          {/* Main Image - Positioned to show top portion */}
          <div className="absolute inset-0 scale-110 animate-[parallax-bg_30s_linear_infinite_alternate]">
            <Image
              src={HERO_IMAGES[index % HERO_IMAGES.length]}
              alt="Hero background"
              fill
              className="object-cover object-top"
              priority={index === 0}
            />
          </div>
          {/* Cinematic Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />
        </div>
      ))}

      {/* Decorative Floating Elements (Premium Feel) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-lime-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Main Content Container - Increased z-index to be on top of all overlays */}
      <div className="relative z-50 container mx-auto px-6 h-full flex flex-col justify-center">
        <div className="max-w-4xl">
          {/* Accent Label */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-500/20 border border-lime-400/30 text-lime-400 text-xs font-bold uppercase tracking-widest mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            {currentText.accent}
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-2 mb-8">
            <h1 className={`text-4xl md:text-7xl font-black text-white leading-tight transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <span className="block">{currentText.title}</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 drop-shadow-[0_0_15px_rgba(132,204,22,0.3)]">
                {currentText.subtitle}
              </span>
            </h1>
          </div>

          {/* Description */}
          <p className={`text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {currentText.description}
          </p>

          {/* Action Buttons - Ensure higher z-index and relative positioning */}
          <div className={`relative z-50 flex flex-row md:flex-wrap gap-3 md:gap-4 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link
              href="/custom-costumes"
              className="group relative flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-full overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(132,204,22,0.4)] hover:shadow-[0_0_30px_rgba(132,204,22,0.6)] flex items-center justify-center gap-2 text-xs md:text-base whitespace-nowrap cursor-pointer"
            >
              <span className="relative z-10">Start Custom Order</span>
              <ArrowRight className="hidden md:block w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>

            <button
              onClick={() => {
                const productGrid = document.getElementById('product-grid');
                if (productGrid) {
                  productGrid.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group relative flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold rounded-full backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 text-xs md:text-base whitespace-nowrap cursor-pointer"
            >
              <span className="relative z-10">Explore Collection</span>
              <Play className="hidden md:block w-4 h-4 fill-white relative z-10" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-40">
        <div
          key={currentIndex}
          className="h-full bg-lime-500 animate-[progress_8s_linear_forwards]"
          style={{ width: isAutoplay ? '100%' : '0%' }}
        />
      </div>

      {/* Slide Indicators (Simplified) */}
      <div className="absolute left-12 bottom-24 md:bottom-32 z-40 flex flex-col gap-4">
        {SLIDE_TEXTS.map((_, index) => (
          <button
            key={index}
            onClick={() => { setCurrentIndex(index); setIsAutoplay(false); }}
            className="flex items-center gap-4 group"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div className={`h-[2px] transition-all duration-500 ${index === currentIndex ? 'w-12 bg-lime-500' : 'w-4 bg-white/30 group-hover:w-8 group-hover:bg-white/60'}`} />
          </button>
        ))}
      </div>

      {/* Features / Why Choose Us Section (Visible on all devices) */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-32 pb-8 md:pb-12 z-40">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: "✨", label: "Premium Craft", desc: "Unmatched quality" },
              { icon: "🎭", label: "Bespoke Design", desc: "Tailored to you" },
              { icon: "🚀", label: "Global Shipping", desc: "To your doorstep" },
              { icon: "🛡️", label: "Secure Payment", desc: "Safe transactions" },
            ].map((feature, i) => (
              <div key={i} className="group border-l border-white/10 pl-4 md:pl-6 hover:border-lime-500 transition-colors duration-500">
                <div className="text-xl md:text-2xl mb-1 md:mb-2 grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-110">{feature.icon}</div>
                <h3 className="text-white font-bold text-xs md:text-sm mb-0.5 md:mb-1">{feature.label}</h3>
                <p className="text-white/40 text-[10px] md:text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
