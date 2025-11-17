"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { getCart, clearCart } from "../../lib/cart";
import type { CartItem } from "../../lib/cart";

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

  const placeOrder = () => {
    setProcessing(true);
    setTimeout(() => {
      clearCart();
      setItems([]);
      setProcessing(false);
      setDone(true);
    }, 1000);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex flex-col">
        <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
            <Header />
            <nav className="flex items-center flex-1">
              <Navigation category={category} onCategoryChange={setCategory} currency={currency} onCurrencyChange={setCurrency} />
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Thank you — your order is placed</h1>
          <p className="text-gray-600 mb-6">We've received your order and will email confirmation shortly.</p>
          <Link href="/" className="bg-lime-600 text-white px-4 py-2 rounded">Back to Shop</Link>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          <Header />
          <nav className="flex items-center flex-1">
            <Navigation category={category} onCategoryChange={setCategory} currency={currency} onCurrencyChange={setCurrency} />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
            <Link href="/" className="inline-block bg-lime-600 text-white px-4 py-2 rounded">Shop Now</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <section className="space-y-4">
              <div className="p-4 border rounded">
                <h2 className="font-semibold mb-2">Billing Details</h2>
                <div className="grid grid-cols-1 gap-2">
                  <input placeholder="Full name" className="border rounded px-3 py-2" />
                  <input placeholder="Email" className="border rounded px-3 py-2" />
                  <input placeholder="Address" className="border rounded px-3 py-2" />
                  <input placeholder="City" className="border rounded px-3 py-2" />
                </div>
              </div>

              <div className="p-4 border rounded">
                <h2 className="font-semibold mb-2">Payment</h2>
                <div className="grid grid-cols-1 gap-2">
                  <input placeholder="Card number" className="border rounded px-3 py-2" />
                  <div className="flex gap-2">
                    <input placeholder="MM/YY" className="border rounded px-3 py-2 flex-1" />
                    <input placeholder="CVC" className="border rounded px-3 py-2 w-24" />
                  </div>
                </div>
              </div>
            </section>

            <aside className="p-4 border rounded">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                {items.map((it) => (
                  <div key={`${it.id}-${it.mode}`} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-600">{it.quantity} × {it.unitPrice.toFixed(2)}</div>
                    </div>
                    <div className="font-semibold">{(it.quantity * it.unitPrice).toFixed(2)}</div>
                  </div>
                ))}

                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">{subtotal.toFixed(2)}</span>
                </div>

                <button onClick={placeOrder} disabled={processing} className="w-full bg-lime-600 text-white px-4 py-2 rounded">
                  {processing ? "Processing…" : "Place Order"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
