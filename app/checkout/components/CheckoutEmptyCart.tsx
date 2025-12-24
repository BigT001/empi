"use client";

import Link from "next/link";
import { Footer } from "@/app/components/Footer";

export function CheckoutEmptyCart() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4">
          <h1 className="text-2xl font-bold text-gray-900">🛒 Checkout</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
