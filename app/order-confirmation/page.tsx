"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-4">
          Thank you for your order. You will receive a confirmation email shortly with your order details and tracking information.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block bg-lime-600 hover:bg-lime-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Continue Shopping
          </Link>
          <Link
            href="/cart"
            className="block bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
          >
            View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
