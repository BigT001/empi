"use client";

import { CreditCard } from "lucide-react";

export function CheckoutHeader() {
  return (
    <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
      <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4">
        <h1 className="text-2xl font-bold text-gray-900">💳 Checkout</h1>
      </div>
    </header>
  );
}
