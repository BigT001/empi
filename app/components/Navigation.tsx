"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  // Sync search query state with search param 'q'
  useEffect(() => {
    const q = searchParams?.get("q") || "";
    setSearchQuery(q);
  }, [searchParams]);

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
      params.append('currency', currency);
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div
      className={`hidden md:block fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      <div className={`w-full transition-all duration-500 border-b ${
        scrolled
          ? 'bg-white/80 dark:bg-black/85 backdrop-blur-xl border-slate-200/50 dark:border-white/5 shadow-md py-3'
          : isTransparent
            ? 'bg-transparent border-transparent py-5'
            : 'bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-md border-slate-200/50 dark:border-white/5 shadow-sm py-4'
      }`}>
        <div className="w-full px-6 md:px-12 flex items-center justify-between gap-8 h-16">
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
          <nav className="flex items-center gap-6 lg:gap-8">
            {[
              { id: 'adults', label: 'Home' },
              { id: 'costume-show', label: 'Costumes Show 2026', href: '/costume-show-shop' },
              { id: 'shop', label: 'Shop', href: '/shop' },
              { id: 'custom', label: 'Bespoke' },
              { id: 'about', label: 'Our Story', href: '/about' }
            ].map((item) => {
              const isActive = item.href ? pathname === item.href : category === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => item.href ? router.push(item.href) : handleCategoryChange(item.id)}
                  className={`text-sm font-black tracking-wide transition-all duration-300 relative py-2 ${
                    isActive
                      ? 'text-lime-600 dark:text-lime-400 font-black after:absolute after:bottom-[-2px] after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-lime-500 after:rounded-full after:shadow-[0_0_8px_rgba(132,204,22,0.8)]'
                      : isTransparent
                        ? 'text-white/75 hover:text-white hover:scale-102'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:text-white hover:scale-102'
                          : 'text-neutral-800 hover:text-black hover:scale-102'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:block flex-1 max-w-[240px] xl:max-w-[280px] z-10">
            <form onSubmit={handleSearch} className="relative group">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search... (Press '/' to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-full px-4 py-1.5 pl-8 text-[11px] font-bold outline-none transition-all shadow-sm ${
                  isTransparent
                    ? 'bg-white/10 border border-white/15 text-white placeholder:text-white/60 focus:ring-2 focus:ring-lime-500/20 focus:bg-white/20'
                    : 'bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-lime-500/20 focus:bg-white dark:focus:bg-black'
                }`}
              />
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
                isTransparent 
                  ? 'text-white/60' 
                  : 'text-slate-400 dark:text-slate-500 group-focus-within:text-lime-500 dark:group-focus-within:text-lime-400'
              }`} />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
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
                <Moon className={`h-4.5 w-4.5 group-hover:-rotate-45 transition-transform duration-500 ${isTransparent ? 'text-white' : 'text-neutral-800'}`} />
              )}
            </button>

            <div className={`h-6 w-[1px] mx-1 ${
              isTransparent 
                ? 'bg-white/20' 
                : 'bg-slate-200 dark:bg-white/10'
            }`}></div>

            {buyer ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all group hover:scale-[1.02] active:scale-95 ${
                    isTransparent
                      ? 'bg-white/10 border-white/15 hover:border-lime-400 text-white'
                      : 'bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 hover:border-lime-500 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isTransparent
                      ? 'bg-lime-600/20 text-lime-400'
                      : 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400'
                  }`}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-extrabold tracking-wide ${
                    isTransparent 
                      ? 'text-white' 
                      : 'text-slate-700 dark:text-gray-300'
                  }`}>{buyer.fullName.split(' ')[0]}</span>
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
                <User className="h-4 w-4" />
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
