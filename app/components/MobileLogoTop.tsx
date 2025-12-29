"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

export function MobileLogoTop() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      params.append('currency', 'NGN');
      router.push(`/search?${params.toString()}`);
      setSearchQuery("");
    }
  };

  return (
    <div className="md:hidden flex items-center px-4 py-3 gap-3">
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
            className="w-full rounded-2xl border-2 border-gray-300 bg-gray-50 px-4 py-3 pl-12 text-base font-medium focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
          />
          <Search className="absolute left-4 top-3.5 h-6 w-6 text-gray-400 pointer-events-none" />
        </div>
      </form>

      {/* Right Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div style={{
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))"
        }}>
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
