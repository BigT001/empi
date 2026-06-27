"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, ShoppingCart, Settings, LogOut, Sun, Moon, Sparkles } from "lucide-react";
import { useCart } from "./CartContext";
import { useBuyer } from "../context/BuyerContext";
import { useAdmin } from "../context/AdminContext";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "../context/ThemeContext";

interface NavigationProps {
  category?: string;
  onCategoryChange?: (category: string) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  mode?: "buy" | "rent";
  onModeChange?: (mode: "buy" | "rent") => void;
}

export function Navigation({
  category = "adults",
  onCategoryChange = () => { },
  currency = "NGN",
  onCurrencyChange = () => { }
}: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { items } = useCart();
  const isTransparent = pathname === "/" && category !== "custom" && !scrolled;
  const { buyer, logout } = useBuyer();
  const { admin } = useAdmin();
  const { theme, toggleTheme } = useTheme();

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
      router.push("/?category=" + (newCategory === "custom" ? "custom" : newCategory));
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onCategoryChange("adults");
    router.push("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (category && category !== 'all') params.append('category', category);
      params.append('currency', currency);
      router.push(`/?${params.toString()}`);
      setSearchQuery("");
    }
  };

  return (
    <div
      className={`hidden md:block fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-lime-950 via-[#0a0f02] to-lime-950 dark:from-[#0d1704] dark:via-black dark:to-[#0d1704] text-white py-2 px-4 text-center border-b border-lime-500/10 transition-colors duration-500 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse shadow-[0_0_8px_rgba(132,204,22,0.8)]" />
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-lime-400/90 dark:text-lime-400">
          Pre-order: Minimum 1 week delivery for all bespoke and shop units
        </p>
        <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse shadow-[0_0_8px_rgba(132,204,22,0.8)]" />
      </div>

      <div className={`mx-auto max-w-7xl px-4 transition-all duration-500 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className={`flex items-center justify-between gap-8 px-8 h-20 rounded-full transition-all duration-500 ${
          scrolled
            ? 'bg-white/70 dark:bg-black/65 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/30 dark:border-white/10'
            : isTransparent
              ? 'bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/10 shadow-none'
              : 'bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-md border border-slate-200/60 dark:border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
          }`}>
          {/* Logo */}
          <Link href="/" onClick={handleLogoClick} className="flex-shrink-0 group relative z-10 h-full flex items-center">
            <Image
              src="/logo/EMPI-2k24-LOGO-1.PNG"
              alt="EMPI Logo"
              width={140}
              height={140}
              className="h-32 md:h-40 w-auto transition-transform group-hover:scale-105 duration-500"
              priority
            />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1 bg-slate-100/50 dark:bg-white/5 p-1 rounded-full border border-slate-200/50 dark:border-white/5">
            {[
              { id: 'adults', label: 'Home' },
              { id: 'shop', label: 'Shop', href: '/shop' },
              { id: 'custom', label: 'Bespoke' },
              { id: 'about', label: 'My Story', href: '/about' }
            ].map((item) => {
              const isActive = item.href ? pathname === item.href : category === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => item.href ? router.push(item.href) : handleCategoryChange(item.id)}
                  className={`px-6 py-2 rounded-full text-sm font-extrabold transition-all duration-300 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white shadow-md shadow-lime-500/30 hover:shadow-lg hover:shadow-lime-500/40'
                      : isTransparent
                        ? 'text-white/85 hover:text-white hover:bg-white/10'
                        : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Search Box */}
          <div className="flex-1 max-w-xs">
            <form onSubmit={handleSearch} className="relative group flex items-center">
              <input
                ref={searchInputRef}
                placeholder="Search costumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs outline-none transition-all font-semibold rounded-full px-5 py-2.5 pl-11 pr-10 ${
                  isTransparent
                    ? 'bg-white/10 border border-white/15 focus:border-lime-400 focus:bg-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-lime-500/20'
                    : 'bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-lime-500 dark:focus:border-lime-500 focus:bg-white dark:focus:bg-black/40 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-lime-500/20'
                }`}
              />
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${isTransparent ? 'text-white/60 group-focus-within:text-lime-400' : 'text-gray-400 group-focus-within:text-lime-500'}`} />
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black px-1.5 py-0.5 rounded border pointer-events-none transition-opacity duration-300 group-focus-within:opacity-0 ${
                isTransparent 
                  ? 'border-white/20 text-white/50 bg-white/5' 
                  : 'border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 bg-slate-50 dark:bg-white/5'
              }`}>
                /
              </span>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {admin && (
              <Link
                href="/admin"
                className={`p-2.5 rounded-full transition-all group relative ${
                  isTransparent
                    ? 'text-orange-400 hover:bg-white/10'
                    : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/25'
                }`}
                title="Admin"
              >
                <Settings className="h-5 w-5 group-hover:rotate-45 transition-transform" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Dashboard</span>
              </Link>
            )}

            <NotificationBell isTransparent={isTransparent} />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full border transition-all group ${
                isTransparent
                  ? 'bg-white/10 border-white/15 text-white/85 hover:text-lime-400 hover:bg-white/20'
                  : 'bg-gray-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-[#eaeaea]'
              }`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5 group-hover:rotate-90 transition-transform duration-500 text-lime-400 animate-pulse" />
              ) : (
                <Moon className="h-4.5 w-4.5 group-hover:-rotate-45 transition-transform duration-500" />
              )}
            </button>

            <div className={`h-6 w-[1px] mx-1 ${isTransparent ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/10'}`}></div>

            {buyer ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all group hover:scale-[1.02] active:scale-95 ${
                    isTransparent
                      ? 'bg-white/10 border-white/15 hover:border-lime-400'
                      : 'bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 hover:border-lime-500 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isTransparent
                      ? 'bg-lime-600/20 text-lime-400 group-hover:bg-gradient-to-r group-hover:from-lime-500 group-hover:to-green-600 group-hover:text-white shadow-sm'
                      : 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 group-hover:bg-gradient-to-r group-hover:from-lime-500 group-hover:to-green-600 group-hover:text-white shadow-sm'
                  }`}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-extrabold tracking-wide ${isTransparent ? 'text-white' : 'text-slate-700 dark:text-gray-300'}`}>{buyer.fullName.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className={`p-2.5 rounded-full transition-all ${
                    isTransparent
                      ? 'text-white/60 hover:text-red-400 hover:bg-white/10'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-extrabold text-xs transition-all hover:scale-105 hover:shadow-lg hover:shadow-lime-500/10 active:scale-95 ${
                  isTransparent
                    ? 'bg-lime-600 hover:bg-lime-500 text-white shadow-md shadow-lime-500/25'
                    : 'bg-slate-900 dark:bg-lime-600 hover:bg-slate-800 dark:hover:bg-lime-500 text-white'
                }`}
              >
                <User className="h-4 w-4 animate-pulse" />
                <span>Sign In</span>
              </Link>
            )}

            <Link 
              href="/cart" 
              className="relative ml-2 p-3 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-400 hover:to-green-500 text-white rounded-full shadow-[0_4px_16px_rgba(132,204,22,0.3)] transition-all hover:scale-108 active:scale-90"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-slate-950 text-lime-400 dark:text-white text-[9px] font-black rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-[#0a0a0a] shadow-md animate-bounce">
                  {items.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
