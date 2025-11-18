"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCart, removeFromCart, clearCart } from "../../lib/cart";
import type { CartItem } from "../../lib/cart";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");

  useEffect(() => {
    setItems(getCart());
  }, []);

  const handleRemove = (id: string, mode?: "buy" | "rent") => {
    const next = removeFromCart(id, mode);
    setItems(next);
  };

  const handleClear = () => {
    clearCart();
    setItems([]);
  };

  const total = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Header with Logo and Navigation */}
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          {/* Logo - from Header */}
          <Header />
          
          {/* Navigation */}
          <nav className="flex items-center flex-1">
            <Navigation 
              category={category}
              onCategoryChange={setCategory}
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
            <Link href="/" className="inline-block bg-lime-600 text-white px-4 py-2 rounded">Shop Now</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {items.map((it) => (
                <div key={`${it.id}-${it.mode}`} className="flex items-center gap-4 border p-4 rounded-lg">
                  {it.image ? (
                    <div className="w-24 h-24 relative">
                      <Image src={it.image} alt={it.name} fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{it.name}</h3>
                      <div className="text-sm text-gray-600">{it.mode === "rent" ? "Rent" : "Buy"}</div>
                    </div>
                    <div className="text-gray-700">Unit: {it.unitPrice.toFixed(2)}</div>
                    <div className="text-gray-700">Qty: {it.quantity}</div>
                    <div className="text-gray-900 font-bold mt-2">Total: {(it.unitPrice * it.quantity).toFixed(2)}</div>
                  </div>
                  <div>
                    <button onClick={() => handleRemove(it.id, it.mode)} className="text-sm text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="p-4 border rounded-lg h-max">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">{total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">Taxes and shipping calculated at checkout.</div>
                <div className="flex flex-col gap-2">
                  <Link href="/checkout" className="bg-lime-600 text-white px-4 py-2 rounded text-center">Proceed to Checkout</Link>
                  <button onClick={handleClear} className="border text-gray-700 px-4 py-2 rounded">Clear Cart</button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

