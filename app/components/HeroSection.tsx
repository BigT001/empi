"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

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
    title: "Costume Makers",
    subtitle: "in Lagos",
    description: "Crafting Excellence Since Day One",
  },
  {
    title: "Premium Quality",
    subtitle: "Uncompromised",
    description: "Every stitch tells a story of perfection",
  },
  {
    title: "Bespoke Designs",
    subtitle: "For You",
    description: "Your imagination, our creation",
  },
  {
    title: "Exceptional Craftsmanship",
    subtitle: "Every Detail",
    description: "Precision in every costume we create",
  },
  {
    title: "Transform Moments",
    subtitle: "Into Memories",
    description: "Make your special occasions unforgettable",
  },
  {
    title: "Creative Excellence",
    subtitle: "Always",
    description: "Where passion meets artistry",
  },
  {
    title: "Festival Ready",
    subtitle: "Costumes",
    description: "Stand out at every celebration",
  },
  {
    title: "Custom Tailored",
    subtitle: "Just For You",
    description: "Personalized designs for unique tastes",
  },
  {
    title: "Quality Assured",
    subtitle: "Every Time",
    description: "Excellence is our standard",
  },
  {
    title: "Express Yourself",
    subtitle: "In Style",
    description: "Be bold, be confident, be YOU",
  },
  {
    title: "Event Perfect",
    subtitle: "Costumes",
    description: "Make your occasions unforgettable",
  },
  {
    title: "Celebrate Life",
    subtitle: "In Color",
    description: "Create memories that last forever",
  },
];

export function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoplay) return;

    const interval = setInterval(() => {
      setDirection("next");
      // On mobile: advance by 1 image at a time, on desktop: advance by 2 images
      const increment = isMobile ? 1 : 2;
      setCurrentImageIndex((prev) => (prev + increment) % HERO_IMAGES.length);
    }, 6000); // Change image every 6 seconds

    return () => clearInterval(interval);
  }, [isAutoplay, isMobile]);

  const goToSlide = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setIsAutoplay(false);
    // Resume autoplay after 12 seconds of user interaction
    const timeout = setTimeout(() => setIsAutoplay(true), 12000);
    return () => clearTimeout(timeout);
  }, []);

  const nextSlide = useCallback(() => {
    setDirection("next");
    const increment = isMobile ? 1 : 2;
    setCurrentImageIndex((prev) => (prev + increment) % HERO_IMAGES.length);
    setIsAutoplay(false);
    const timeout = setTimeout(() => setIsAutoplay(true), 12000);
    return () => clearTimeout(timeout);
  }, [isMobile]);

  const prevSlide = useCallback(() => {
    setDirection("prev");
    const increment = isMobile ? 1 : 2;
    setCurrentImageIndex((prev) => (prev - increment + HERO_IMAGES.length) % HERO_IMAGES.length);
    setIsAutoplay(false);
    const timeout = setTimeout(() => setIsAutoplay(true), 12000);
    return () => clearTimeout(timeout);
  }, [isMobile]);

  // Get current and next images for side-by-side display on large screens
  const currentImage = HERO_IMAGES[currentImageIndex];
  const nextImage = HERO_IMAGES[(currentImageIndex + 1) % HERO_IMAGES.length];

  return (
    <section className="relative w-full md:h-screen h-screen pt-28 md:pt-28 overflow-hidden bg-black">
      {/* Image Carousel - Side by Side on Large Screens */}
      <div className="relative w-full h-full">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 z-5" />

        {/* Text Overlay with Animations */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
          <div className="text-center max-w-4xl">
            {/* Accent badge */}
            <div className="mb-6 opacity-0 animate-in fade-in duration-700">
              <span className="inline-block px-4 py-2 bg-lime-500/30 border border-lime-400 rounded-full text-xs md:text-sm font-bold text-lime-300 backdrop-blur-sm shadow-lg shadow-lime-500/20">
                ✨ Crafted with Excellence
              </span>
            </div>

            {/* Main Title */}
            <h1 
              key={`title-${Math.floor(currentImageIndex / 2)}`}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl tracking-wide leading-tight animate-in fade-in zoom-in-50 duration-700 uppercase"
              style={{
                textShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.6)'
              }}
            >
              {SLIDE_TEXTS[Math.floor(currentImageIndex / 2) % SLIDE_TEXTS.length]?.title || "Costume Makers"}
            </h1>

            {/* Subtitle */}
            <div className="mt-3 md:mt-4 overflow-hidden">
              <p 
                key={`subtitle-${Math.floor(currentImageIndex / 2)}`}
                className="text-xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 tracking-widest uppercase font-black"
                style={{
                  textShadow: '0 4px 25px rgba(132, 204, 22, 0.6)'
                }}
              >
                {SLIDE_TEXTS[Math.floor(currentImageIndex / 2) % SLIDE_TEXTS.length]?.subtitle || "in Lagos"}
              </p>
            </div>

            {/* Gradient line divider */}
            <div className="mt-6 md:mt-8 flex justify-center opacity-0 animate-in fade-in duration-700 delay-200">
              <div className="h-1 w-16 bg-gradient-to-r from-lime-400/30 via-lime-400 to-lime-400/30 rounded-full shadow-lg shadow-lime-400/50" />
            </div>

            {/* Description text */}
            <p 
              key={`desc-${Math.floor(currentImageIndex / 2)}`}
              className="text-sm md:text-base lg:text-lg text-white font-light mt-5 md:mt-6 max-w-2xl mx-auto leading-relaxed opacity-0 animate-in fade-in duration-700 delay-300"
              style={{
                textShadow: '0 2px 15px rgba(0, 0, 0, 0.8)'
              }}
            >
              {SLIDE_TEXTS[Math.floor(currentImageIndex / 2) % SLIDE_TEXTS.length]?.description || "Experience the art of costume making"}
            </p>

            {/* Bottom decorative dots */}
            <div className="mt-8 md:mt-10 flex justify-center gap-2 opacity-0 animate-in fade-in duration-700 delay-500">
              <div className="w-1.5 h-1.5 rounded-full bg-lime-400/60 shadow-md shadow-lime-400/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-lime-400 shadow-md shadow-lime-400/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-lime-400/60 shadow-md shadow-lime-400/40" />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet - Single Image */}
        <div className="lg:hidden absolute inset-0 flex items-center justify-center overflow-hidden">
          {HERO_IMAGES.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-all duration-1200 ease-out ${
                index === currentImageIndex
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-105"
              }`}
              style={{
                transform: index === currentImageIndex
                  ? "translateX(0) scale(1)"
                  : direction === "next"
                  ? "translateX(100%) scale(1.05)"
                  : "translateX(-100%) scale(1.05)",
              }}
            >
              <Image
                src={image}
                alt={`Hero slide ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
            </div>
          ))}
        </div>

        {/* Desktop - Two Images Side by Side */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-center overflow-hidden gap-4 px-4">
          {/* Left Image */}
          <div className="relative w-1/2 h-full overflow-hidden rounded-xl shadow-2xl">
            {HERO_IMAGES.map((image, index) => (
              <div
                key={`left-${image}`}
                className={`absolute inset-0 transition-all duration-1200 ease-out ${
                  index === currentImageIndex ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transform: index === currentImageIndex
                    ? "translateX(0) scale(1)"
                    : direction === "next"
                    ? "translateX(100%) scale(1.08)"
                    : "translateX(-100%) scale(1.08)",
                }}
              >
                <Image
                  src={image}
                  alt={`Hero left ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(min-width: 1024px) 50vw"
                />
              </div>
            ))}
          </div>

          {/* Right Image */}
          <div className="relative w-1/2 h-full overflow-hidden rounded-xl shadow-2xl">
            {HERO_IMAGES.map((image, index) => (
              <div
                key={`right-${image}`}
                className={`absolute inset-0 transition-all duration-1200 ease-out ${
                  index === (currentImageIndex + 1) % HERO_IMAGES.length
                    ? "opacity-100"
                    : "opacity-0"
                }`}
                style={{
                  transform:
                    index === (currentImageIndex + 1) % HERO_IMAGES.length
                      ? "translateX(0) scale(1)"
                      : direction === "next"
                      ? "translateX(100%) scale(1.08)"
                      : "translateX(-100%) scale(1.08)",
                }}
              >
                <Image
                  src={image}
                  alt={`Hero right ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(min-width: 1024px) 50vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {/* Dots Indicator - Premium Style */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 p-3 bg-black/20 backdrop-blur-md rounded-full border border-white/20">
          {Array.from({ length: Math.ceil(HERO_IMAGES.length / 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index * 2)}
              className={`transition-all duration-500 rounded-full cursor-pointer ${
                index * 2 === currentImageIndex
                  ? "bg-lime-500 w-8 h-2.5 shadow-lg shadow-lime-500/50"
                  : "bg-white/40 hover:bg-white/60 w-2.5 h-2.5 hover:w-3"
              }`}
              aria-label={`Go to slide pair ${index + 1}`}
            />
          ))}
        </div>

        {/* Slide Counter - Cinema Style */}
        <div className="absolute top-8 right-8 z-20 text-white/70 text-sm font-medium backdrop-blur-md bg-black/40 px-5 py-2 rounded-full border border-white/20">
          {Math.floor(currentImageIndex / 2) + 1} / {Math.ceil(HERO_IMAGES.length / 2)}
        </div>
      </div>

      {/* Content Section Below Images */}
      <div className="relative w-full bg-gradient-to-b from-black/80 to-black py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Headline */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Celebrate in <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">Style</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
              Discover our exquisite collection of premium costumes and bespoke fashion pieces, handcrafted for your most unforgettable moments
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Feature 1 */}
            <div className="text-center group hover:bg-white/5 p-6 rounded-lg transition-all duration-300">
              <div className="text-4xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">✨</div>
              <h3 className="text-xl font-semibold text-white mb-2">Premium Quality</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Carefully curated fabrics and meticulous craftsmanship in every piece
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group hover:bg-white/5 p-6 rounded-lg transition-all duration-300">
              <div className="text-4xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">🎭</div>
              <h3 className="text-xl font-semibold text-white mb-2">Unique Designs</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Exclusive collections you won't find anywhere else
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group hover:bg-white/5 p-6 rounded-lg transition-all duration-300">
              <div className="text-4xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">Fast Delivery</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Quick turnaround times without compromising quality
              </p>
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="text-center mt-16 pt-12 border-t border-white/10">
            <p className="text-gray-400 italic max-w-xl mx-auto">
              "Where every moment becomes a masterpiece"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
