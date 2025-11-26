"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Heart, Menu, ShoppingCart, ChevronDown, Settings, LogOut, LogIn } from "lucide-react";
import { CURRENCY_RATES } from "./constants";
import { useCart } from "./CartContext";
import { useBuyer } from "../context/BuyerContext";
import { useAdmin } from "../context/AdminContext";

interface NavigationProps {
  category: string;
  onCategoryChange: (category: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export function Navigation({ category, onCategoryChange, currency, onCurrencyChange }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currencyButtonRef, setCurrencyButtonRef] = useState<HTMLButtonElement | null>(null);
  const [filterButtonRef, setFilterButtonRef] = useState<HTMLButtonElement | null>(null);
  const [currencyModalPos, setCurrencyModalPos] = useState({ top: 0, left: 0 });
  const [filterModalPos, setFilterModalPos] = useState({ top: 0, left: 0 });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { items } = useCart();
  const { buyer, logout } = useBuyer();
  const { admin } = useAdmin();

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
    if (currencyButtonRef && showCurrencyDropdown) {
      const rect = currencyButtonRef.getBoundingClientRect();
      setCurrencyModalPos({
        top: rect.bottom + 12,
        left: window.innerWidth / 2,
      });
    }
  }, [showCurrencyDropdown, currencyButtonRef]);

  // Update filter modal position
  useEffect(() => {
    if (filterButtonRef && showFilterDropdown) {
      const rect = filterButtonRef.getBoundingClientRect();
      setFilterModalPos({
        top: rect.bottom + 12,
        left: window.innerWidth / 2,
      });
    }
  }, [showFilterDropdown, filterButtonRef]);

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

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between gap-8 flex-1">
      {/* Navigation */}
      <nav className="hidden gap-8 text-sm font-medium md:flex items-center">
        {/* Premium Animated Category Toggle - With Inset Depth */}
        <div className="flex items-center gap-2">
          {/* Adults Button */}
          <button
            onClick={() => onCategoryChange("adults")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
              category === "adults"
                ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">👔</span>
              <span>Adults</span>
            </span>
          </button>

          {/* Kids Button */}
          <button
            onClick={() => onCategoryChange("kids")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
              category === "kids"
                ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">👶</span>
              <span>Kids</span>
            </span>
          </button>

          {/* Custom Button */}
          <button
            onClick={() => onCategoryChange("custom")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
              category === "custom"
                ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
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
        {admin ? (
          <Link href="/admin" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-600 hover:border-orange-600 hover:bg-orange-100 font-semibold transition">
            <Settings className="h-4 w-4" />
            <span className="text-sm">Admin</span>
          </Link>
        ) : null}

        {/* Account Menu - Only show if logged in */}
        {buyer && (
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-50 border border-lime-200 text-gray-700 hover:border-lime-600 hover:bg-lime-100 font-semibold transition"
            >
              <User className="h-4 w-4 text-lime-600" />
              <span className="text-sm">{buyer.fullName}</span>
            </button>

            {/* Dropdown Menu */}
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{buyer.fullName}</p>
                  <p className="text-xs text-gray-600">{buyer.email}</p>
                </div>

                <div className="py-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition"
                  >
                    <User className="h-4 w-4 text-blue-600" />
                    My Dashboard
                  </Link>
                </div>

                <div className="p-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      console.log("🔐 Logout clicked from Navigation");
                      logout();
                      setShowAccountMenu(false);
                      // Redirect to home
                      router.push("/");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm text-red-600 font-semibold rounded transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!buyer && (
          <Link href="/auth" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Login</span>
          </Link>
        )}

        <Link href="/cart" className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg font-medium transition relative">
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Cart</span>
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Link>
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-700 md:hidden hover:bg-gray-100 rounded-lg transition">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      </div>

      {/* Mobile Navigation Header */}
      <div className="md:hidden flex items-center justify-between gap-1 w-full flex-shrink-0">
        {/* Category Toggle for Mobile */}
        <div className="flex items-center flex-1 justify-center min-w-0">
          {/* Modern Button Group - Mobile */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onCategoryChange("adults")}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-300 border-2 ${
                category === "adults"
                  ? "bg-gray-900 text-white border-gray-900 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              Adults
            </button>
            <button
              onClick={() => onCategoryChange("kids")}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-300 border-2 ${
                category === "kids"
                  ? "bg-gray-900 text-white border-gray-900 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              Kids
            </button>
            <button
              onClick={() => onCategoryChange("custom")}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-300 border-2 ${
                category === "custom"
                  ? "bg-gray-900 text-white border-gray-900 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Cart Icon */}
        <Link href="/cart" className="flex items-center justify-center p-1.5 bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition flex-shrink-0 relative">
          <ShoppingCart className="h-4 w-4" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Link>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2.5 mr-3 text-gray-700 hover:bg-gray-100 rounded-lg transition flex-shrink-0" data-menu-toggle>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40 animate-in slide-in-from-top duration-200" data-mobile-menu>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Search Bar for Mobile */}
            <div className="relative w-full flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  aria-label="Search products"
                  placeholder="Search costumes..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              {/* Admin Icon - Only show if admin is logged in */}
              {admin && (
                <Link 
                  href="/admin" 
                  className="flex items-center justify-center p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                  title="Admin Dashboard"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Settings className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Icon Grid Menu */}
            <div className="grid grid-cols-4 gap-3">
              {/* Currency Button */}
              <div className="relative">
                <button
                  ref={setCurrencyButtonRef}
                  onClick={() => {
                    setShowCurrencyDropdown(!showCurrencyDropdown);
                    setShowFilterDropdown(false);
                  }}
                  className="w-full flex flex-col items-center justify-center p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition duration-300 group"
                  title="Currency"
                  data-modal-trigger
                >
                  <span className="text-2xl mb-1">💱</span>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">Currency</span>
                </button>
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button
                  ref={setFilterButtonRef}
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    setShowCurrencyDropdown(false);
                  }}
                  className="w-full flex flex-col items-center justify-center p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition duration-300 group"
                  title="Filter"
                  data-modal-trigger
                >
                  <span className="text-2xl mb-1">🎚️</span>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">Filter</span>
                </button>
              </div>

              {/* About Us Button */}
              <Link 
                href="/about" 
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition duration-300 group"
                title="About Us"
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="text-2xl mb-1">ℹ️</span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">About</span>
              </Link>

              {/* Profile Button (if logged in) */}
              {buyer && (
                <Link 
                  href="/dashboard" 
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-lime-100 hover:bg-lime-200 transition duration-300 group"
                  title="Profile"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="text-2xl mb-1">👤</span>
                  <span className="text-xs font-semibold text-lime-700 group-hover:text-lime-900">Profile</span>
                </Link>
              )}

              {/* Login Button (if NOT logged in) */}
              {!buyer && (
                <Link 
                  href="/auth" 
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition duration-300 group"
                  title="Login"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="text-2xl mb-1">🔐</span>
                  <span className="text-xs font-semibold text-blue-700 group-hover:text-blue-900">Login</span>
                </Link>
              )}

              {/* Admin Button (if admin logged in) */}
              {admin && (
                <Link 
                  href="/admin" 
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-100 hover:bg-orange-200 transition duration-300 group"
                  title="Admin"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="text-2xl mb-1">⚙️</span>
                  <span className="text-xs font-semibold text-orange-700 group-hover:text-orange-900">Admin</span>
                </Link>
              )}
            </div>



            {/* Currency Modal */}
            {showCurrencyDropdown && (
              <>
                {/* Modal */}
                <div 
                  className="fixed z-50 w-full max-w-sm px-4"
                  data-modal
                  style={{
                    top: `${currencyModalPos.top}px`,
                    left: `${currencyModalPos.left}px`,
                    transform: 'translateX(-50%)',
                    animation: 'slideUpSmooth 250ms ease-out forwards',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-lime-500/30">
                    {/* Header with Lime Gradient */}
                    <div className="bg-gradient-to-r from-lime-600 to-green-600 text-white p-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black">💱 Currency</h3>
                        <p className="text-lime-100 text-xs font-semibold mt-1">Select your preferred currency</p>
                      </div>
                      <button
                        onClick={() => setShowCurrencyDropdown(false)}
                        className="text-white hover:text-lime-100 p-2 rounded-lg transition hover:scale-110"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Currency Options */}
                    <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
                      {Object.entries(CURRENCY_RATES).map(([code, data]) => (
                        <button
                          key={code}
                          onClick={() => {
                            onCurrencyChange(code);
                            setShowCurrencyDropdown(false);
                          }}
                          className={`w-full text-left px-5 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-between group ${
                            currency === code 
                              ? "bg-gradient-to-r from-lime-500 to-green-500 text-white shadow-lg scale-105" 
                              : "bg-gray-50 text-gray-700 hover:bg-lime-50 hover:border-lime-300"
                          } border-2 border-transparent`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{data.symbol}</span>
                            <div>
                              <span className="block font-black">{code}</span>
                              <span className="text-xs opacity-75">{data.name}</span>
                            </div>
                          </div>
                          {currency === code && <span className="text-xl font-black">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Filter Modal */}
            {showFilterDropdown && (
              <>
                {/* Modal */}
                <div 
                  className="fixed z-50 w-full max-w-sm px-4"
                  data-modal
                  style={{
                    top: `${filterModalPos.top}px`,
                    left: `${filterModalPos.left}px`,
                    transform: 'translateX(-50%)',
                    animation: 'slideUpSmooth 250ms ease-out forwards',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-lime-500/30">
                    {/* Header with Lime Gradient */}
                    <div className="bg-gradient-to-r from-lime-600 to-green-600 text-white p-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black">🎚️ Sort Products</h3>
                        <p className="text-lime-100 text-xs font-semibold mt-1">Choose how to display items</p>
                      </div>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="text-white hover:text-lime-100 p-2 rounded-lg transition hover:scale-110"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Filter Options */}
                    <div className="p-5 space-y-2">
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="w-full text-left px-5 py-3 rounded-2xl font-semibold text-gray-700 bg-gray-50 hover:bg-lime-50 hover:border-lime-300 transition-all duration-300 flex items-center gap-3 border-2 border-transparent group"
                      >
                        <span className="text-2xl">⬇️</span>
                        <span className="group-hover:text-lime-700">Price: Low to High</span>
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="w-full text-left px-5 py-3 rounded-2xl font-semibold text-gray-700 bg-gray-50 hover:bg-lime-50 hover:border-lime-300 transition-all duration-300 flex items-center gap-3 border-2 border-transparent group"
                      >
                        <span className="text-2xl">⬆️</span>
                        <span className="group-hover:text-lime-700">Price: High to Low</span>
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="w-full text-left px-5 py-3 rounded-2xl font-semibold text-gray-700 bg-gray-50 hover:bg-lime-50 hover:border-lime-300 transition-all duration-300 flex items-center gap-3 border-2 border-transparent group"
                      >
                        <span className="text-2xl">✨</span>
                        <span className="group-hover:text-lime-700">Newest</span>
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="w-full text-left px-5 py-3 rounded-2xl font-semibold text-gray-700 bg-gray-50 hover:bg-lime-50 hover:border-lime-300 transition-all duration-300 flex items-center gap-3 border-2 border-transparent group"
                      >
                        <span className="text-2xl">🔥</span>
                        <span className="group-hover:text-lime-700">Most Popular</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
