"use client";

import { useNotification } from "@/app/context/NotificationContext";
import { CheckCircle2, MessageCircle, FileText, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PaymentApprovedModal() {
  const { notification, dismissNotification } = useNotification();
  const router = useRouter();

  if (!notification || notification.type !== 'payment_approved') {
    return null;
  }

  const handleChatClick = () => {
    dismissNotification();
    router.push(`/dashboard?tab=orders&orderId=${notification.orderId}`);
  };

  const handleViewInvoice = () => {
    dismissNotification();
    router.push(`/dashboard?tab=invoices`);
  };

  const handleContinueShopping = () => {
    dismissNotification();
    router.push('/');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-full p-3">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <button
              onClick={dismissNotification}
              className="text-white/80 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-2xl font-bold">Payment Approved! 🎉</h2>
          <p className="text-green-100 text-sm mt-2">Your order has been confirmed by our admin</p>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs text-gray-600 mb-1">Order Number</p>
            <p className="font-bold text-lg text-gray-900">{notification.orderNumber}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Total Amount Confirmed</p>
            <p className="font-bold text-lg text-gray-900">₦{notification.amount.toLocaleString('en-NG')}</p>
          </div>

          {notification.invoiceNumber && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-xs text-gray-600 mb-1">Invoice Number</p>
              <p className="font-bold text-lg text-gray-900">{notification.invoiceNumber}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 text-center">
            Your payment has been received and verified. Your order is now being processed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-6 space-y-3 border-t border-gray-200">
          <button
            onClick={handleViewInvoice}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            View Invoice
          </button>

          <button
            onClick={handleContinueShopping}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
