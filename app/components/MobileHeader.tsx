"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Menu, X, User, ShoppingCart, Settings, LogOut, LogIn, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useBuyer } from "../context/BuyerContext";
import { useAdmin } from "../context/AdminContext";
import { CURRENCY_RATES } from "./constants";
import { NotificationBell } from "./NotificationBell";

interface MobileHeaderProps {
  category?: string;
  onCategoryChange?: (category: string) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  mode?: "buy" | "rent";
  onModeChange?: (mode: "buy" | "rent") => void;
}

export function MobileHeader({ category = "adults", onCategoryChange, currency: propCurrency, onCurrencyChange }: MobileHeaderProps) {
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
  const { buyer, logout, isLoggedIn } = useBuyer();
  const { admin } = useAdmin();

  // Use provided currency or context currency
  const currentCurrency = propCurrency || currency;
  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    if (onCurrencyChange) {
      onCurrencyChange(newCurrency);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    if (onCategoryChange) {
      onCategoryChange(newCategory);
    }
    
    // If on home page, update URL and scroll to products section
    if (pathname === "/") {
      // Update URL without reloading
      const params = new URLSearchParams();
      params.append('category', newCategory);
      window.history.replaceState({}, '', `/?${params.toString()}`);
      
      // Wait for state to update before scrolling
      setTimeout(() => {
        const productSection = document.getElementById("product-grid");
        if (productSection) {
          productSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    } else {
      // Navigate based on category if not on home
      if (newCategory === "custom") {
        router.push("/?category=custom");
      } else if (newCategory === "adults" || newCategory === "kids") {
        router.push("/?category=" + newCategory);
      }
    }
    
    // Close mobile menu after selection
    setShowMobileMenu(false);
  };

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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close menu, currency modal when user scrolls
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

  // Handle click outside for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on menu toggle button
      if (target.closest('[data-menu-toggle]')) {
        return;
      }
      
      // Close menu if click is outside the menu itself
      if (showMobileMenu && !target.closest('[data-mobile-menu]')) {
        setShowMobileMenu(false);
      }
      
      // Don't close if clicking on modal trigger buttons
      if (target.closest('[data-modal-trigger]')) {
        return;
      }
      
      // Close currency modal if click is outside the modal itself
      if (showCurrencyModal && !target.closest('[data-modal]')) {
        setShowCurrencyModal(false);
      }
    };

    if (showMobileMenu || showCurrencyModal) {
      document.addEventListener('click', handleClickOutside, true);
      return () => document.removeEventListener('click', handleClickOutside, true);
    }
  }, [showMobileMenu, showCurrencyModal]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (category && category !== 'all') {
        params.append('category', category);
      }
      params.append('currency', currentCurrency);
      router.push(`/?${params.toString()}`);
      setSearchQuery("");
      setShowSearchModal(false);
    }
  };

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div 
        className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-transform duration-300 ease-in-out ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Header Top Row - Logo and Menu Toggle */}
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={50}
              height={50}
              className="h-10 w-auto"
            />
          </Link>

          {/* Center - Search Icon */}
          <button
            onClick={() => setShowSearchModal(!showSearchModal)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-lime-600 text-gray-600 hover:text-lime-600 transition"
            data-modal-trigger
          >
            <Search className="h-4 w-4" />
            <span className="text-xs text-gray-500">Search...</span>
          </button>

          {/* Right Actions - Cart, Notifications, Menu Toggle */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div>
              <NotificationBell />
            </div>

            {/* Cart Button */}
            <Link 
              href="/cart" 
              className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-lime-600 hover:bg-lime-700 text-white transition"
              title="Cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {/* Menu Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMobileMenu(!showMobileMenu);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer z-50"
              data-menu-toggle
              title="Menu"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Slide Down */}
        {showMobileMenu && (
          <div className="border-t border-gray-200 bg-white" data-mobile-menu>
            <div className="px-4 py-3 space-y-3">
              {/* Category Buttons and About - Same Line */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleCategoryChange("adults")}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
                    category === "adults"
                      ? "bg-gradient-to-r from-lime-500 to-lime-400 text-white border-lime-500 shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
                  }`}
                >
                  Adults
                </button>

                <button
                  onClick={() => handleCategoryChange("kids")}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
                    category === "kids"
                      ? "bg-gradient-to-r from-lime-500 to-lime-400 text-white border-lime-500 shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
                  }`}
                >
                  Kids
                </button>

                <button
                  onClick={() => handleCategoryChange("custom")}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
                    category === "custom"
                      ? "bg-gradient-to-r from-lime-500 to-lime-400 text-white border-lime-500 shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
                  }`}
                >
                  Custom
                </button>

                <Link 
                  href="/about" 
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
                    pathname === "/about"
                      ? "bg-gradient-to-r from-lime-500 to-lime-400 text-white border-lime-500 shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  About
                </Link>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Profile/Auth Section */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Account</p>
                {buyer ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-lime-50 border border-lime-200 text-gray-700 hover:border-lime-600 hover:bg-lime-100 font-semibold text-sm transition"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User className="h-4 w-4 text-lime-600" />
                      <span>{buyer.fullName}</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:border-red-600 hover:bg-red-100 font-semibold text-sm transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/auth" 
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Login</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20" onClick={() => setShowSearchModal(false)}>
          <div className="bg-white rounded-lg w-11/12 max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Search Products</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="p-4">
              <div className="flex gap-2">
                <input
                  aria-label="Search products"
                  placeholder="Search costumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 text-white font-semibold transition"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
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
                    handleCurrencyChange(code);
                    setShowCurrencyModal(false);
                  }}
                  className={`w-full px-4 py-3 text-left font-medium transition-colors text-sm ${
                    currentCurrency === code
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
    </>
  );
}
