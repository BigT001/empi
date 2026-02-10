"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Navigation } from "./components/Navigation";
import { MobileHeader } from "./components/MobileHeader";
import { ProductGrid } from "./components/ProductGrid";
import { Footer } from "./components/Footer";
import { DiscountPopup } from "./components/DiscountPopup";
import { HeroSection } from "./components/HeroSection";
// import { BrandsSection } from "./components/BrandsSection";
import { useHomeMode } from "./context/HomeModeContext";
import { useCurrency } from "./context/CurrencyContext";
import CustomCostumesPage from "./custom-costumes/page";
import { useTheme } from "./context/ThemeContext";

export default function Home() {
  const { currency, setCurrency } = useCurrency();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState("adults");
  const [searchQuery, setSearchQuery] = useState("");
  const { mode, setMode, isHydrated } = useHomeMode();
  const { theme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;

    // Read category and search query from URL params
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("q");

    if (categoryParam && (categoryParam === "adults" || categoryParam === "kids" || categoryParam === "custom")) {
      setCategory(categoryParam);
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // If custom is selected, show the custom costumes page instead
  if (category === "custom") {
    return (
      <div className="animate-in fade-in duration-500">
        <CustomCostumesPage
          category={category}
          onCategoryChange={setCategory}
          currency={currency}
          onCurrencyChange={setCurrency}
        />
      </div>
    );
  }

  // Only render when hydrated to prevent hydration mismatch
  if (!isHydrated || !isClient) {
    return null;
  }

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'
      }`}>
      {/* Desktop Navigation */}
      <Navigation
        category={category}
        onCategoryChange={setCategory}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Mobile Header - Replaces old mobile logo and provides full header navigation */}
      <MobileHeader
        category={category}
        onCategoryChange={setCategory}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      <HeroSection />

      {/* Brands/Partners Section */}
      {/* <BrandsSection /> */}

      {/* Discount Popup */}
      <DiscountPopup intervalMinutes={7} />

      {/* Main Content - Add padding for both mobile and desktop headers */}
      <div className="pt-20 md:pt-24">
        {/* Main Content */}
        <div id="product-grid">
          <ProductGrid currency={currency} category={category} mode={mode} onModeChange={setMode} searchQuery={searchQuery} />
        </div>

        {/* SEO Text Section */}
        <section className={`py-12 px-4 transition-colors duration-1000 ${theme === 'dark' ? 'bg-black/40' : 'bg-gray-50'
          }`}>
          <div className="max-w-4xl mx-auto">
            <h2 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Why Choose EMPI Costumes?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-lime-400' : 'text-gray-800'}`}>Lagos&apos;s Top Costume Maker</h3>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-4`}>
                  EMPI is the most trusted costume maker in Lagos, Nigeria. With years of experience in creating
                  and renting quality costumes, we serve thousands of satisfied customers across Lagos.
                </p>
              </div>
              <div>
                <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-lime-400' : 'text-gray-800'}`}>Wide Selection</h3>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-4`}>
                  From adult party costumes to kids themed costumes, we have everything you need for any occasion.
                  Our collection includes traditional, modern, and themed costumes for all ages.
                </p>
              </div>
              <div>
                <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-lime-400' : 'text-gray-800'}`}>Affordable Rental & Sales</h3>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-4`}>
                  Looking to rent or buy? EMPI offers flexible options. Whether you need a costume for one night
                  or want to purchase quality pieces, we have competitive prices in Lagos.
                </p>
              </div>
              <div>
                <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-lime-400' : 'text-gray-800'}`}>Fast & Reliable Service</h3>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} mb-4`}>
                  We understand your time matters. Our fast delivery service ensures you get your costumes on time.
                  Serving all areas of Lagos with professional service and care.
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
