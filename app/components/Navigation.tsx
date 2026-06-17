"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, ShoppingCart, Settings, LogOut, Sun, Moon } from "lucide-react";
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

  const { items } = useCart();
  const isTransparent = pathname === "/" && !scrolled;
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
      <div className="bg-lime-600 text-white py-1.5 px-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          Pre-order: Minimum 1 week delivery for all bespoke and shop units
        </p>
      </div>

      <div className={`mx-auto max-w-7xl px-4 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
        <div className={`flex items-center justify-between gap-8 px-8 h-20 rounded-2xl transition-all duration-500 ${
          scrolled
            ? 'bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/20 dark:border-white/5'
            : isTransparent
              ? 'bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-none'
              : 'bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 shadow-sm'
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
          <nav className="flex items-center gap-1 bg-gray-50/50 dark:bg-white/5 p-1 rounded-xl border border-gray-100 dark:border-white/5">
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
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? isTransparent
                        ? 'bg-lime-600 text-white shadow-md shadow-lime-500/25'
                        : 'bg-white dark:bg-lime-500 text-lime-600 dark:text-white shadow-sm'
                      : isTransparent
                        ? 'text-white/80 hover:text-white hover:bg-white/10'
                        : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Search Box */}
          <div className="flex-1 max-w-xs">
            <form onSubmit={handleSearch} className="relative group">
              <input
                placeholder="Search costumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-sm outline-none transition-all font-medium rounded-xl px-5 py-2.5 pl-11 ${
                  isTransparent
                    ? 'bg-white/10 border border-white/15 focus:border-lime-400 focus:bg-white/20 text-white placeholder:text-white/60'
                    : 'bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-lime-500 dark:focus:border-lime-500 focus:bg-white dark:focus:bg-black/40 dark:text-white placeholder:text-gray-400'
                }`}
              />
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isTransparent ? 'text-white/60 group-focus-within:text-lime-400' : 'text-gray-400 group-focus-within:text-lime-500'}`} />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {admin && (
              <Link
                href="/admin"
                className={`p-2.5 rounded-xl transition-all group relative ${
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
              className={`p-2.5 rounded-xl border transition-all group ${
                isTransparent
                  ? 'bg-white/10 border-white/15 text-white/85 hover:text-lime-400 hover:bg-white/20'
                  : 'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-400'
              }`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 animate-pulse" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <div className={`h-6 w-[1px] mx-1 ${isTransparent ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'}`}></div>

            {buyer ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all group ${
                    isTransparent
                      ? 'bg-white/10 border-white/15 hover:border-lime-400'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-lime-500'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isTransparent
                      ? 'bg-lime-600/20 text-lime-400 group-hover:bg-lime-500 group-hover:text-white'
                      : 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 group-hover:bg-lime-500 group-hover:text-white'
                  }`}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className={`text-sm font-bold ${isTransparent ? 'text-white' : 'text-slate-700 dark:text-gray-300'}`}>{buyer.fullName.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className={`p-2.5 rounded-xl transition-all ${
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
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:shadow-lg active:scale-95 ${
                  isTransparent
                    ? 'bg-lime-600 hover:bg-lime-500 text-white shadow-md shadow-lime-500/25'
                    : 'bg-slate-900 dark:bg-lime-600 hover:bg-slate-800 dark:hover:bg-lime-500 text-white'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}

            <Link href="/cart" className="relative ml-2 p-2.5 bg-lime-500 hover:bg-lime-400 text-white rounded-xl shadow-lg dark:shadow-none shadow-lime-100 transition-all hover:scale-105 active:scale-95">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-slate-900 dark:bg-black text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-[#111]">
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
