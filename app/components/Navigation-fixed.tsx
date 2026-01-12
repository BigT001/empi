"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Menu, ShoppingCart, ChevronDown, Settings } from "lucide-react";
import { CURRENCY_RATES } from "./constants";
import { useCart } from "./CartContext";
import { useBuyer } from "../context/BuyerContext";
import { useAdmin } from "../context/AdminContext";
import { NotificationBell } from "./NotificationBell";

interface NavigationProps {
  category: string;
  onCategoryChange: (category: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  mode?: "buy" | "rent";
  onModeChange?: (mode: "buy" | "rent") => void;
}

export function Navigation({ category, onCategoryChange, currency, onCurrencyChange, mode, onModeChange }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { items } = useCart();
  const { buyer } = useBuyer();
  const { admin } = useAdmin();

  const handleCategoryChange = (newCategory: string) => {
    onCategoryChange(newCategory);
    if (pathname === "/") {
      const params = new URLSearchParams();
      params.append('category', newCategory);
      window.history.replaceState({}, '', `/?${params.toString()}`);
      setTimeout(() => {
        const productSection = document.getElementById("product-grid");
        if (productSection) {
          productSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    } else {
      if (newCategory === "custom") {
        router.push("/?category=custom");
      } else if (newCategory === "adults" || newCategory === "kids") {
        router.push("/?category=" + newCategory);
      }
    }
    setShowMobileMenu(false);
  };

  // Scroll handler - hide header and currency on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setHeaderVisible(true);
        setShowCurrencyDropdown(false);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setHeaderVisible(false);
        setShowCurrencyDropdown(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (category && category !== 'all') {
        params.append('category', category);
      }
      router.push(`/?${params.toString()}`);
      setSearchQuery("");
      setShowMobileMenu(false);
    }
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-transform duration-300 ease-in-out ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between gap-6 px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo/EMPI-2k24-LOGO-1.PNG"
            alt="EMPI Logo"
            width={60}
            height={60}
            className="h-12 w-auto"
          />
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <button
            onClick={() => handleCategoryChange("adults")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 border-2 ${
              category === "adults"
                ? "bg-lime-500 text-white border-lime-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
            }`}
          >
            👔 Adults
          </button>

          <button
            onClick={() => handleCategoryChange("kids")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 border-2 ${
              category === "kids"
                ? "bg-lime-500 text-white border-lime-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
            }`}
          >
            👶 Kids
          </button>

          <button
            onClick={() => handleCategoryChange("custom")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 border-2 ${
              category === "custom"
                ? "bg-lime-500 text-white border-lime-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
            }`}
          >
            🎨 Custom
          </button>

          <Link 
            href="/about" 
            className={`transition font-semibold px-4 py-2 ${
              pathname === "/about"
                ? "text-lime-600 border-b-2 border-lime-600"
                : "text-gray-700 hover:text-lime-600"
            }`}
          >
            About Us
          </Link>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden lg:flex relative flex-1 max-w-xs">
          <input
            placeholder="Search costumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </form>

        {/* Right Section - Currency & Actions */}
        <div className="flex items-center gap-3">
          {/* Currency Switcher - HIDE ON SCROLL */}
          <div className={`relative transition-all duration-300 ${
            headerVisible ? 'opacity-100 visible' : 'opacity-0 invisible w-0'
          }`}>
            <button
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 hover:border-lime-600 text-gray-700 hover:text-lime-600 text-sm font-medium transition whitespace-nowrap"
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
                    {data.symbol} {code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {admin && (
            <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-600 hover:border-orange-600 text-sm font-semibold transition">
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          )}

          {buyer ? (
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-50 border border-lime-200 text-gray-700 hover:border-lime-600 text-sm font-semibold transition">
              <User className="h-4 w-4 text-lime-600" />
              {buyer.fullName}
            </Link>
          ) : (
            <Link href="/auth" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <User className="h-4 w-4" />
              Login
            </Link>
          )}

          <div className="hidden lg:block">
            <NotificationBell />
          </div>

          <Link href="/cart" className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition relative">
            <ShoppingCart className="h-4 w-4" />
            Cart
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo/EMPI-2k24-LOGO-1.PNG"
            alt="EMPI Logo"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-lime-600" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-3">
          <button
            onClick={() => handleCategoryChange("adults")}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm ${
              category === "adults" ? "bg-lime-500 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            👔 Adults
          </button>
          <button
            onClick={() => handleCategoryChange("kids")}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm ${
              category === "kids" ? "bg-lime-500 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            👶 Kids
          </button>
          <button
            onClick={() => handleCategoryChange("custom")}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm ${
              category === "custom" ? "bg-lime-500 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            🎨 Custom
          </button>
          <Link href="/about" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
            About Us
          </Link>
          {buyer ? (
            <Link href="/dashboard" className="block px-4 py-2 rounded-lg bg-lime-50 text-gray-700">
              Dashboard
            </Link>
          ) : (
            <Link href="/auth" className="block px-4 py-2 rounded-lg bg-blue-600 text-white text-center">
              Login
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
