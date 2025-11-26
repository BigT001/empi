"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AuthForm } from "./AuthForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (buyer: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-y-auto md:max-w-2xl animate-slideUpSmooth">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition z-10"
          aria-label="Close modal"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-8 pb-6 text-white">
          <h2 className="text-2xl font-bold">Sign In or Create Account</h2>
          <p className="text-purple-100 mt-1">Complete your profile to proceed with checkout</p>
        </div>

        {/* Form */}
        <div className="p-6 md:p-8">
          <AuthForm
            onSuccessfulAuth={(buyer) => {
              console.log("✅ Auth successful, closing modal");
              onAuthSuccess?.(buyer);
              onClose();
            }}
            onCancel={onClose}
            redirectToCheckout={false}
          />
        </div>
      </div>
    </div>
  );
}
