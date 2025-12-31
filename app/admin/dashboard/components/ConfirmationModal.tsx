"use client";

import { AlertCircle } from "lucide-react";

interface ConfirmationModalProps {
  type: 'decline' | 'delete' | 'cancel' | 'approve';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({ type, onConfirm, onCancel }: ConfirmationModalProps) {
  const config = {
    decline: {
      icon: "bg-yellow-100 text-yellow-600",
      title: "Decline Order?",
      message: "This will decline the order and notify the customer via chat. This action can be undone by accepting the order later.",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      buttonText: "Decline"
    },
    cancel: {
      icon: "bg-orange-100 text-orange-600",
      title: "Cancel Order & Refund?",
      message: "This will cancel the production, stop the countdown, and process a full refund to the customer. They will be notified via chat.",
      buttonColor: "bg-orange-600 hover:bg-orange-700",
      buttonText: "Cancel & Refund"
    },
    delete: {
      icon: "bg-red-100 text-red-600",
      title: "Delete Order?",
      message: "This will permanently delete the order and all associated messages. This cannot be undone.",
      buttonColor: "bg-red-600 hover:bg-red-700",
      buttonText: "Delete"
    },
    approve: {
      icon: "bg-green-100 text-green-600",
      title: "Approve Order?",
      message: "This will approve the order and start production. The customer will be notified via chat.",
      buttonColor: "bg-green-600 hover:bg-green-700",
      buttonText: "Approve"
    }
  };

  const cfg = config[type];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className={`flex items-center justify-center w-12 h-12 ${cfg.icon} rounded-full mx-auto mb-4`}>
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{cfg.title}</h3>
        <p className="text-gray-600 text-center mb-6">{cfg.message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 ${cfg.buttonColor} text-white font-semibold rounded-lg transition`}
          >
            {cfg.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
