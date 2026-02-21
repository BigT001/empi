"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "../components/Navigation";
import { ProductGrid } from "../components/ProductGrid";
import { Footer } from "../components/Footer";
import { DiscountPopup } from "../components/DiscountPopup";
import { useHomeMode } from "../context/HomeModeContext";
import { useCurrency } from "../context/CurrencyContext";
import { CategoryCards } from "../components/CategoryCards";
import { MobileLogoTop } from "../components/MobileLogoTop";
import { MobileHeader } from "../components/MobileHeader";
import { ScrollReveal } from "../components/ScrollReveal";

export default function ShopPage() {
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
      {/* Navigation Layer */}
      <Navigation
        category="all"
        onCategoryChange={() => { }}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      <MobileHeader
        category="all"
        onCategoryChange={() => { }}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Main Content - Substantial padding for mobile to clear fixed headers */}
      <div className="pt-28 md:pt-20">
        <ScrollReveal>
          {/* Gallery Header */}
          <section className="mx-auto w-full max-w-7xl px-6 pt-4 pb-0 md:py-20 text-center">
            <div className="inline-flex items-center gap-3 mb-4 md:mb-6 px-4 md:px-5 py-1.5 md:py-2 bg-slate-100 dark:bg-zinc-900 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-lime-500 animate-pulse"></span>
              The Full Gallery
            </div>
            <h1 className="text-4xl md:text-8xl font-black text-slate-900 dark:text-white mb-2 md:mb-8 font-playfair leading-[1.1]">
              Curated <span className="text-lime-600 italic">Excellence.</span>
            </h1>
          </section>
        </ScrollReveal>


        {/* Product Grid Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-slate-200 flex-grow" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Gallery Collection</span>
            <div className="h-px bg-slate-200 flex-grow" />
          </div>
          <ProductGrid currency={currency} category="all" mode={mode} onModeChange={setMode} />
        </div>


      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
