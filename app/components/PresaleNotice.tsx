"use client";

import { AlertCircle } from "lucide-react";

interface PresaleNoticeProps {
  variant?: "banner" | "inline" | "alert" | "compact";
}

export const PresaleNotice = ({ variant = "inline" }: PresaleNoticeProps) => {
  switch (variant) {
    case "banner":
      return (
        <div className="bg-gradient-to-r from-lime-600 to-green-600 text-white h-14 px-4 flex items-center justify-center">
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-center">
            <span>All orders are PRE-SALES. Minimum 1 week delivery. Processing time varies by quantity & type.</span>
          </div>
        </div>
      );

    case "inline":
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">⏰ Pre-Sale Order</h3>
              <p className="text-sm text-amber-800 mt-1">
                All orders are processed as pre-sales. <strong>Minimum 1 week</strong> for delivery. Actual timeline depends on order quantity and type. You'll receive tracking updates as your order progresses.
              </p>
            </div>
          </div>
        </div>
      );

    case "alert":
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Pre-Sale Notice:</strong> Allow a minimum of <strong>1 week</strong> for order fulfillment. Larger or complex orders may take longer depending on quantity and type.
              </p>
            </div>
          </div>
        </div>
      );

    case "compact":
      return (
        <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-100 px-3 py-2 rounded-md mb-4">
          <span>
            Pre-sale order: <strong>Minimum 1 week delivery</strong>
          </span>
        </div>
      );

    default:
      return null;
  }
};
