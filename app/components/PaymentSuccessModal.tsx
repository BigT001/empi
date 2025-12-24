"use client";

import { CheckCircle, X } from "lucide-react";
import Link from "next/link";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  orderReference: string;
  total: number;
  onClose: () => void;
}

export default function PaymentSuccessModal({
  isOpen,
  orderReference,
  total,
  onClose,
}: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition z-50"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Success Content */}
        <div className="bg-gradient-to-br from-lime-50 to-emerald-50 p-6 text-center">
          {/* Success Icon */}
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 mb-4 w-fit mx-auto shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Payment Successful!
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Your order has been confirmed.
          </p>

          {/* Order Details */}
          <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200 text-sm">
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-0.5">Reference Number</p>
              <p className="font-mono font-semibold text-lime-600 break-all">
                {orderReference}
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-0.5">Amount Paid</p>
              <p className="text-lg font-bold text-gray-900">
                ₦{total.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Production Message */}
          <div className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-200">
            <p className="text-xs text-orange-900 leading-relaxed">
              Your order is being processed. <span className="font-semibold">Production will start once payment is confirmed.</span> You can chat with our admin team for updates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="block w-full bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200 text-center text-sm"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition duration-200 text-center text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
