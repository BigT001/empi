"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "../components/Navigation";
import { ProductGrid } from "../components/ProductGrid";
import { Footer } from "../components/Footer";
import { DiscountPopup } from "../components/DiscountPopup";
import { useHomeMode } from "../context/HomeModeContext";
import { useCurrency } from "../context/CurrencyContext";

export default function KidsPage() {
  const { currency, setCurrency } = useCurrency();
  const { mode, setMode, isHydrated } = useHomeMode();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render when hydrated to prevent hydration mismatch
  if (!isHydrated || !isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col animate-in fade-in duration-500">
      {/* Navigation */}
      <Navigation 
        category="kids"
        onCategoryChange={() => {}}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Discount Popup */}
      <DiscountPopup intervalMinutes={7} />

      {/* Main Content - Add padding for both mobile and desktop headers */}
      <div className="pt-20 md:pt-32">
        {/* Premium Banner Card - Polished, Compact */}
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border border-pink-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="relative px-6 md:px-10 py-8 md:py-10">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200 opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-200 opacity-10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-pink-300/40">
                  <span className="text-base">👶</span>
                  <span className="text-xs font-bold text-pink-700 uppercase tracking-wide">Kids Costumes</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-3 leading-tight">
                  Fun & Colorful Costumes for <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Kids</span>
                </h2>
                
                <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-2xl">
                  Make your child's special day unforgettable with our vibrant and creative kids costumes. Perfect for parties, events, and celebrations in Lagos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <ProductGrid currency={currency} category="kids" mode={mode} onModeChange={setMode} />

        {/* SEO Text Section */}
        <section className="hidden bg-gray-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Kids Costumes in Lagos</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Fun for Every Child</h3>
                <p className="text-gray-700 mb-4">
                  Our kids costume collection features fun, colorful, and creative designs perfect for every age. 
                  From superheroes to fairy tales, we have something for every imagination.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Safe & Comfortable</h3>
                <p className="text-gray-700 mb-4">
                  All our kids costumes are made with safety and comfort in mind. High-quality materials ensure 
                  your child stays comfortable throughout their special day.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Affordable Prices</h3>
                <p className="text-gray-700 mb-4">
                  We offer competitive rental and purchase prices for kids costumes in Lagos. 
                  Quality doesn't have to break the bank.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Fast Delivery</h3>
                <p className="text-gray-700 mb-4">
                  Need a costume quickly? We offer fast delivery across Lagos so your child's special day 
                  is never delayed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
