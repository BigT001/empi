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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-lime-500 to-lime-600 px-6 pt-8 pb-6 text-white">
          <h2 className="text-2xl font-bold mb-2">🎉 Special Bulk Discounts!</h2>
          <p className="text-lime-50 text-sm">Order multiple sets and save big!</p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Discount Tiers */}
          <div className="space-y-4 mb-8">
            {/* Tier 1 */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-100">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white font-bold text-sm">
                  5%
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">3-5 Sets</p>
                <p className="text-sm text-gray-600">5% discount on your entire order</p>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-100">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-500 text-white font-bold text-sm">
                  7%
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">6-9 Sets</p>
                <p className="text-sm text-gray-600">7% discount on your entire order</p>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border-2 border-green-400 shadow-md">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-500 text-white font-bold text-sm">
                  10%
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">10+ Sets</p>
                <p className="text-sm text-gray-600">
                  🏆 10% discount on your entire order
                </p>
              </div>
            </div>
          </div>

          {/* CTA Text */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Stock your events with our premium costumes at unbeatable prices!
            </p>
            <p className="text-xs text-gray-500">
              Discounts apply automatically at checkout
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg transition-colors"
          >
            Got It! 👍
          </button>
        </div>
      </div>
    </div>
  );
}
