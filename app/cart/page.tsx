"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useState } from "react";
import { CURRENCY_RATES } from "../components/constants";

export default function CartPage() {
  const { items, removeItem, clearCart, total } = useCart();
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");

  const formatPrice = (price: number) => {
    const rate = CURRENCY_RATES[currency]?.rate || 1;
    const converted = price / rate;
    const symbol = CURRENCY_RATES[currency]?.symbol || "₦";
    return `${symbol}${converted.toFixed(2)}`;
  };

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
              {items.map((item) => (
                <div key={`${item.id}-${item.mode}`} className="flex items-center gap-4 border p-4 rounded-lg">
                  {item.image ? (
                    <div className="w-24 h-24 relative">
                      <Image src={item.image} alt={item.name} fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{item.name}</h3>
                      <div className="text-sm text-gray-600">{item.mode === "rent" ? "Rent" : "Buy"}</div>
                    </div>
                    <div className="text-gray-700">Unit: {formatPrice(item.price)}</div>
                    <div className="text-gray-700">Qty: {item.quantity}</div>
                    <div className="text-gray-900 font-bold mt-2">Total: {formatPrice(item.price * item.quantity)}</div>
                  </div>
                  <div>
                    <button 
                      onClick={() => removeItem(item.id, item.mode)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="p-4 border rounded-lg h-max">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">{formatPrice(total)}</span>
                </div>
                <div className="text-sm text-gray-600">Taxes and shipping calculated at checkout.</div>
                <div className="flex flex-col gap-2">
                  <Link href="/checkout" className="bg-lime-600 text-white px-4 py-2 rounded text-center">Proceed to Checkout</Link>
                  <button 
                    onClick={clearCart}
                    className="border text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                  >
                    Clear Cart
                  </button>
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

