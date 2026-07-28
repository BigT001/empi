"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronRight, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";

const HIDDEN_ROUTES = ["/cart", "/checkout", "/admin"];

export function FloatingCart() {
  const pathname = usePathname();
  const { items, total } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const previousCount = useRef(itemCount);
  const hasMounted = useRef(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  useEffect(() => {
    if (!hasMounted.current) {
      previousCount.current = itemCount;
      hasMounted.current = true;
      return;
    }

    if (itemCount > previousCount.current) {
      setIsCelebrating(true);
      const timer = window.setTimeout(() => setIsCelebrating(false), 2600);
      previousCount.current = itemCount;
      return () => window.clearTimeout(timer);
    }

    previousCount.current = itemCount;
  }, [itemCount]);

  if (
    itemCount === 0 ||
    HIDDEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[70] flex justify-end px-4 md:hidden"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      aria-live="polite"
    >
      <Link
        href="/cart"
        aria-label={`View cart with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
        className={`floating-cart pointer-events-auto relative flex h-16 items-center overflow-hidden rounded-full border border-white/25 bg-zinc-950 text-white shadow-[0_18px_50px_rgba(0,0,0,0.34)] transition-[width,transform,background-color] duration-500 ease-out active:scale-95 ${
          isCelebrating ? "floating-cart--celebrating w-[min(21rem,calc(100vw-2rem))]" : "w-16"
        }`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-lime-500/25 via-transparent to-emerald-400/15" />
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <span className="absolute inset-2 rounded-full border border-lime-300/30" />
          {isCelebrating ? (
            <Check className="h-6 w-6 text-lime-300" strokeWidth={2.5} />
          ) : (
            <ShoppingBag className="h-6 w-6 text-lime-300" strokeWidth={2.2} />
          )}
          <span className="absolute right-1.5 top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-lime-400 px-1 text-[10px] font-black leading-none text-zinc-950 ring-2 ring-zinc-950">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        </span>

        <span
          className={`relative flex min-w-0 flex-1 items-center pr-3 transition-opacity duration-300 ${
            isCelebrating ? "opacity-100 delay-150" : "opacity-0"
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-300">
              <Sparkles className="h-3 w-3" />
              Added to your cart
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold">
              {itemCount} {itemCount === 1 ? "item" : "items"} · ₦{total.toLocaleString()}
            </span>
          </span>
          <span className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950">
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </span>
      </Link>
    </div>
  );
}
