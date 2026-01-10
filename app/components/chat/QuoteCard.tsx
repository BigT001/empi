"use client";

import React from "react";

interface Message {
  _id: string;
  senderType: string;
  quotedPrice?: number;
  quotedDeliveryDate?: string;
  quotedVAT?: number;
  quotedTotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  content?: string;
  isFinalPrice?: boolean;
}

interface QuoteCardProps {
  msg: Message;
}

export function QuoteCard({ msg }: QuoteCardProps) {
  return (
    <div className="space-y-2 md:space-y-3">
      {msg.content && msg.content !== `Quote: ₦${msg.quotedPrice}` && (
        <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
      )}

      {msg.quotedPrice && (
        <div
          className={`space-y-1 md:space-y-2 pt-2 md:pt-3 border-t ${
            msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
          }`}
        >
          {/* Unit Price */}
          <div className="flex justify-between text-xs md:text-sm gap-3">
            <span className="opacity-90">Unit Price:</span>
            <span className="font-semibold">₦{Math.round(msg.quotedPrice).toLocaleString()}</span>
          </div>

          {/* Discount */}
          {msg.discountPercentage && msg.discountPercentage > 0 && (
            <div
              className={`flex justify-between text-xs md:text-sm gap-3 ${
                msg.senderType === 'customer' ? 'text-green-100' : 'text-green-600'
              }`}
            >
              <span className="opacity-90">Discount ({msg.discountPercentage}%):</span>
              <span className="font-semibold">-₦{Math.round(msg.discountAmount || 0).toLocaleString()}</span>
            </div>
          )}

          {/* VAT */}
          <div className="flex justify-between text-xs md:text-sm gap-3">
            <span className="opacity-90">VAT (7.5%):</span>
            <span className="font-semibold">₦{Math.round(msg.quotedVAT || 0).toLocaleString()}</span>
          </div>

          {/* Total */}
          <div
            className={`flex justify-between text-sm md:text-base font-bold border-t pt-1 md:pt-2 gap-3 ${
              msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
            }`}
          >
            <span>Total:</span>
            <span>₦{Math.round(msg.quotedTotal || 0).toLocaleString()}</span>
          </div>

          {/* Delivery Date */}
          {msg.quotedDeliveryDate && (
            <div
              className={`border-t pt-2 md:pt-3 ${
                msg.senderType === 'customer' ? 'border-white/30' : 'border-gray-300'
              }`}
            >
              <div className="bg-gradient-to-r from-orange-100/50 to-amber-100/50 rounded-lg p-2 md:p-3 border border-orange-200">
                <p className="text-xs text-gray-700 font-semibold mb-1">📅 Proposed Delivery Date:</p>
                <p
                  className={`text-sm md:text-base font-bold ${
                    msg.senderType === 'customer' ? 'text-white' : 'text-orange-700'
                  }`}
                >
                  {new Date(msg.quotedDeliveryDate).toLocaleDateString('en-NG', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
