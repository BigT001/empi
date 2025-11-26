"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { ProductGrid } from "./components/ProductGrid";
import { Footer } from "./components/Footer";
import { DiscountPopup } from "./components/DiscountPopup";
import { useHomeMode } from "./context/HomeModeContext";
import { useCurrency } from "./context/CurrencyContext";
import CustomCostumesPage from "./custom-costumes/page";

export default function Home() {
  const { currency, setCurrency } = useCurrency();
  const [category, setCategory] = useState("adults");
  const { mode, setMode, isHydrated } = useHomeMode();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col animate-in fade-in duration-500">
      {/* Discount Popup */}
      <DiscountPopup intervalMinutes={7} />

      {/* Header with Logo and Navigation */}
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          {/* Logo - from Header */}
          <Header />
          
          {/* Navigation */}
          <nav className="flex items-center flex-1">
            <Navigation 
              category={category}
              onCategoryChange={setCategory}
              currency={currency}
              onCurrencyChange={setCurrency}
              mode={mode}
              onModeChange={setMode}
            />
          </nav>
        </div>
      </header>

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

      {/* Footer */}
      <Footer />
    </div>
  );
}
