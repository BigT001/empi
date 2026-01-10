"use client";

import React, { useState } from "react";

interface SendQuoteFormProps {
  onSubmit: (quotePrice: string, deliveryDate: string, isFinalPrice: boolean) => Promise<void>;
  isSubmitting: boolean;
}

export function SendQuoteForm({
  onSubmit,
  isSubmitting,
}: SendQuoteFormProps) {
  const [quotePrice, setQuotePrice] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isFinalPrice, setIsFinalPrice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(quotePrice, deliveryDate, isFinalPrice);
    setQuotePrice("");
    setDeliveryDate("");
    setIsFinalPrice(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Price Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 md:p-4 border border-blue-200">
          <label className="block text-sm font-semibold text-blue-900 mb-2">💰 Unit Price (₦)</label>
          <input
            type="number"
            value={quotePrice}
            onChange={(e) => setQuotePrice(e.target.value)}
            placeholder="Enter price"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Delivery Date Section */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-100/50 rounded-lg p-3 md:p-4 border border-orange-200">
          <label className="block text-sm font-semibold text-orange-900 mb-2">📅 Delivery Date</label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Checkbox for Final Price */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isFinalPrice}
          onChange={(e) => setIsFinalPrice(e.target.checked)}
          className="w-4 h-4 rounded"
          disabled={isSubmitting}
        />
        <span className="text-sm font-medium text-gray-700">Mark as final price</span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting || !quotePrice || !deliveryDate}
        className="w-full py-2 px-4 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
      >
        {isSubmitting ? "Sending..." : "✓ Send Quote"}
      </button>
    </form>
  );
}
