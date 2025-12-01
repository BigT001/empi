"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Truck, User, ArrowRight, X } from "lucide-react";

interface CheckoutValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationType: "rental_schedule" | "delivery_info" | "buyer_info";
  message: string;
}

export function CheckoutValidationModal({
  isOpen,
  onClose,
  validationType,
  message,
}: CheckoutValidationModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleGoToCart = () => {
    handleClose();
    router.push("/cart");
  };

  if (!isOpen) return null;

  // Determine icon and color based on validation type
  const getIconAndColor = () => {
    switch (validationType) {
      case "rental_schedule":
        return {
          icon: Clock,
          color: "purple",
          bgColor: "from-purple-100 to-purple-50",
          borderColor: "border-purple-300",
          textColor: "text-purple-900",
          lightText: "text-purple-700",
          buttonColor: "bg-purple-600 hover:bg-purple-700",
        };
      case "delivery_info":
        return {
          icon: Truck,
          color: "green",
          bgColor: "from-green-100 to-green-50",
          borderColor: "border-green-300",
          textColor: "text-green-900",
          lightText: "text-green-700",
          buttonColor: "bg-green-600 hover:bg-green-700",
        };
      case "buyer_info":
        return {
          icon: User,
          color: "blue",
          bgColor: "from-blue-100 to-blue-50",
          borderColor: "border-blue-300",
          textColor: "text-blue-900",
          lightText: "text-blue-700",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
        };
      default:
        return {
          icon: AlertCircle,
          color: "gray",
          bgColor: "from-gray-100 to-gray-50",
          borderColor: "border-gray-300",
          textColor: "text-gray-900",
          lightText: "text-gray-700",
          buttonColor: "bg-gray-600 hover:bg-gray-700",
        };
    }
  };

  const styles = getIconAndColor();
  const IconComponent = styles.icon;

  const getHeaderText = () => {
    switch (validationType) {
      case "rental_schedule":
        return "⏰ Pickup Schedule Required";
      case "delivery_info":
        return "🚚 Delivery Information Required";
      case "buyer_info":
        return "👤 Profile Information Required";
      default:
        return "Validation Required";
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border-2 ${styles.borderColor} max-w-md w-full transform transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${styles.bgColor} border-b-2 ${styles.borderColor} p-6 flex items-start justify-between`}>
          <div className="flex items-start gap-3 flex-1">
            <div className={`${styles.buttonColor.split(" ")[0]} text-white rounded-full p-3 flex-shrink-0`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${styles.textColor}`}>
                {getHeaderText()}
              </h2>
              <p className={`text-sm ${styles.lightText} mt-1`}>
                {validationType === "rental_schedule" &&
                  "Complete your rental pickup details"}
                {validationType === "delivery_info" &&
                  "Complete your delivery address"}
                {validationType === "buyer_info" &&
                  "Update your profile information"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`bg-white rounded-lg border-l-4 border-${styles.color}-600 p-4 mb-6`}>
            <p className="text-gray-700 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Info Box */}
          <div className={`bg-${styles.color}-50 rounded-lg p-4 mb-6 border border-${styles.color}-200`}>
            <p className={`text-sm ${styles.lightText} font-semibold mb-2`}>
              What you need to do:
            </p>
            <ul className={`text-sm ${styles.lightText} space-y-2`}>
              {validationType === "rental_schedule" && (
                <>
                  <li>✓ Select pickup date and time</li>
                  <li>✓ Select return date</li>
                  <li>✓ Choose pickup location (Iba or Surulere)</li>
                </>
              )}
              {validationType === "delivery_info" && (
                <>
                  <li>✓ Select your state</li>
                  <li>✓ Enter your delivery address</li>
                  <li>✓ Confirm the address location</li>
                </>
              )}
              {validationType === "buyer_info" && (
                <>
                  <li>✓ Enter your full name</li>
                  <li>✓ Enter your email address</li>
                  <li>✓ Enter your phone number</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleGoToCart}
            className={`flex-1 ${styles.buttonColor} text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
          >
            Go to Cart
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
