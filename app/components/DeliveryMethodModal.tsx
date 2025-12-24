"use client";

import { useRouter } from "next/navigation";
import { Truck, MapPin, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import DeliveryDetailsForm, { DeliveryDetails } from "@/app/components/DeliveryDetailsForm";

interface DeliveryMethodModalProps {
  isOpen: boolean;
  orderId: string;
  orderReference: string;
  onClose: () => void;
  total: number;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerName?: string;
  onDeliveryConfirmed?: () => void; // Callback to show success modal
}

export default function DeliveryMethodModal({
  isOpen,
  orderId,
  orderReference,
  onClose,
  total,
  buyerEmail = "",
  buyerPhone = "",
  buyerName = "",
  onDeliveryConfirmed,
}: DeliveryMethodModalProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<"empi" | "self" | null>(null);
  const [confirmedMethod, setConfirmedMethod] = useState<"empi" | "self" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeliveryDetailsForm, setShowDeliveryDetailsForm] = useState(false);

  if (!isOpen) return null;

  const handleConfirmDelivery = async (method: "empi" | "self") => {
    // If EMPI delivery, show the delivery details form first
    if (method === "empi") {
      setSelectedMethod(method);
      setShowDeliveryDetailsForm(true);
      return;
    }

    // For self-pickup, proceed directly
    setConfirmedMethod(method);
    setIsProcessing(true);
    setError(null);

    try {
      // Update order with delivery method
      const updateRes = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingType: method,
          deliveryOption: method === "self" ? "pickup" : "empi",
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

      // Call the callback to show success modal instead of immediate navigation
      if (onDeliveryConfirmed) {
        onDeliveryConfirmed();
      } else {
        // Fallback: close modal and navigate to buyer dashboard Orders tab
        onClose();
        router.push("/dashboard?tab=orders");
      }
    } catch (err) {
      console.error("Error updating delivery method:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsProcessing(false);
      setConfirmedMethod(null);
    }
  };

  const handleDeliveryDetailsSubmit = async (details: DeliveryDetails) => {
    setConfirmedMethod("empi");
    setIsProcessing(true);
    setError(null);

    try {
      // Update order with delivery method and details
      const updateRes = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingType: "empi",
          deliveryOption: "empi",
          deliveryDetails: details,
          status: "pending", // Set status to pending for logistics
        }),
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        console.error("❌ Order update failed with status:", updateRes.status);
        console.error("Error details:", errorData);
        throw new Error(errorData?.error || errorData?.details || "Failed to update order delivery details");
      }

      const responseData = await updateRes.json();
      console.log("✅ Order updated with delivery details");
      console.log("Response:", responseData);

      // Call the callback to show success modal instead of immediate navigation
      if (onDeliveryConfirmed) {
        onDeliveryConfirmed();
      } else {
        // Fallback: close modal and navigate to buyer dashboard Orders tab
        onClose();
        router.push("/dashboard?tab=orders");
      }
    } catch (err) {
      console.error("Error updating delivery details:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsProcessing(false);
      setConfirmedMethod(null);
    }
  };

  const handleSelectMethod = (method: "empi" | "self") => {
    setSelectedMethod(method);
  };

  const handleBack = () => {
    setSelectedMethod(null);
    setShowDeliveryDetailsForm(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Choose Delivery Method</h2>
          <p className="text-blue-100 text-sm">
            Select how you'd like to receive your order
          </p>
        </div>

        {/* Success Info */}
        <div className="bg-green-50 px-6 py-3 border-b border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 text-sm">Payment Confirmed</p>
              <p className="text-xs text-green-700">Reference: {orderReference}</p>
            </div>
          </div>
        </div>

        {/* Delivery Options or Detail View */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {showDeliveryDetailsForm && selectedMethod === "empi" ? (
            // Show Delivery Details Form for EMPI
            <div>
              <button
                onClick={handleBack}
                disabled={isProcessing}
                className="text-blue-600 hover:text-blue-700 font-semibold text-xs mb-4 flex items-center gap-2 disabled:opacity-50"
              >
                ← Back to options
              </button>
              <DeliveryDetailsForm
                onSubmit={handleDeliveryDetailsSubmit}
                onCancel={handleBack}
                isLoading={isProcessing}
                buyerPhone={buyerPhone}
                title="Delivery Address Details"
              />
            </div>
          ) : selectedMethod ? (
            // Detail View - Show after selection
            <>
              <div className="mb-6">
                <button
                  onClick={handleBack}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-xs mb-4 flex items-center gap-2"
                >
                  ← Back to options
                </button>

                {selectedMethod === "empi" ? (
                  // EMPI Delivery Details
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-blue-600 p-2 rounded-full flex-shrink-0">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">EMPI Delivery</h3>
                        <p className="text-gray-600 text-sm mt-0.5">Premium doorstep delivery service</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          What's Included
                        </h4>
                        <ul className="space-y-1 text-gray-700 text-xs ml-6">
                          <li>✓ Delivery to your doorstep</li>
                        </ul>
                      </div>

                      <div className="bg-blue-100 rounded-lg p-3 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-700 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-900">
                          <p className="font-semibold mb-0.5">Next Steps:</p>
                          <p>Our logistics team will send you a delivery quote and contact you within 24 hours to confirm delivery details and arrange a convenient time.</p>
                          <p className="mt-2"><strong>💡 Tip:</strong> Check your order card for messages from our logistics team.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Self Pickup Details
                  <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-emerald-600 p-2 rounded-full flex-shrink-0">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Self Pickup</h3>
                        <p className="text-gray-600 text-sm mt-0.5">Arrange pickup at your convenience</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          How It Works
                        </h4>
                        <ul className="space-y-1 text-gray-700 text-xs ml-6">
                          <li>✓ You arrange pickup from our store</li>
                          <li>✓ No additional delivery charges</li>
                          <li>✓ Flexible pickup schedule</li>
                          <li>✓ Contact our team to arrange details</li>
                        </ul>
                      </div>

                      <div className="bg-emerald-100 rounded-lg p-3 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-900">
                          <p className="font-semibold mb-0.5">How You'll Receive Your Quote:</p>
                          <p>Our logistics team will send you a delivery quote. However, for self-pickup, <strong>you'll arrange the pickup directly without paying additional logistics fees</strong>. Simply contact us to schedule a convenient time.</p>
                          <p className="mt-2"><strong>💡 Tip:</strong> Check your order card for messages from our logistics team.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Button */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleBack}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Choose Different
                </button>
                <button
                  onClick={() => {
                    if (selectedMethod === "empi") {
                      handleConfirmDelivery("empi");
                    } else {
                      handleConfirmDelivery(selectedMethod!);
                    }
                  }}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg text-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isProcessing && confirmedMethod === selectedMethod && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isProcessing && confirmedMethod === selectedMethod ? (selectedMethod === "empi" ? "Saving Details..." : "Confirming...") : (selectedMethod === "empi" ? "Add Delivery Details" : "Confirm Selection")}
                </button>
              </div>
            </>
          ) : (
            // Option Selection View
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* EMPI Delivery Option */}
                <button
                  onClick={() => handleSelectMethod("empi")}
                  disabled={isProcessing}
                  className={`relative p-5 rounded-xl border-2 transition-all duration-200 ${
                    selectedMethod === "empi"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-gray-100"
                  } ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`p-3 rounded-full ${
                        selectedMethod === "empi"
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <Truck
                        className={`h-6 w-6 ${
                          selectedMethod === "empi" ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>

                    <div className="text-center">
                      <h3 className="font-bold text-base text-gray-900 mb-1">
                        EMPI Delivery
                      </h3>
                      <p className="text-xs text-gray-600">
                        We deliver to your doorstep
                      </p>
                    </div>
                  </div>
                </button>

                {/* Self Pickup Option */}
                <button
                  onClick={() => handleSelectMethod("self")}
                  disabled={isProcessing}
                  className={`relative p-5 rounded-xl border-2 transition-all duration-200 ${
                    selectedMethod === "self"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-300 hover:border-emerald-400 bg-gray-50 hover:bg-gray-100"
                  } ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`p-3 rounded-full ${
                        selectedMethod === "self"
                          ? "bg-emerald-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <MapPin
                        className={`h-6 w-6 ${
                          selectedMethod === "self" ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>

                    <div className="text-center">
                      <h3 className="font-bold text-base text-gray-900 mb-1">
                        Self Pickup
                      </h3>
                      <p className="text-xs text-gray-600">
                        Pick up from our store
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-6">
                You can change your delivery method in the logistics dashboard
              </p>
            </>
          )}
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
