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
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    address: "",
    busStop: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleSelectDelivery = async (method: "empi" | "self") => {
    setSelectedMethod(method);
    
    if (method === "empi") {
      // Show delivery form for EMPI delivery
      setShowDeliveryForm(true);
    } else {
      // For self pickup, save immediately
      await saveDeliveryMethod(method);
    }
  };

  const saveDeliveryMethod = async (method: "empi" | "self") => {
    setIsProcessing(true);
    setError(null);

    try {
      // Update order with delivery method
      const updateRes = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingType: method,
          status: "ready",
          ...(method === "empi" && deliveryForm && {
            address: deliveryForm.address,
            busStop: deliveryForm.busStop,
            city: deliveryForm.city,
            state: deliveryForm.state,
            zipCode: deliveryForm.zipCode,
          }),
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

      // Send automatic message to buyer about delivery selection
      const messageContent = method === "empi" 
        ? `Your delivery address has been received and confirmed.\n\nAddress: ${deliveryForm.address}${deliveryForm.busStop ? '\nLandmark: ' + deliveryForm.busStop : ''}\n${deliveryForm.city}, ${deliveryForm.state}${deliveryForm.zipCode ? ' ' + deliveryForm.zipCode : ''}\n\nThe logistics team will contact you soon to arrange delivery.`
        : `You have selected Self Pickup for your order.\n\nOur team will notify you when your order is ready for pickup at one of our locations:\n- 22 Chi-Ben street, Ojo, Lagos\n- 22 Ejire street Suru Lere, Lagos, Nigeria`;
      
      try {
        const messageRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            orderNumber: orderReference,
            senderEmail: 'system@empi.com',
            senderName: 'EMPI System',
            senderType: 'admin',
            content: messageContent,
            messageType: 'system',
            recipientType: 'buyer',
          }),
        });

        if (!messageRes.ok) {
          console.warn('⚠️ Failed to send delivery confirmation message, but order was updated');
        } else {
          console.log('✅ Delivery confirmation message sent to buyer');
        }
      } catch (msgErr) {
        console.warn('⚠️ Error sending message:', msgErr);
      }

      // Show success message for EMPI delivery, otherwise redirect immediately
      if (method === "empi") {
        setShowSuccessMessage(true);
      } else {
        onClose();
        router.push("/dashboard?tab=orders");
      }
    } catch (err) {
      console.error("Error updating delivery method:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsProcessing(false);
      setSelectedMethod(null);
    }
  };

  const handleSubmitDeliveryForm = async () => {
    if (!deliveryForm.address || !deliveryForm.city || !deliveryForm.state) {
      setError("Please fill in all required fields");
      return;
    }
    
    await saveDeliveryMethod("empi");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        {/* Success Message */}
        {showSuccessMessage ? (
          <div className="flex flex-col items-center justify-center p-6 md:p-12 text-center">
            {/* Success Icon */}
            <div className="mb-4 md:mb-6">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full p-3 md:p-4 inline-flex">
                <CheckCircle className="h-12 md:h-16 w-12 md:w-16 text-white" />
              </div>
            </div>

            {/* Success Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
              Delivery Details Saved!
            </h2>

            {/* Success Messages */}
            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-gray-600">
              <p className="text-sm md:text-base">
                ✓ Our logistics team will reach out once your order is ready to be shipped
              </p>
              <p className="text-xs md:text-sm text-gray-500">
                We'll contact you with shipping details and delivery tracking information
              </p>
            </div>

            {/* Encouragement Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8 w-full">
              <p className="text-sm md:text-base font-semibold text-blue-900 mb-2 md:mb-3">
                📦 Track Your Order
              </p>
              <p className="text-xs md:text-sm text-blue-700">
                Check messages on your product card and visit the dashboard to track your order progress in real-time
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 md:gap-3 w-full">
              <button
                onClick={() => {
                  onClose();
                  router.push("/dashboard?tab=orders");
                }}
                className="w-full py-2.5 md:py-3 px-4 md:px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition text-sm md:text-base"
              >
                Go to Dashboard Orders
              </button>
              <button
                onClick={() => {
                  onClose();
                  router.push("/");
                }}
                className="w-full py-2.5 md:py-3 px-4 md:px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition text-sm md:text-base"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : showDeliveryForm && selectedMethod === "empi" ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-8 text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Delivery Address</h2>
              <p className="text-sm md:text-base text-blue-100">
                Please provide your delivery details
              </p>
            </div>

            {/* Delivery Form Content */}
            <div className="p-4 md:p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                  <p className="text-red-700 font-semibold text-sm md:text-base">Error</p>
                  <p className="text-red-600 text-xs md:text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3 md:space-y-4">
                {/* Street Address */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    value={deliveryForm.address}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                    placeholder="e.g., 123 Main Street"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                {/* Bus Stop */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Bus Stop / Landmark</label>
                  <input
                    type="text"
                    value={deliveryForm.busStop}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, busStop: e.target.value })}
                    placeholder="e.g., Near Lekki Mall"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={deliveryForm.city}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, city: e.target.value })}
                    placeholder="e.g., Lagos"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={deliveryForm.state}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, state: e.target.value })}
                    placeholder="e.g., Lagos State"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={deliveryForm.zipCode}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, zipCode: e.target.value })}
                    placeholder="e.g., 100001"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 md:px-8 py-3 md:py-4 border-t border-gray-200 flex gap-2 md:gap-3">
              <button
                onClick={() => {
                  setShowDeliveryForm(false);
                  setSelectedMethod(null);
                }}
                disabled={isProcessing}
                className="flex-1 py-2 text-xs md:text-sm text-gray-600 hover:text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={handleSubmitDeliveryForm}
                disabled={isProcessing}
                className="flex-1 py-2 px-3 md:px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm transition"
              >
                {isProcessing ? "Saving..." : "Confirm Address"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-8 text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Choose Delivery Method</h2>
              <p className="text-sm md:text-base text-blue-100">
                Select how you'd like to receive your order
              </p>
            </div>

            {/* Success Info */}
            <div className="bg-green-50 px-4 md:px-8 py-2.5 md:py-4 border-b border-green-200">
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm md:text-base text-green-900">Payment Confirmed</p>
                  <p className="text-xs md:text-sm text-green-700 break-all">Reference: {orderReference}</p>
                </div>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="p-4 md:p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                  <p className="text-red-700 font-semibold text-sm md:text-base">Error</p>
                  <p className="text-red-600 text-xs md:text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {/* EMPI Delivery Option */}
                <button
                  onClick={() => handleSelectDelivery("empi")}
                  disabled={isProcessing}
                  className={`relative p-4 md:p-6 rounded-xl border-2 transition-all duration-200 ${
                    selectedMethod === "empi"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-gray-100"
                  } ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <div className="flex flex-col items-center gap-2 md:gap-4">
                    <div
                      className={`p-2 md:p-4 rounded-full ${
                        selectedMethod === "empi"
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <Truck
                        className={`h-6 md:h-8 w-6 md:w-8 ${
                          selectedMethod === "empi" ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>

                    <div className="text-center">
                      <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2">
                        EMPI Delivery
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        We deliver to your doorstep
                      </p>
                    </div>

                    {selectedMethod === "empi" && !showDeliveryForm && (
                      <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
                    )}
                  </div>
                </button>

                {/* Self Pickup Option */}
                <button
                  onClick={() => handleSelectDelivery("self")}
                  disabled={isProcessing}
                  className={`relative p-4 md:p-6 rounded-xl border-2 transition-all duration-200 ${
                    selectedMethod === "self"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-300 hover:border-emerald-400 bg-gray-50 hover:bg-gray-100"
                  } ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <div className="flex flex-col items-center gap-2 md:gap-4">
                    <div
                      className={`p-2 md:p-4 rounded-full ${
                        selectedMethod === "self"
                          ? "bg-emerald-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <MapPin
                        className={`h-6 md:h-8 w-6 md:w-8 ${
                          selectedMethod === "self" ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>

                    <div className="text-center">
                      <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2">
                        Self Pickup
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        Pick up from our store
                      </p>
                    </div>

                    {selectedMethod === "self" && isProcessing && (
                      <Loader2 className="h-4 md:h-5 w-4 md:w-5 text-emerald-600 animate-spin" />
                    )}
                    {selectedMethod === "self" && !isProcessing && (
                      <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-emerald-600" />
                    )}
                  </div>
                </button>
              </div>

              <p className="text-center text-[10px] md:text-xs text-gray-500 mt-3 md:mt-6">
                You can change your delivery method in the logistics dashboard
              </p>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 md:px-8 py-2.5 md:py-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="w-full py-2 text-xs md:text-sm text-gray-600 hover:text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
