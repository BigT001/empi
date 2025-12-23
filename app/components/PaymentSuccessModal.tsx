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
        <div className="bg-gradient-to-br from-lime-50 to-emerald-50 p-8 text-center">
          {/* Success Icon */}
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-6 mb-6 w-fit mx-auto shadow-lg">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your order has been confirmed and is being processed.
          </p>

          {/* Order Details */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-1">Reference Number</p>
              <p className="text-lg font-mono font-semibold text-lime-600 break-all">
                {orderReference}
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{total.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <p className="text-sm text-blue-900 mb-2 font-semibold">What's Next?</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Invoice has been generated</li>
              <li>✓ Order confirmation email sent</li>
              <li>✓ Track delivery status</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200 text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
          <p className="text-xs text-gray-600">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
}
