"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navigation } from "./components/Navigation";
import { ProductGrid } from "./components/ProductGrid";
import { Footer } from "./components/Footer";
import { DiscountPopup } from "./components/DiscountPopup";
import { MobileLogoTop } from "./components/MobileLogoTop";
import { useHomeMode } from "./context/HomeModeContext";
import { useCurrency } from "./context/CurrencyContext";
import { CategoryCards } from "./components/CategoryCards";
import CustomCostumesPage from "./custom-costumes/page";

export default function Home() {
  const { currency, setCurrency } = useCurrency();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState("adults");
  const { mode, setMode, isHydrated } = useHomeMode();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Read category from URL params
    const categoryParam = searchParams.get("category");
    if (categoryParam && (categoryParam === "adults" || categoryParam === "kids" || categoryParam === "custom")) {
      setCategory(categoryParam);
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

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col animate-in fade-in duration-500">
      {/* Mobile Logo Top - Part of page content, no background */}
      <MobileLogoTop />

      {/* Navigation - Already has integrated fixed header with hide-on-scroll */}
      <Navigation 
        category={category}
        onCategoryChange={setCategory}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Discount Popup */}
      <DiscountPopup intervalMinutes={7} />

      {/* Category Cards - Mobile Only */}
      <CategoryCards 
        currentCategory={category}
        onCategoryChange={setCategory}
      />

      {/* Main Content - Add padding for both mobile and desktop headers */}
      <div className="pt-4 md:pt-20">
        {/* Premium Banner Card - Desktop Only */}
        <section className="hidden md:block mx-auto w-full max-w-7xl px-4 md:px-6 py-0 md:py-8">
        <div className="bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 border border-lime-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="relative px-6 md:px-10 py-8 md:py-10">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime-200 opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-200 opacity-10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-lime-300/40">
                <span className="text-base">🎭</span>
                <span className="text-xs font-bold text-lime-700 uppercase tracking-wide">Premium Costumes</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-3 leading-tight">
                Costume Makers in <span className="bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">Lagos</span>
              </h2>
              
              <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-2xl">
                Premium quality costumes for rent and sale. Fast delivery and affordable prices for every occasion.
              </p>
            </div>
          </div>
        </div>
      </section>

        {/* Hero Section with SEO Content */}
        <section className="hidden bg-gradient-to-r from-lime-50 to-green-50 py-12 md:py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Premium Costumes for Every Occasion in Lagos
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              EMPI is Lagos's leading costume maker, offering high-quality adult and kids costumes for rent and sale. 
              Perfect for parties, events, themed celebrations, and special occasions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="inline-block bg-lime-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                ✓ Professional Quality
              </span>
              <span className="inline-block bg-lime-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                ✓ Fast Delivery
              </span>
              <span className="inline-block bg-lime-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                ✓ Affordable Prices
              </span>
            </div>
          </div>
        </section>

        {/* Custom Costumes CTA Section */}
        {/* Main Content */}
        <ProductGrid currency={currency} category={category} mode={mode} onModeChange={setMode} />

        {/* SEO Text Section */}
        <section className="hidden bg-gray-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose EMPI Costumes?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Lagos's Top Costume Maker</h3>
                <p className="text-gray-700 mb-4">
                  EMPI is the most trusted costume maker in Lagos, Nigeria. With years of experience in creating 
                  and renting quality costumes, we serve thousands of satisfied customers across Lagos.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Wide Selection</h3>
                <p className="text-gray-700 mb-4">
                  From adult party costumes to kids themed costumes, we have everything you need for any occasion. 
                  Our collection includes traditional, modern, and themed costumes for all ages.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Affordable Rental & Sales</h3>
                <p className="text-gray-700 mb-4">
                  Looking to rent or buy? EMPI offers flexible options. Whether you need a costume for one night 
                  or want to purchase quality pieces, we have competitive prices in Lagos.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Fast & Reliable Service</h3>
                <p className="text-gray-700 mb-4">
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
