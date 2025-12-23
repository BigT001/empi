"use client";

import { useRouter } from "next/navigation";
import { Truck, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

interface DeliveryMethodModalProps {
  isOpen: boolean;
  orderId: string;
  orderReference: string;
  onClose: () => void;
  total: number;
}

export default function DeliveryMethodModal({
  isOpen,
  orderId,
  orderReference,
  onClose,
  total,
}: DeliveryMethodModalProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<"empi" | "self" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectDelivery = async (method: "empi" | "self") => {
    setSelectedMethod(method);
    setIsProcessing(true);
    setError(null);

    try {
      // Update order with delivery method
      const updateRes = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingType: method,
          status: "pending", // Set status to pending for logistics
        }),
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        console.error("❌ Order update failed with status:", updateRes.status);
        console.error("Error details:", errorData);
        throw new Error(errorData?.error || errorData?.details || "Failed to update order delivery method");
      }

      const responseData = await updateRes.json();
      console.log(`✅ Order updated with delivery method: ${method}`);
      console.log("Response:", responseData);

      // Close modal and navigate to buyer dashboard Orders tab
      onClose();
      router.push("/dashboard?tab=orders");
    } catch (err) {
      console.error("Error updating delivery method:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsProcessing(false);
      setSelectedMethod(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Choose Delivery Method</h2>
          <p className="text-blue-100">
            Select how you'd like to receive your order
          </p>
        </div>

        {/* Success Info */}
        <div className="bg-green-50 px-8 py-4 border-b border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Payment Confirmed</p>
              <p className="text-sm text-green-700">Reference: {orderReference}</p>
            </div>
          </div>
        </div>

        {/* Delivery Options */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EMPI Delivery Option */}
            <button
              onClick={() => handleSelectDelivery("empi")}
              disabled={isProcessing}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                selectedMethod === "empi"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-gray-100"
              } ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`p-4 rounded-full ${
                    selectedMethod === "empi"
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                >
                  <Truck
                    className={`h-8 w-8 ${
                      selectedMethod === "empi" ? "text-white" : "text-gray-600"
                    }`}
                  />
                </div>

                <div className="text-center">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    EMPI Delivery
                  </h3>
                  <p className="text-sm text-gray-600">
                    We deliver to your doorstep
                  </p>
                </div>

                {selectedMethod === "empi" && isProcessing && (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                )}
                {selectedMethod === "empi" && !isProcessing && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </button>

            {/* Self Pickup Option */}
            <button
              onClick={() => handleSelectDelivery("self")}
              disabled={isProcessing}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                selectedMethod === "self"
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-gray-300 hover:border-emerald-400 bg-gray-50 hover:bg-gray-100"
              } ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`p-4 rounded-full ${
                    selectedMethod === "self"
                      ? "bg-emerald-600"
                      : "bg-gray-300"
                  }`}
                >
                  <MapPin
                    className={`h-8 w-8 ${
                      selectedMethod === "self" ? "text-white" : "text-gray-600"
                    }`}
                  />
                </div>

                <div className="text-center">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Self Pickup
                  </h3>
                  <p className="text-sm text-gray-600">
                    Pick up from our store
                  </p>
                </div>

                {selectedMethod === "self" && isProcessing && (
                  <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                )}
                {selectedMethod === "self" && !isProcessing && (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                )}
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            You can change your delivery method in the logistics dashboard
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-2 text-gray-600 hover:text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close for now
          </button>
        </div>
      </div>
    </div>
  );
}
