"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Menu, ArrowLeft, User, MessageCircle, Mail, Phone, Instagram } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useBuyer } from "../context/BuyerContext";
import { CURRENCY_RATES } from "./constants";
import { NotificationBell } from "./NotificationBell";

export function MobileHeader() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showContactMenu, setShowContactMenu] = useState(false);
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
      router.push(`/?${params.toString()}`);
      setSearchQuery("");
      setShowSearchModal(false);
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t border-gray-200 transition-transform duration-300 ${
        headerVisible ? "translate-y-0" : "translate-y-full"
      }`}>
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          {/* About Button */}
          <Link 
            href="/about" 
            className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition duration-300 font-semibold text-sm text-gray-700"
            title="About Us"
          >
            About
          </Link>

          {/* Cart Button - REMOVED */}

          {/* Contact Button with Popup Menu */}
          <div className="flex-1 relative">
            <button
              onClick={() => setShowContactMenu(!showContactMenu)}
              className="flex w-full items-center justify-center px-3 py-2 rounded-lg bg-green-100 hover:bg-green-200 transition duration-300 font-semibold text-sm text-green-700 gap-1"
              title="Contact Us"
            >
              <MessageCircle className="h-4 w-4" />
              Contact
            </button>
            
            {/* Contact Menu Popup */}
            {showContactMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowContactMenu(false)}
                ></div>
                
                {/* Menu Cards - Compact Width */}
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 space-y-2 bg-transparent rounded-xl p-2 max-w-xs">
                  {/* Email */}
                  <a
                    href="mailto:support@empi.ng"
                    className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2.5 hover:bg-blue-50 hover:border-blue-400 transition group shadow-lg"
                    onClick={() => setShowContactMenu(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition flex-shrink-0">
                      <Mail className="h-4 w-4 text-blue-600 group-hover:text-white transition" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">Email</p>
                      <p className="text-xs text-gray-600">support@empi.ng</p>
                    </div>
                  </a>

                  {/* Phone */}
                  <a
                    href="tel:+2348012345678"
                    className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2.5 hover:bg-green-50 hover:border-green-400 transition group shadow-lg"
                    onClick={() => setShowContactMenu(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-600 transition flex-shrink-0">
                      <Phone className="h-4 w-4 text-green-600 group-hover:text-white transition" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">Call</p>
                      <p className="text-xs text-gray-600">+234 801 234 5678</p>
                    </div>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/empicostumes/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2.5 hover:bg-pink-50 hover:border-pink-400 transition group shadow-lg"
                    onClick={() => setShowContactMenu(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-600 transition flex-shrink-0">
                      <Instagram className="h-4 w-4 text-pink-600 group-hover:text-white transition" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">Instagram</p>
                      <p className="text-xs text-gray-600">@empicostumes</p>
                    </div>
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Login/Profile Button */}
          {isHydrated && !isLoggedIn ? (
            <Link 
              href="/auth" 
              className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition duration-300 font-semibold text-sm text-blue-700 gap-1"
              title="Login"
            >
              <span>🔐</span> Login
            </Link>
          ) : (
            <Link 
              href="/dashboard" 
              className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-lime-100 hover:bg-lime-200 transition duration-300 font-semibold text-sm text-lime-700 gap-1"
              title="Profile"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
          )}
        </div>
      </div>

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

      {/* Search Modal - Removed, search input now always visible in bottom bar */}
    </>
  );
}
