"use client";

import { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
import { ProductGrid } from "../components/ProductGrid";
import { Footer } from "../components/Footer";
import { DiscountPopup } from "../components/DiscountPopup";
import { useHomeMode } from "../context/HomeModeContext";
import { useCurrency } from "../context/CurrencyContext";
import { MobileHeader } from "../components/MobileHeader";

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
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0a0a0a] dark:text-white flex flex-col animate-in fade-in duration-500">
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

      {/* Main Content - Padding adjusted to clear fixed headers */}
      <div className="pt-24 md:pt-36 max-w-7xl mx-auto px-4 md:px-6 w-full flex-grow">
        <DiscountPopup intervalMinutes={7} />
        <ProductGrid
          currency={currency}
          category="all"
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
