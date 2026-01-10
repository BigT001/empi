"use client";

import React from "react";

interface DeliveryQuoteCardProps {
  quoteData: {
    transportType?: string;
    amount?: number;
  };
  senderName: string;
  senderType: string;
}

export function DeliveryQuoteCard({
  quoteData,
  senderName,
  senderType,
}: DeliveryQuoteCardProps) {
  return (
    <div className={`flex ${senderType === 'customer' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="bg-gradient-to-br from-lime-50 to-green-50 border-2 border-lime-600 rounded-xl p-3 space-y-2 w-full max-w-xs">
        <div className="text-center border-b border-lime-200 pb-2">
          <p className="text-xs font-semibold text-gray-600 mb-0.5">📨 {senderName}</p>
          <h2 className="text-base font-bold text-lime-700">🚚 DELIVERY QUOTE</h2>
        </div>

        <div className="bg-white rounded-lg p-2.5 space-y-1.5">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</p>
            <p className="text-lg font-bold text-lime-600">
              ₦{parseInt(String(quoteData.amount || '0')).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Type</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {quoteData.transportType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
