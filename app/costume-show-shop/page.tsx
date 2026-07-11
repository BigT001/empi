"use client";

import { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
import { ProductGrid } from "../components/ProductGrid";
import { Footer } from "../components/Footer";
import { DiscountPopup } from "../components/DiscountPopup";
import { useHomeMode } from "../context/HomeModeContext";
import { useCurrency } from "../context/CurrencyContext";
import { MobileHeader } from "../components/MobileHeader";
import { Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function CostumeShowShopPage() {
  const { currency, setCurrency } = useCurrency();
  const { mode, setMode, isHydrated } = useHomeMode();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render when hydrated to prevent hydration mismatch
  if (!isHydrated || !isClient) {
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col animate-in fade-in duration-500 transition-colors duration-500 ${
      isDark ? 'bg-[#050505] text-white' : 'bg-[#FAF9F5] text-neutral-900'
    }`}>
      {/* Navigation Layer */}
      <Navigation
        category="costume-show"
        onCategoryChange={() => { }}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      <MobileHeader
        category="costume-show"
        onCategoryChange={() => { }}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Main Content - Dynamic Costume Show 2026 header and product list */}
      <div className="pt-28 md:pt-40 max-w-7xl mx-auto px-4 md:px-6 w-full flex-grow">
        <DiscountPopup intervalMinutes={7} />
        
        {/* Banner Section */}
        <div className="mb-12 text-center py-6">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.25em] mb-4 ${
            isDark ? 'bg-white/5 border-white/10 text-lime-400' : 'bg-black/5 border-black/10 text-lime-600'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            Limited Special Edition
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3 font-playfair">
            THE COSTUME SHOW 2026
          </h1>
          <p className={`text-xs md:text-sm max-w-xl mx-auto leading-relaxed ${
            isDark ? 'text-gray-400' : 'text-neutral-600'
          }`}>
            Discover the exclusive, hand-crafted showpieces designed specifically for the runway. These limited-edition items embody visual storytelling, premium craftsmanship, and artistic expression.
          </p>
        </div>

        {/* Specialized Costume Show Products Grid */}
        <ProductGrid
          currency={currency}
          category="costume-show"
          mode={mode}
          onModeChange={setMode}
          hideHeader={true}
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
