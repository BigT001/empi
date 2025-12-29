"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, Mail, Phone, Instagram } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { useCart } from "./CartContext";

export function MobileLogoTop() {
  const router = useRouter();
  const { items } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      params.append('currency', 'NGN');
      router.push(`/?${params.toString()}`);
      setSearchQuery("");
    }
  };

  return (
    <div className="md:hidden flex items-center px-0 pr-4 py-3 gap-3 relative z-[1000]">
      {/* Logo */}
      <Link href="/" className="flex-shrink-0">
        <Image
          src="/logo/EMPI-2k24-LOGO-1.PNG"
          alt="EMPI Logo"
          width={80}
          height={80}
          className="h-16 w-auto"
        />
      </Link>

      {/* Search Input Field - Expanded */}
      <form onSubmit={handleSearch} className="flex-1 flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border-2 border-gray-300 bg-gray-50 px-4 py-2 pl-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
          />
          <Search className="absolute left-4 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </form>

      {/* Right Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Cart Icon */}
        <Link href="/cart" className="relative inline-flex items-center justify-center">
          <button 
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 transform hover:scale-110 active:scale-95 relative"
            title="Cart"
          >
            <ShoppingCart className="h-6 w-6" strokeWidth={2} />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </button>
        </Link>

        {/* Notification Bell */}
        <div style={{
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))"
        }}>
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
