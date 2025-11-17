"use client";

import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { useState } from "react";
import Link from "next/link";

export default function About() {
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");

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
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">About EMPI</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're dedicated to providing the finest quality costumes for every occasion, from elegant adult wear to delightful kids' outfits.
            </p>
          </section>

          {/* Our Mission */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              At EMPI, our mission is to make quality costumes accessible to everyone. We believe that every occasion deserves the perfect outfit, whether it's a celebration, costume party, or special event. We're committed to offering a diverse range of styles, sizes, and price points to suit all preferences and budgets.
            </p>
          </section>

          {/* Our Values */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-lime-50 rounded-lg border border-lime-200">
                <h3 className="text-lg font-semibold text-lime-700 mb-2">Quality</h3>
                <p className="text-gray-700">We ensure every costume meets our high standards for durability, fit, and appearance.</p>
              </div>
              <div className="p-6 bg-lime-50 rounded-lg border border-lime-200">
                <h3 className="text-lg font-semibold text-lime-700 mb-2">Affordability</h3>
                <p className="text-gray-700">Premium costumes shouldn't break the bank. We offer competitive pricing and multi-currency support.</p>
              </div>
              <div className="p-6 bg-lime-50 rounded-lg border border-lime-200">
                <h3 className="text-lg font-semibold text-lime-700 mb-2">Variety</h3>
                <p className="text-gray-700">From classic styles to trendy designs, we have something for everyone's taste and occasion.</p>
              </div>
              <div className="p-6 bg-lime-50 rounded-lg border border-lime-200">
                <h3 className="text-lg font-semibold text-lime-700 mb-2">Customer Service</h3>
                <p className="text-gray-700">Your satisfaction is our priority. We're here to help you find the perfect costume.</p>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Why Choose EMPI?</h2>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <span className="text-lime-600 font-bold">✓</span>
                <span className="text-gray-700">Curated collection of premium costumes for adults and kids</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-lime-600 font-bold">✓</span>
                <span className="text-gray-700">Multi-currency support (NGN, USD, EUR, GBP, and more)</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-lime-600 font-bold">✓</span>
                <span className="text-gray-700">Fast and reliable shipping</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-lime-600 font-bold">✓</span>
                <span className="text-gray-700">Easy returns and exchanges</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-lime-600 font-bold">✓</span>
                <span className="text-gray-700">Secure checkout process</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-lime-600 font-bold">✓</span>
                <span className="text-gray-700">Dedicated customer support team</span>
              </li>
            </ul>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-lime-50 to-lime-100 rounded-lg p-8 text-center space-y-4 border border-lime-200">
            <h2 className="text-2xl font-bold text-gray-900">Ready to Find Your Perfect Costume?</h2>
            <p className="text-gray-700">Browse our collection and discover amazing styles for every occasion.</p>
            <Link 
              href="/" 
              className="inline-block bg-lime-600 hover:bg-lime-700 text-white font-semibold px-8 py-3 rounded-lg transition"
            >
              Shop Now
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
