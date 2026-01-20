'use client';

import { Check } from "lucide-react";

interface ReadyForDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ReadyForDeliveryModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ReadyForDeliveryModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="border-4 border-teal-500 bg-white rounded-2xl shadow-2xl max-w-sm mx-4 p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Checkmark Circle */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto bg-teal-100">
          <Check className="h-8 w-8 text-teal-600" strokeWidth={3} />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Order Items Ready & Completed?
        </h2>
        
        {/* Message */}
        <p className="text-center text-gray-700 text-base leading-relaxed">
          Are you sure the order items are ready and completed? This will move the order to logistics for delivery.
        </p>
        
        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            No, Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-white font-bold rounded-lg transition bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {isLoading ? 'Processing...' : 'Yes, Ready'}
          </button>
        </div>
      </div>
    </div>
  );
}
