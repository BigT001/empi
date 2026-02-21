"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Menu, X, User, ShoppingCart, LogOut, Sun, Moon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useBuyer } from "../context/BuyerContext";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { items } = useCart();
  const { currency } = useCurrency();
  const { buyer, logout } = useBuyer();
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
      } else if (newCategory === "adults") {
        router.push("/?category=" + newCategory);
      } else if (newCategory === "shop") {
        router.push("/shop");
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
      setShowMobileMenu(false);
    }
  };

  return (
    <>
      <div
        className={`md:hidden fixed top-0 left-0 right-0 z-[110] transition-all duration-300 ease-in-out border-b border-gray-100 dark:border-white/5 shadow-sm ${headerVisible || showMobileMenu ? 'translate-y-0' : '-translate-y-full'
          } ${scrolled ? 'bg-white/95 dark:bg-black/80 backdrop-blur-md' : 'bg-white dark:bg-[#0a0a0a]'}`}
      >
        {/* Announcement Bar */}
        <div className="bg-lime-600 text-white py-1.5 px-4 text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.2em]">
            Pre-order: Minimum 1 week delivery
          </p>
        </div>

        <div className="relative flex items-center h-16 px-4 gap-3">
          {/* Logo (Left) */}
          <div className="flex-none z-20">
            <Link href="/" onClick={handleLogoClick} className="group flex items-center">
              <Image
                src="/logo/EMPI-2k24-LOGO-1.PNG"
                alt="EMPI Logo"
                width={120}
                height={120}
                className="h-16 w-auto transition-transform group-hover:scale-105 duration-500"
                priority
              />
            </Link>
          </div>

          {/* Search Bar (Middle) - Functional Inline Search */}
          <div className="flex-1 min-w-0 z-10">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                placeholder="Search costumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 pl-9 text-[11px] font-bold dark:text-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-lime-500 transition-all shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-lime-500" />
            </form>
          </div>

          {/* Actions (Right) */}
          <div className="flex-none flex items-center gap-1 z-20">
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
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-all active:scale-95"
              aria-label="Toggle Menu"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-[105] bg-white dark:bg-[#0a0a0a] transition-all duration-500 ease-in-out ${showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-lime-500/10 dark:bg-lime-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-green-500/10 dark:bg-green-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative h-full flex flex-col pt-20 px-4 pb-8 space-y-6 overflow-y-auto">
          {/* Navigation Section */}
          <div>
            <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-3 pl-1">
              Costume Collections
            </p>
            <nav className="grid grid-cols-1 gap-3">
              {[
                { id: 'home', label: 'Home', href: '/', icon: '🏠' },
                { id: 'shop', label: 'Shop', href: '/shop', icon: '🛍️' },
                { id: 'custom', label: 'Bespoke', href: '/?category=custom', icon: '✨' },
                { id: 'about', label: 'My Story', href: '/about', icon: '📜' }
              ].map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    setShowMobileMenu(false);
                    if (item.id === 'home' && onCategoryChange) onCategoryChange('adults');
                  }}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl text-base font-black transition-all transform active:scale-[0.98] ${showMobileMenu ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'} bg-gray-50 dark:bg-white/5 border border-transparent hover:border-lime-500/30 shadow-sm`}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl">{item.icon}</span>
                    <span className={(pathname === item.href)
                      ? 'text-lime-600 dark:text-lime-400'
                      : 'text-gray-900 dark:text-gray-100'
                    }>
                      {item.label}
                    </span>
                  </div>
                  {(pathname === item.href) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.6)]" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* User Experience Section */}
          <div className={`flex-1 space-y-3 pt-5 border-t border-gray-100 dark:border-white/5 transition-all duration-700 delay-500 ${showMobileMenu ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-3 pl-1">
              Your Experience
            </p>
            {buyer ? (
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-lime-500/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">Welcome back</p>
                    <p className="text-sm font-black">{buyer.fullName}</p>
                  </div>
                </Link>
                <button
                  onClick={async () => {
                    setShowMobileMenu(false);
                    await logout();
                    router.push('/');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-600 dark:text-red-400 font-black text-xs bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout from Account</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-center gap-3 w-full p-4 rounded-2xl bg-slate-900 dark:bg-lime-600 text-white font-black text-xs shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-lime-500/20 active:scale-95 transition-all"
              >
                <User className="h-4 w-4" />
                <span>My Account</span>
              </Link>
            )}
          </div>

          {/* Footer Sign-off & Mode Toggle */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white transition-all active:scale-95 w-full justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-lime-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-slate-900" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {theme === "dark" ? "Daylight Mode" : "Moonlight Mode"}
                </span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-lime-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
              </div>
            </button>

            <div className="text-center">
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-300 dark:text-gray-700">
                EMPI &copy; 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
