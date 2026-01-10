"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Heart, Menu, ShoppingCart, ChevronDown, Settings, LogOut, LogIn } from "lucide-react";
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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currencyButtonRef, setCurrencyButtonRef] = useState<HTMLButtonElement | null>(null);
  const [filterButtonRef, setFilterButtonRef] = useState<HTMLButtonElement | null>(null);
  const [currencyModalPos, setCurrencyModalPos] = useState({ top: 0, left: 0 });
  const [filterModalPos, setFilterModalPos] = useState({ top: 0, left: 0 });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { items } = useCart();
  const { buyer, logout } = useBuyer();
  const { admin } = useAdmin();

  // Handle category navigation - scroll to products section
  const handleCategoryChange = (newCategory: string) => {
    onCategoryChange(newCategory);
    
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
      // Navigate to home page with category parameter if not on home
      if (newCategory === "custom") {
        router.push("/?category=custom");
      } else if (newCategory === "adults" || newCategory === "kids") {
        router.push("/?category=" + newCategory);
      }
    }
    
    // Close mobile menu after selection
    setShowMobileMenu(false);
  };

  // Log admin state changes for debugging
  useEffect(() => {
    if (admin) {
      console.log('[Navigation] Admin logged in:', admin.email);
    } else {
      console.log('[Navigation] Admin logged out - admin state is null');
    }
  }, [admin]);

  // Update currency modal position
  useEffect(() => {
    if (showCurrencyDropdown) {
      if (currencyButtonRef) {
        const rect = currencyButtonRef.getBoundingClientRect();
        setCurrencyModalPos({
          top: rect.bottom + 12,
          left: window.innerWidth / 2,
        });
      } else {
        // Fallback for mobile when ref might not be captured
        setCurrencyModalPos({
          top: 100,
          left: window.innerWidth / 2,
        });
      }
    }
  }, [showCurrencyDropdown, currencyButtonRef]);

  // Update filter modal position
  useEffect(() => {
    if (showFilterDropdown) {
      if (filterButtonRef) {
        const rect = filterButtonRef.getBoundingClientRect();
        setFilterModalPos({
          top: rect.bottom + 12,
          left: window.innerWidth / 2,
        });
      } else {
        // Fallback for mobile when ref might not be captured
        setFilterModalPos({
          top: 100,
          left: window.innerWidth / 2,
        });
      }
    }
  }, [showFilterDropdown, filterButtonRef]);

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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Handle click outside for modals and menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close modals if click is outside
      if (!target.closest('[data-modal]') && !target.closest('[data-modal-trigger]')) {
        setShowCurrencyDropdown(false);
        setShowFilterDropdown(false);
      }
      
      // Close mobile menu if click is outside
      if (!target.closest('[data-mobile-menu]') && !target.closest('[data-menu-toggle]')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (category && category !== 'all') {
        params.append('category', category);
      }
      params.append('currency', currency);
      router.push(`/?${params.toString()}`);
      setSearchQuery("");
      setShowMobileMenu(false);
    }
  };

  return (
    <>
      {/* Main Header Container with Hide-on-Scroll */}
      <div 
        className={`md:fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-transform duration-300 ease-in-out md:${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between gap-8 flex-1 px-6 py-4">
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

          {/* Navigation */}
          <nav className="gap-8 text-sm font-medium flex items-center">
        {/* Premium Animated Category Toggle - With Inset Depth */}
        <div className="flex items-center gap-2">
          {/* Adults Button */}
          <button
            onClick={() => handleCategoryChange("adults")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
              category === "adults"
                ? "bg-gradient-to-r from-lime-500 to-lime-400 text-white border-lime-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">👔</span>
              <span>Adults</span>
            </span>
          </button>

          {/* Kids Button */}
          <button
            onClick={() => handleCategoryChange("kids")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
              category === "kids"
                ? "bg-gradient-to-r from-lime-500 to-lime-400 text-white border-lime-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">👶</span>
              <span>Kids</span>
            </span>
          </button>

          {/* Custom Button */}
          <button
            onClick={() => handleCategoryChange("custom")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
              category === "custom"
                ? "bg-gradient-to-r from-lime-500 to-lime-400 text-white border-lime-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-lime-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">🎨</span>
              <span>Custom</span>
            </span>
          </button>
        </div>

        <Link 
          href="/about" 
          className={`transition font-semibold ${
            pathname === "/about"
              ? "text-lime-600 border-b-2 border-lime-600 pb-1"
              : "text-gray-700 hover:text-lime-600"
          }`}
        >
          About Us
        </Link>
          </nav>

          {/* Search */}
          <div className="flex-1 items-center max-w-xs lg:flex hidden">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                aria-label="Search products"
                placeholder="Search costumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-4">
        {/* Currency Switcher */}
        <div className="relative hidden md:block">
          <button
            ref={setCurrencyButtonRef}
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 hover:border-lime-600 text-gray-700 hover:text-lime-600 text-sm font-medium transition"
            data-modal-trigger
          >
            {CURRENCY_RATES[currency].symbol}
            <span>{currency}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showCurrencyDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50" data-modal>
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
        {admin ? (
          <Link href="/admin" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-600 hover:border-orange-600 hover:bg-orange-100 font-semibold transition">
            <Settings className="h-4 w-4" />
            <span className="text-sm">Admin</span>
          </Link>
        ) : null}

        {/* Profile Button - Direct link to dashboard */}
        {buyer && (
          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-50 border border-lime-200 text-gray-700 hover:border-lime-600 hover:bg-lime-100 font-semibold transition"
          >
            <User className="h-4 w-4 text-lime-600" />
            <span className="text-sm">{buyer.fullName}</span>
          </Link>
        )}

        {!buyer && (
          <Link href="/auth" className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
            <User className="h-4 w-4" />
            <span className="text-sm">Login</span>
          </Link>
        )}

        {/* Notification Bell for Desktop */}
        <div className="hidden md:block">
          <NotificationBell />
        </div>

        <Link href="/cart" className="hidden md:flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg font-medium transition relative">
          <ShoppingCart className="h-4 w-4" />
          <span className="text-sm">Cart</span>
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Link>
          </div>
        </div>
      </div>
    </>
  );

  // This code was orphaned, needs to be inside the return
}

// The mobile menu JSX should have been inside the component return
