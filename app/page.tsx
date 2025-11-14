"use client";

import { useState } from "react";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { ProductGrid } from "./components/ProductGrid";
import { Footer } from "./components/Footer";

export default function Home() {
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");
  const [mode, setMode] = useState("buy");

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
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
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <ProductGrid currency={currency} category={category} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
