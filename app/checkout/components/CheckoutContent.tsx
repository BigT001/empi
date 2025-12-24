"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, CreditCard, FileText, Lock, MapPin, ShoppingBag, Truck } from "lucide-react";
import { CheckoutValidationModal } from "@/app/components/CheckoutValidationModal";
import AuthModal from "@/app/components/AuthModal";

const SHIPPING_OPTIONS = {
  empi: { id: "empi", name: "EMPI Delivery", cost: 2500, estimatedDays: "2-5 business days" },
  self: { id: "self", name: "Self Pickup", cost: 0, estimatedDays: "Ready within 24 hours" },
};

interface CheckoutItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  mode: "buy" | "rent";
  image?: string;
  size?: string;
}

interface RentalSchedule {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  rentalDays: number;
}

interface DeliveryQuote {
  distance?: number;
  duration?: string;
  deliveryPoint?: {
    address?: string;
    city?: string;
    state?: string;
  };
}

interface OrderSummary {
  items?: CheckoutItem[];
  buySubtotal?: number;
  rentalTotal?: number;
  cautionFee?: number;
  discountAmount?: number;
  discountPercentage?: number;
  totalBuyQuantity?: number;
  shippingCost?: number;
  taxEstimate?: number;
  totalAmount?: number;
  rentalSchedule?: RentalSchedule;
  shippingOption?: string;
}

interface CustomOrderQuote {
  orderId: string;
  orderNumber: string;
  quotedTotal: number;
  quotedPrice?: number;
  quotedVAT?: number;
  discountPercentage?: number;
  discountAmount?: number;
  quantity?: number;
}

interface CustomOrderDetails {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  description: string;
  quantity: number;
  city: string;
  state?: string;
  designUrl?: string;
  designUrls?: string[];
}

interface CheckoutContentProps {
  items: CheckoutItem[];
  isFromQuote: boolean;
  customOrderQuote: CustomOrderQuote | null;
  customOrderDetails: CustomOrderDetails | null;
  rentalSchedule: RentalSchedule | null;
  deliveryQuote: DeliveryQuote | null;
  shippingOption: "empi" | "self";
  orderSummary: OrderSummary | null;
  createdOrderId: string | null;
  isProcessing: boolean;
  orderError: string | null;
  totalAmount: number;
  buySubtotal: number;
  buySubtotalAfterDiscount: number;
  subtotalForVAT: number;
  discountAmount: number;
  discountPercentage: number;
  cautionFee: number;
  taxEstimate: number;
  rentalTotal: number;
  totalBuyQuantity: number;
  validationModalOpen: boolean;
  authModalOpen: boolean;
  paymentProofUrl: string | null;
  onValidationModalClose: () => void;
  onAuthModalClose: () => void;
  onSetValidationModalOpen: (open: boolean, type: "rental_schedule" | "delivery_info" | "buyer_info", message: string) => void;
  onAuthSuccess: (buyer: any) => void;
  onPaymentProofUploaded: (url: string) => void;
  onProceedToPayment: () => void;
}

export default function CheckoutContent({
  items,
  isFromQuote,
  customOrderQuote,
  customOrderDetails,
  rentalSchedule,
  deliveryQuote,
  shippingOption,
  orderSummary,
  createdOrderId,
  isProcessing,
  orderError,
  totalAmount,
  buySubtotal,
  buySubtotalAfterDiscount,
  subtotalForVAT,
  discountAmount,
  discountPercentage,
  cautionFee,
  taxEstimate,
  rentalTotal,
  totalBuyQuantity,
  validationModalOpen,
  authModalOpen,
  paymentProofUrl,
  onValidationModalClose,
  onAuthModalClose,
  onSetValidationModalOpen,
  onAuthSuccess,
  onPaymentProofUploaded,
  onProceedToPayment,
}: CheckoutContentProps) {
  const itemCount = orderSummary?.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) ?? items.reduce((sum, i) => sum + i.quantity, 0);
  const shippingCost = orderSummary?.shippingCost ?? SHIPPING_OPTIONS[shippingOption].cost;

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-lime-600 to-lime-700 rounded-lg p-3">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
              Order Review
            </h1>
            <p className="text-gray-600">Step 2 of 2 - Review and Pay</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          {!isFromQuote && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Order Items ({itemCount})</h2>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.mode}`}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                            item.mode === "rent" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.mode === "rent" ? "🔄 Rental" : "🛍️ Buy"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {item.mode === "rent" ? (
                        <>
                          <p className="font-bold text-gray-900">₦{(item.price * item.quantity * (rentalSchedule?.rentalDays || 1)).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            ₦{item.price.toLocaleString()} × {item.quantity} qty × {rentalSchedule?.rentalDays || 1} days
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">₦{item.price.toLocaleString()} each</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Order Details with Image (Quote Mode) */}
          {isFromQuote && customOrderDetails && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order Item (1)</h2>
                  <p className="text-xs text-gray-500 mt-1">Custom Order</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Image Section - Main Picture Only */}
                <div className="md:col-span-1">
                  <div className="bg-gray-100 rounded-xl overflow-hidden">
                    {customOrderDetails.designUrl || customOrderDetails.designUrls?.[0] ? (
                      <img
                        src={customOrderDetails.designUrl || customOrderDetails.designUrls?.[0]}
                        alt={customOrderDetails.description}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center bg-gray-200 text-gray-500">
                        <div className="text-center">
                          <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No image available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Main design image</p>
                </div>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-4">
                  {/* Order Number & Name */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Order Number</p>
                    <p className="text-lg font-bold text-gray-900">{customOrderDetails.orderNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">Customer: {customOrderDetails.fullName}</p>
                  </div>

                  {/* Description */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{customOrderDetails.description}</p>
                  </div>

                  {/* Quantity & Location */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Quantity</p>
                      <p className="text-lg font-bold text-gray-900">{customOrderDetails.quantity} unit(s)</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Location</p>
                      <p className="text-sm text-gray-900">{customOrderDetails.city}</p>
                      {customOrderDetails.state && <p className="text-sm text-gray-600">{customOrderDetails.state}</p>}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-transparent rounded-lg p-4 pt-4 border-t border-gray-200 mt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Contact Information</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">Email:</span>
                        <span className="text-sm text-gray-900">{customOrderDetails.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">Phone:</span>
                        <span className="text-sm text-gray-900">{customOrderDetails.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Order Quote (from chat Pay Now) */}
          {isFromQuote && customOrderQuote && (
            <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl shadow-sm border border-lime-300 p-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-lime-100 rounded-lg p-3">
                  <FileText className="h-5 w-5 text-lime-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Custom Order Quote</h2>
                  <p className="text-sm text-gray-600 mt-1">{customOrderQuote.orderNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Unit Price */}
                <div className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-lime-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Unit Price</p>
                    <p className="text-xs text-gray-500 mt-1">Per item quoted by admin</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">₦{customOrderQuote.quotedPrice?.toLocaleString() || "0"}</p>
                    <p className="text-xs text-gray-600">× {customOrderQuote.quantity || 1}</p>
                  </div>
                </div>

                {/* Discount (if applicable) */}
                {(customOrderQuote?.discountPercentage ?? 0) > 0 && (
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div>
                      <p className="text-sm font-semibold text-green-700">Discount ({customOrderQuote.discountPercentage}%)</p>
                      <p className="text-xs text-green-600 mt-1">Special offer from admin</p>
                    </div>
                    <p className="font-bold text-lg text-green-700">-₦{customOrderQuote.discountAmount?.toLocaleString() || "0"}</p>
                  </div>
                )}

                {/* VAT */}
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">VAT (7.5%)</p>
                    <p className="text-xs text-blue-600 mt-1">Tax on quoted amount</p>
                  </div>
                  <p className="font-bold text-lg text-blue-700">₦{customOrderQuote.quotedVAT?.toLocaleString() || "0"}</p>
                </div>

                {/* Total Amount */}
                <div className="pt-4 bg-gradient-to-br from-lime-100 to-green-100 rounded-xl p-4 border border-lime-400">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Amount to Pay</p>
                  <p className="font-black text-4xl bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                    ₦{customOrderQuote.quotedTotal?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rental Schedule (if applicable) */}
          {rentalSchedule && items.some((i) => i.mode === "rent") && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Rental Schedule</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/60 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pickup</p>
                  <p className="font-bold text-gray-900">{rentalSchedule.pickupDate}</p>
                  <p className="text-sm text-gray-700 font-semibold">at {rentalSchedule.pickupTime}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Return</p>
                  <p className="font-bold text-gray-900">{rentalSchedule.returnDate}</p>
                  <p className="text-sm text-gray-700 font-semibold">
                    {rentalSchedule.rentalDays} {rentalSchedule.rentalDays === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Information (if EMPI delivery) */}
          {shippingOption === "empi" && deliveryQuote && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Delivery Details</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/60 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Distance</p>
                  <p className="font-bold text-gray-900 text-lg">{deliveryQuote.distance?.toFixed(1) || "N/A"} km</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Estimated Time</p>
                  <p className="font-bold text-gray-900 text-lg">{deliveryQuote.duration || "N/A"}</p>
                </div>
                <div className="md:col-span-2 bg-white/60 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Delivery Address</p>
                  <p className="font-semibold text-gray-900">{deliveryQuote.deliveryPoint?.address || "Not specified"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {orderError && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Payment Error</p>
                <p className="text-red-800 text-sm">{orderError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons - only show if no order created yet */}
          {!createdOrderId && !isProcessing && (
            <div className="flex gap-3 pt-4">
              <Link
                href="/cart"
                className="flex-1 inline-block text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
              >
                ← Back to Cart
              </Link>
              <button
                onClick={onProceedToPayment}
                className="flex-1 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-bold px-6 py-4 rounded-xl transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                💳 Proceed to Payment
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="flex gap-3 pt-4">
              <div className="flex-1 bg-gray-100 text-gray-600 font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Processing...
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Order Summary Sidebar */}
            <div
              className={`${
                isFromQuote ? "bg-gradient-to-br from-lime-50 to-green-50 border-lime-300" : "bg-white border-gray-100"
              } rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow duration-300`}
            >
              <h3 className="font-bold text-gray-900 mb-6 text-lg">{isFromQuote ? "Quote Summary" : "Order Summary"}</h3>

              <div className="space-y-4">
                {isFromQuote && customOrderQuote ? (
                  <>
                    {/* Quote Summary */}
                    <div className="pb-4 border-b border-lime-200">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Quote Details</p>
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Order Number:</span>
                          <span className="font-semibold text-gray-900">{customOrderQuote.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Quantity:</span>
                          <span className="font-semibold text-gray-900">{customOrderQuote.quantity || 1}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Breakdown for Quote */}
                    <div className="pb-4 border-b border-lime-200">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Pricing Breakdown</p>

                      {/* Unit Price */}
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">Unit Price</p>
                        <p className="font-bold text-gray-900">₦{customOrderQuote.quotedPrice?.toLocaleString() || "0"}</p>
                      </div>

                      {/* Discount */}
                      {(customOrderQuote?.discountPercentage ?? 0) > 0 && (
                        <div className="bg-green-50 p-3 rounded-lg mb-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-semibold text-green-700">Discount ({customOrderQuote.discountPercentage}%)</p>
                            <p className="font-bold text-green-700">-₦{customOrderQuote.discountAmount?.toLocaleString() || "0"}</p>
                          </div>
                        </div>
                      )}

                      {/* VAT */}
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">VAT (7.5%)</p>
                        <p className="font-bold text-gray-900">₦{customOrderQuote.quotedVAT?.toLocaleString() || "0"}</p>
                      </div>
                    </div>

                    {/* Total for Quote */}
                    <div className="pt-4 bg-gradient-to-br from-lime-100 to-green-100 rounded-xl p-4 border border-lime-400">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Amount</p>
                      <p className="font-black text-3xl bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                        ₦{customOrderQuote.quotedTotal?.toLocaleString() || "0"}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Status</p>
                      </div>
                      <p className="text-sm text-green-700 font-semibold">✅ Ready for Payment</p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Item Breakdown */}
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Items Breakdown</p>
                      <div className="space-y-3">
                        {(orderSummary?.items || items).map((item) => (
                          <div key={`${item.id}-${item.mode}`} className="text-sm bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-700 font-medium">{item.name}</span>
                              <span className="font-semibold text-gray-900">
                                {item.mode === "rent"
                                  ? `₦${(item.price * item.quantity * (orderSummary?.rentalSchedule?.rentalDays || rentalSchedule?.rentalDays || 1)).toLocaleString()}`
                                  : `₦${(item.price * item.quantity).toLocaleString()}`}
                              </span>
                            </div>
                            {item.mode === "rent" ? (
                              <div className="text-xs text-gray-600 mt-2 space-y-1">
                                <div>
                                  Qty: {item.quantity} × Price: ₦{item.price.toLocaleString()} × Days:{" "}
                                  {orderSummary?.rentalSchedule?.rentalDays || rentalSchedule?.rentalDays || 1}
                                </div>
                                <div className="text-purple-700 font-semibold">
                                  = ₦{(item.price * item.quantity * (orderSummary?.rentalSchedule?.rentalDays || rentalSchedule?.rentalDays || 1)).toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-600 mt-2">Qty: {item.quantity} × ₦{item.price.toLocaleString()}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="pb-4 border-b border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">Subtotal</p>
                        <p className="font-bold text-gray-900">₦{buySubtotal.toLocaleString()}</p>
                      </div>

                      {/* Bulk Discount (if applicable) */}
                      {discountPercentage > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 p-3 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-semibold text-green-700">🎉 Bulk Discount ({discountPercentage}%)</p>
                            <p className="font-bold text-green-700">-₦{discountAmount.toLocaleString()}</p>
                          </div>
                          <p className="text-xs text-green-600">Applied on {totalBuyQuantity} buy items</p>

                          {/* Subtotal after discount */}
                          <div className="border-t border-green-300 pt-2 flex justify-between items-center">
                            <p className="text-xs font-semibold text-green-800">After Discount</p>
                            <p className="font-bold text-green-800">₦{buySubtotalAfterDiscount.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Caution Fee (if applicable) */}
                    {cautionFee > 0 && (
                      <div className="pb-4 border-b border-gray-200">
                        <p className="text-sm text-amber-700 font-semibold mb-1 flex items-center gap-2">
                          🛡️ Caution Fee (50%)
                        </p>
                        <p className="font-bold text-amber-700 text-lg">₦{cautionFee.toLocaleString()}</p>
                        <p className="text-xs text-amber-600 mt-1">Applied on rental items</p>
                      </div>
                    )}

                    {/* Shipping */}
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Shipping</p>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">{SHIPPING_OPTIONS[shippingOption].name}</span>
                        <span className="font-bold text-gray-900">{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
                      </div>
                    </div>

                    {/* VAT */}
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">VAT (7.5%)</p>
                      <p className="font-bold text-gray-900">₦{taxEstimate.toLocaleString()}</p>
                    </div>

                    {/* Total */}
                    <div className="pt-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Amount</p>
                      <p className="font-black text-3xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        ₦{totalAmount.toLocaleString()}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Status</p>
                      </div>
                      <p className="text-sm text-green-700 font-semibold">✅ Ready for Payment</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Security Badge */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-4 w-4 text-green-600" />
                <p className="text-xs font-bold text-green-900 uppercase tracking-wide">Secure Transfer</p>
              </div>
              <p className="text-xs text-green-800">Your payment goes directly to our verified bank account.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Modal - Checkout Requirements */}
      <CheckoutValidationModal
        isOpen={validationModalOpen}
        onClose={onValidationModalClose}
        validationType={"rental_schedule"}
        message=""
      />

      {/* Auth Modal - Mobile Login/Signup */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={onAuthModalClose}
        onAuthSuccess={(buyer) => {
          console.log("✅ User authenticated:", buyer);
          onAuthSuccess(buyer);
        }}
      />
    </>
  );
}
