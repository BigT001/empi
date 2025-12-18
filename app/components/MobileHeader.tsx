"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Search, Menu, ArrowLeft, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useBuyer } from "../context/BuyerContext";
import { CURRENCY_RATES } from "./constants";

export function MobileHeader() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useCart();
  const { currency, setCurrency } = useCurrency();
  const { buyer, isLoggedIn, isHydrated } = useBuyer();

  // Determine current category based on pathname
  const getCategory = () => {
    if (pathname.includes("custom")) return "custom";
    if (pathname.includes("kids")) return "kids";
    if (pathname.includes("admin")) return "admin";
    if (pathname.includes("auth")) return "auth";
    return "adults";
  };

  const currentCategory = getCategory();

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Hide header when scrolling down
        setHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close menu, currency modal, and search modal when user scrolls
  useEffect(() => {
    if (showMobileMenu || showCurrencyModal || showSearchModal) {
      const handleScrollClose = () => {
        setShowMobileMenu(false);
        setShowCurrencyModal(false);
        setShowSearchModal(false);
      };

      window.addEventListener("scroll", handleScrollClose);
      return () => window.removeEventListener("scroll", handleScrollClose);
    }
  }, [showMobileMenu, showCurrencyModal, showSearchModal]);

  // Don't show header on auth or admin pages
  if (currentCategory === "admin" || currentCategory === "auth") {
    return null;
  }

  const handleCategoryClick = (category: string) => {
    let href = "/";
    if (category === "custom") {
      href = "/custom-costumes";
    } else if (category === "kids") {
      href = "/kids";
    }
    router.push(href);
    setShowMobileMenu(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      params.append('category', currentCategory);
      params.append('currency', currency);
      router.push(`/search?${params.toString()}`);
      setSearchQuery("");
      setShowSearchModal(false);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-gray-100 transition-transform duration-300 ${
        headerVisible ? "translate-y-0" : "-translate-y-full"
      }`}>
        <div className="flex items-center justify-between px-3 py-3 gap-2">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={48}
              height={48}
              className="h-12 w-auto"
            />
          </Link>

          {/* Category Buttons */}
          <div className="flex gap-1 flex-1 justify-center">
            <button
              onClick={() => handleCategoryClick("adults")}
              className={`px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                currentCategory === "adults"
                  ? "bg-lime-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Adults
            </button>
            <button
              onClick={() => handleCategoryClick("kids")}
              className={`px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                currentCategory === "kids"
                  ? "bg-lime-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Kids
            </button>
            <button
              onClick={() => handleCategoryClick("custom")}
              className={`px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                currentCategory === "custom"
                  ? "bg-lime-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Custom
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              onClick={() => setShowSearchModal(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link href="/cart" className="relative inline-flex items-center justify-center">
              <button className="bg-lime-600 hover:bg-lime-700 text-white p-2 rounded-lg transition relative">
                <ShoppingCart className="h-5 w-5" />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </button>
            </Link>
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition" data-menu-toggle title="Menu">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40 animate-in slide-in-from-top duration-200" data-mobile-menu data-modal-trigger>
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            {/* About Button */}
            <Link 
              href="/about" 
              className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition duration-300 font-semibold text-sm text-gray-700"
              title="About Us"
              onClick={() => setShowMobileMenu(false)}
            >
              About
            </Link>

            {/* Currency Button */}
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition duration-300 font-semibold text-sm text-gray-700"
              title="Currency"
            >
              {CURRENCY_RATES[currency].symbol} {currency}
            </button>

            {/* Login/Profile Button */}
            {isHydrated && !isLoggedIn ? (
              <Link 
                href="/auth" 
                className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition duration-300 font-semibold text-sm text-blue-700 gap-1"
                title="Login"
                onClick={() => setShowMobileMenu(false)}
              >
                <span>🔐</span> Login
              </Link>
            ) : (
              <Link 
                href="/dashboard" 
                className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-lime-100 hover:bg-lime-200 transition duration-300 font-semibold text-sm text-lime-700 gap-1"
                title="Profile"
                onClick={() => setShowMobileMenu(false)}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowCurrencyModal(false)}>
          <div className="bg-white rounded-t-xl md:rounded-lg w-full md:w-96 max-h-96 flex flex-col shadow-lg md:shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Select Currency</h3>
              <button
                onClick={() => setShowCurrencyModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Currency Options */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(CURRENCY_RATES).map(([code, data]) => (
                <button
                  key={code}
                  onClick={() => {
                    setCurrency(code);
                    setShowCurrencyModal(false);
                  }}
                  className={`w-full px-4 py-3 text-left font-medium transition-colors text-sm ${
                    currency === code
                      ? "bg-lime-100 text-lime-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {data.symbol} {code} - {data.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-4" onClick={() => setShowSearchModal(false)}>
          <div className="bg-white rounded-lg w-11/12 max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Search Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <form onSubmit={handleSearch} className="flex-1 flex">
                <input
                  type="text"
                  placeholder="Search costumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 outline-none text-sm font-medium"
                />
                <button
                  type="submit"
                  className="text-lime-600 hover:text-lime-700 font-semibold"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Recent or Quick Search Options */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Popular Searches</p>
              {['Angel', 'Red', 'Carnival', 'Superhero', 'Gold'].map(term => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    const params = new URLSearchParams();
                    params.append('q', term);
                    params.append('category', currentCategory);
                    params.append('currency', currency);
                    router.push(`/search?${params.toString()}`);
                    setShowSearchModal(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm text-gray-700 font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
