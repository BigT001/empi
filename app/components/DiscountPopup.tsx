"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface DiscountPopupProps {
  intervalMinutes?: number;
}

export function DiscountPopup({ intervalMinutes = 7 }: DiscountPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenOnce, setHasSeenOnce] = useState(false);

  useEffect(() => {
    const POPUP_KEY = "empi_discount_popup_closed";
    const POPUP_INTERVAL_KEY = "empi_discount_popup_interval";

    // Check if user has seen popup before
    const lastClosedTime = localStorage.getItem(POPUP_INTERVAL_KEY);
    const wasClosedBefore = localStorage.getItem(POPUP_KEY) === "true";

    // Show popup on first visit or if interval has passed
    const shouldShow = () => {
      if (!wasClosedBefore) {
        return true; // First visit - always show
      }

      if (!lastClosedTime) {
        return true; // No interval data yet
      }

      const lastTime = parseInt(lastClosedTime, 10);
      const now = Date.now();
      const minutesElapsed = (now - lastTime) / (1000 * 60);

      return minutesElapsed >= intervalMinutes;
    };

    if (shouldShow()) {
      setIsOpen(true);
      setHasSeenOnce(true);
    }
  }, [intervalMinutes]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("empi_discount_popup_closed", "true");
    localStorage.setItem("empi_discount_popup_interval", Date.now().toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Popup Content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-lime-500 to-lime-600 px-5 pt-5 pb-4 text-white rounded-t-xl">
          <h2 className="text-lg font-bold mb-1">🎉 Special Bulk Discounts!</h2>
          <p className="text-lime-50 text-xs">Order multiple sets and save big!</p>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {/* Discount Tiers */}
          <div className="space-y-2.5 mb-5">
            {/* Tier 1 */}
            <div className="flex items-start gap-3 p-2.5 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-100">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold text-xs">
                  5%
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">3-5 Sets</p>
                <p className="text-xs text-gray-600">5% discount on entire order</p>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="flex items-start gap-3 p-2.5 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-100">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500 text-white font-bold text-xs">
                  7%
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">6-9 Sets</p>
                <p className="text-xs text-gray-600">7% discount on entire order</p>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="flex items-start gap-3 p-2.5 bg-gradient-to-r from-green-50 to-transparent rounded-lg border-2 border-green-400 shadow-sm">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white font-bold text-xs">
                  10%
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">10+ Sets</p>
                <p className="text-xs text-gray-600">
                  🏆 10% discount on entire order
                </p>
              </div>
            </div>
          </div>

          {/* CTA Text */}
          <div className="text-center border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-600 mb-2">
              Stock your events at unbeatable prices!
            </p>
            <p className="text-xs text-gray-500">
              Discounts apply at checkout
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50 px-5 py-3 rounded-b-xl flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-3 py-2 text-gray-700 font-semibold text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleClose}
            className="flex-1 px-3 py-2 bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Got It! 👍
          </button>
        </div>
      </div>
    </div>
  );
}
