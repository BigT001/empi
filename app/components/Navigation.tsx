"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, Heart, Menu, ShoppingCart, ChevronDown, Settings } from "lucide-react";
import { CURRENCY_RATES } from "./constants";

interface NavigationProps {
  category: string;
  onCategoryChange: (category: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export function Navigation({ category, onCategoryChange, currency, onCurrencyChange }: NavigationProps) {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between gap-8 flex-1">
      {/* Navigation */}
      <nav className="hidden gap-8 text-sm font-medium md:flex items-center">
        {/* Modern Animated Category Toggle Switch */}
        <div className="relative inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 rounded-full p-1 shadow-sm border border-gray-200">
          {/* Animated background slider */}
          <div
            className={`absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-lime-500 to-lime-600 shadow-lg transition-all duration-300 ease-out ${
              category === "adults" ? "left-1 right-1/2" : "left-1/2 right-1"
            }`}
          />

          {/* Adults Button */}
          <button
            onClick={() => onCategoryChange("adults")}
            className={`relative px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 z-10 ${
              category === "adults"
                ? "text-white drop-shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            👔 Adults
          </button>

          {/* Kids Button */}
          <button
            onClick={() => onCategoryChange("kids")}
            className={`relative px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 z-10 ${
              category === "kids"
                ? "text-white drop-shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            👶 Kids
          </button>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1 text-gray-700 hover:text-lime-600 transition"
          >
            Filter
            <ChevronDown className="h-4 w-4" />
          </button>
          {showFilterDropdown && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
              <button
                onClick={() => setShowFilterDropdown(false)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 transition"
              >
                Price: Low to High
              </button>
              <button
                onClick={() => setShowFilterDropdown(false)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 transition"
              >
                Price: High to Low
              </button>
              <button
                onClick={() => setShowFilterDropdown(false)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 transition"
              >
                Newest
              </button>
              <button
                onClick={() => setShowFilterDropdown(false)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 transition"
              >
                Most Popular
              </button>
            </div>
          )}
        </div>

        <Link href="/about" className="text-gray-700 hover:text-lime-600 transition">
          About Us
        </Link>
      </nav>

      {/* Search */}
      <div className="hidden flex-1 items-center max-w-xs lg:flex">
        <div className="relative w-full">
          <input
            aria-label="Search products"
            placeholder="Search costumes..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Currency Switcher */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 hover:border-lime-600 text-gray-700 hover:text-lime-600 text-sm font-medium transition"
          >
            {CURRENCY_RATES[currency].symbol}
            <span>{currency}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showCurrencyDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
              {Object.entries(CURRENCY_RATES).map(([code, data]) => (
                <button
                  key={code}
                  onClick={() => {
                    onCurrencyChange(code);
                    setShowCurrencyDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-lime-50 hover:text-lime-600 transition ${
                    currency === code ? "bg-lime-100 text-lime-600 font-semibold" : "text-gray-700"
                  }`}
                >
                  {data.symbol} {code} - {data.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="hidden p-2 text-gray-700 hover:text-lime-600 hover:bg-gray-100 rounded-lg transition md:flex">
          <Heart className="h-5 w-5" />
        </button>
        <Link href="/admin" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-lime-600 hover:text-lime-600 font-semibold transition">
          <Settings className="h-4 w-4" />
          <span className="text-sm">Admin</span>
        </Link>
        <button className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg font-medium transition">
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Cart</span>
        </button>
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-700 md:hidden hover:bg-gray-100 rounded-lg transition">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      </div>

      {/* Mobile Navigation Header */}
      <div className="md:hidden flex items-center justify-between gap-2 w-full">
        {/* Category Toggle for Mobile */}
        <div className="flex items-center gap-2 flex-1">
          {/* Modern Animated Category Toggle Switch - Small Version */}
          <div className="relative inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 rounded-full p-0.5 shadow-sm border border-gray-200">
            <div
              className={`absolute top-0.5 bottom-0.5 rounded-full bg-gradient-to-r from-lime-500 to-lime-600 shadow-lg transition-all duration-300 ease-out ${
                category === "adults" ? "left-0.5 right-1/2" : "left-1/2 right-0.5"
              }`}
            />
            <button
              onClick={() => onCategoryChange("adults")}
              className={`relative px-2.5 py-1 rounded-full font-bold text-xs transition-all duration-300 z-10 whitespace-nowrap ${
                category === "adults"
                  ? "text-white drop-shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              👔 Adults
            </button>
            <button
              onClick={() => onCategoryChange("kids")}
              className={`relative px-2.5 py-1 rounded-full font-bold text-xs transition-all duration-300 z-10 whitespace-nowrap ${
                category === "kids"
                  ? "text-white drop-shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              👶 Kids
            </button>
          </div>
        </div>

        {/* Cart Icon */}
        <button className="flex items-center justify-center p-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition flex-shrink-0">
          <ShoppingCart className="h-5 w-5" />
        </button>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40">
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {/* Search Bar for Mobile */}
            <div className="relative w-full">
              <input
                aria-label="Search products"
                placeholder="Search costumes..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            {/* Currency Switcher for Mobile */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-gray-200 hover:border-lime-600 text-gray-700 hover:text-lime-600 text-sm font-medium transition"
              >
                <span>Currency: {CURRENCY_RATES[currency].symbol} {currency}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showCurrencyDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-48 overflow-y-auto">
                  {Object.entries(CURRENCY_RATES).map(([code, data]) => (
                    <button
                      key={code}
                      onClick={() => {
                        onCurrencyChange(code);
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-lime-50 hover:text-lime-600 transition ${
                        currency === code ? "bg-lime-100 text-lime-600 font-semibold" : "text-gray-700"
                      }`}
                    >
                      {data.symbol} {code} - {data.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Dropdown for Mobile */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-gray-200 hover:border-lime-600 text-gray-700 hover:text-lime-600 text-sm font-medium transition"
              >
                <span>Filter</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showFilterDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 transition"
                  >
                    Price: Low to High
                  </button>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 transition"
                  >
                    Price: High to Low
                  </button>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 transition"
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 transition"
                  >
                    Most Popular
                  </button>
                </div>
              )}
            </div>

            {/* Links for Mobile */}
            <Link href="/about" className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition">
              About Us
            </Link>
            <Link href="/admin" className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition">
              Admin
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
