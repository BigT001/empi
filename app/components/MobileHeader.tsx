"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Menu, X, User, ShoppingCart, LogOut, Sun, Moon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useBuyer } from "../context/BuyerContext";
import { useAdmin } from "../context/AdminContext";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "../context/ThemeContext";

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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { items } = useCart();
  const { currency, setCurrency } = useCurrency();
  const { buyer, logout } = useBuyer();
  const { admin } = useAdmin();
  const { theme, toggleTheme } = useTheme();

  const currentCurrency = propCurrency || currency;

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const handleCategoryChange = (newCategory: string) => {
    if (onCategoryChange) {
      onCategoryChange(newCategory);
    }

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

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onCategoryChange) {
      onCategoryChange("adults");
    }
    router.push("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowMobileMenu(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setScrolled(currentScrollY > 20);

      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setHeaderVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
      <div
        className={`md:hidden fixed top-0 left-0 right-0 z-[110] transition-all duration-300 ease-in-out border-b border-gray-100 dark:border-white/5 shadow-sm ${headerVisible || showMobileMenu ? 'translate-y-0' : '-translate-y-full'
          } ${scrolled ? 'bg-white/95 dark:bg-black/80 backdrop-blur-md' : 'bg-white dark:bg-[#0a0a0a]'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <Link href="/" onClick={handleLogoClick} className="flex-shrink-0 group relative z-10">
            <div className="relative">
              <Image
                src="/logo/EMPI-2k24-LOGO-1.PNG"
                alt="EMPI Logo"
                width={50}
                height={50}
                className="h-10 w-auto rounded-lg shadow-sm transition-transform group-hover:scale-105"
              />
            </div>
          </Link>

          <button
            onClick={() => setShowSearchModal(true)}
            className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-400 text-sm focus:outline-none"
          >
            <Search className="h-4 w-4" />
            <span>Search costumes...</span>
          </button>

          <div className="flex-shrink-0 flex items-center gap-1 relative z-10">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-all active:scale-90"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 animate-in rotate-90 duration-500" />
              ) : (
                <Moon className="h-5 w-5 animate-in -rotate-90 duration-500" />
              )}
            </button>

            <NotificationBell />

            <Link
              href="/cart"
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-all active:scale-90"
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute top-1 right-1 bg-lime-500 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white dark:ring-black animate-in zoom-in">
                  {items.length}
                </span>
              )}
            </Link>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-all active:scale-95 relative z-[120]"
              aria-label="Toggle Menu"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Mobile Menu Overlay - Now Outside the transforming bar */}
      <div
        className={`md:hidden fixed inset-0 z-[105] bg-white dark:bg-[#0a0a0a] transition-all duration-500 ease-in-out ${showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-lime-500/10 dark:bg-lime-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-green-500/10 dark:bg-green-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative h-full flex flex-col pt-24 px-6 pb-10 space-y-8 overflow-y-auto">
          {/* Navigation Section */}
          <div>
            <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-4 pl-1">
              Costume Collections
            </p>
            <nav className="grid grid-cols-1 gap-4">
              {[
                { id: 'adults', label: 'Adults', icon: '👤' },
                { id: 'kids', label: 'Kids', icon: '🧒' },
                { id: 'custom', label: 'Bespoke', icon: '✨' },
                { id: 'about', label: 'My Story', href: '/about', icon: '📜' }
              ].map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => item.href ? (router.push(item.href), setShowMobileMenu(false)) : handleCategoryChange(item.id)}
                  className={`flex items-center justify-between px-6 py-5 rounded-2xl text-lg font-black transition-all transform active:scale-[0.98] ${showMobileMenu ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{item.icon}</span>
                    <span className={(item.href ? pathname === item.href : category === item.id)
                      ? 'text-lime-600 dark:text-lime-400'
                      : 'text-gray-900 dark:text-gray-100'
                    }>
                      {item.label}
                    </span>
                  </div>
                  {(item.href ? pathname === item.href : category === item.id) && (
                    <div className="w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.6)]" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Experience Section */}
          <div className={`flex-1 space-y-4 pt-6 border-t border-gray-100 dark:border-white/5 transition-all duration-700 delay-500 ${showMobileMenu ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-4 pl-1">
              Your Experience
            </p>
            {buyer ? (
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-lime-500/20">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">Welcome back</p>
                    <p className="text-base font-black">{buyer.fullName}</p>
                  </div>
                </Link>
                <button
                  onClick={async () => {
                    setShowMobileMenu(false);
                    await logout();
                    router.push('/');
                  }}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl text-red-600 dark:text-red-400 font-black text-sm bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/10"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout from Account</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-center gap-3 w-full p-6 rounded-2xl bg-slate-900 dark:bg-lime-600 text-white font-black text-base shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-lime-500/20 active:scale-95 transition-all"
              >
                <User className="h-5 w-5" />
                <span>Join EMPI Community</span>
              </Link>
            )}
          </div>

          {/* Footer Sign-off */}
          <div className="text-center pt-8">
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-300 dark:text-gray-700">
              EMPI &copy; 2024
            </p>
          </div>
        </div>
      </div>

      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-20" onClick={() => setShowSearchModal(false)}>
          <div className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white">What are you looking for?</h3>
              <button onClick={() => setShowSearchModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition">
                <X className="h-5 w-5 dark:text-white" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="p-6">
              <div className="relative group">
                <input
                  aria-label="Search"
                  placeholder="Enter costume name, theme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-lime-500 focus:bg-white dark:focus:bg-black/40 rounded-2xl px-5 py-4 pl-12 outline-none transition-all font-medium dark:text-white"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-lime-500 transition-colors" />
              </div>
              <button
                type="submit"
                className="mt-4 w-full bg-lime-500 hover:bg-lime-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-lime-200 dark:shadow-none transition-all active:scale-95"
              >
                Search EMPI
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
