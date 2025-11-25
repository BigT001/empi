"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface RentalPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RentalPolicyModal({ isOpen, onClose }: RentalPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="sticky top-4 right-4 float-right p-2 hover:bg-gray-100 rounded-full transition-colors z-10 mb-4"
        >
          <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 pt-8 pb-6 text-white">
          <h2 className="text-3xl font-bold mb-2">🎭 Rental Policy</h2>
          <p className="text-blue-50">Important terms and conditions for renting items</p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-6">
          {/* Caution Fee Section */}
          <div className="border-l-4 border-blue-500 pl-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">💰 Caution Fee</h3>
            <p className="text-gray-700 mb-3">
              <strong>50% of the total rental charge</strong> is required as a caution fee (security deposit).
            </p>
            <ul className="text-gray-700 space-y-2">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Collected at the time of rental</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Refunded when items are returned complete, on-time, and undamaged</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Refunds processed at 6pm after inspection</span>
              </li>
            </ul>
          </div>

          {/* Pick-up & Return Section */}
          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">📅 Duration of Rental</h3>
            <ul className="text-gray-700 space-y-2">
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span><strong>Earliest time to pick up:</strong> One date before use</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span><strong>Return timing:</strong> Next day after stated date of use, before the branch closes by 5pm</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span><strong>Late returns:</strong> Attract additional deductions from caution fee</span>
              </li>
            </ul>
          </div>

          {/* Late Return Section */}
          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">⏰ Delayed Items Penalties</h3>
            <p className="text-gray-700 mb-3">
              <strong>For every extra day delayed:</strong> An additional one-third (1/3) deduction from caution fee
            </p>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-900">
                <strong>Example:</strong> If your caution fee is ₦5,000 and you're 1 day late, you lose ₦1,667 (1/3 of ₦5,000). 
                The refund becomes ₦3,333 instead of ₦5,000.
              </p>
            </div>
          </div>

          {/* Condition Requirements Section */}
          <div className="border-l-4 border-purple-500 pl-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">✅ Return Conditions for Full Refund</h3>
            <p className="text-gray-700 mb-3">To receive your full caution fee back, items must be:</p>
            <ul className="text-gray-700 space-y-2">
              <li className="flex gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span><strong>Complete:</strong> All parts and accessories included</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span><strong>On-time:</strong> Returned before 5pm on the due date</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span><strong>Undamaged:</strong> No tears, stains, or damage</span>
              </li>
            </ul>
          </div>

          {/* Service Area Section */}
          <div className="border-l-4 border-orange-500 pl-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">📍 Service Area</h3>
            <p className="text-gray-700">
              <strong>Rental of items are only within Lagos State, Nigeria for now.</strong>
            </p>
            <p className="text-gray-600 text-sm mt-2">
              We are planning to expand to other states soon!
            </p>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">⚠️ Important Notes</h3>
            <ul className="space-y-2 text-blue-900 text-sm">
              <li className="flex gap-2">
                <span>•</span>
                <span>All caution fee refunds after items are returned are done at the end of the business day from 6pm</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Return deadline is strictly before 5pm to allow time for inspection</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Damaged items will result in deductions from your caution fee</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 rounded-b-2xl border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg transition"
          >
            Got It! 👍
          </button>
        </div>
      </div>
    </div>
  );
}
