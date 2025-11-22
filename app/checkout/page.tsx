"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useBuyer } from "../context/BuyerContext";
import { ShoppingBag, AlertCircle, CreditCard, Truck, MapPin } from "lucide-react";

const SHIPPING_OPTIONS = {
  empi: { id: "empi", name: "EMPI Delivery", cost: 2500, estimatedDays: "2-5 business days" },
  self: { id: "self", name: "Self Pickup", cost: 0, estimatedDays: "Ready within 24 hours" },
};

export default function CheckoutPage() {
  const { items, clearCart, total } = useCart();
  const { buyer } = useBuyer();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [shippingOption, setShippingOption] = useState<"empi" | "self">("empi");

  useEffect(() => {
    setIsHydrated(true);
    // Load shipping preference from localStorage
    const saved = localStorage.getItem("empi_shipping_option");
    if (saved) setShippingOption(saved as "empi" | "self");
  }, []);

  if (!isHydrated) return null;

  // ===== EMPTY CART =====
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full text-center">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add items to proceed with checkout.</p>
            <Link href="/" className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-6 py-3 rounded-lg font-semibold">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ===== CALCULATE TOTALS =====
  const shippingCost = SHIPPING_OPTIONS[shippingOption].cost;
  const taxEstimate = total * 0.075;
  const totalAmount = total + shippingCost + taxEstimate;

  // ===== CHECKOUT FORM =====
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-6 w-6 text-purple-600" />
                <h1 className="text-3xl font-bold">Order Summary</h1>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="font-bold text-gray-900 mb-4">Items in Cart</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.mode}`} className="flex justify-between">
                      <span>{item.name} (x{item.quantity})</span>
                      <span className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping ({shippingOption === "empi" ? "EMPI" : "Pickup"})</span>
                  <span>{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (7.5%)</span>
                  <span>₦{taxEstimate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-purple-600">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-blue-900 mb-3 uppercase">Billing Information</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-semibold">Name:</span> {buyer?.fullName || "Guest Customer"}</p>
                  <p><span className="font-semibold">Email:</span> {buyer?.email || "Not provided"}</p>
                  <p><span className="font-semibold">Phone:</span> {buyer?.phone || "Not provided"}</p>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <p className="text-xs font-semibold text-green-900 mb-3 flex items-center gap-2">
                  {shippingOption === "empi" ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  Delivery Method
                </p>
                <div className="text-sm text-green-800 space-y-1">
                  <p><span className="font-semibold">Method:</span> {SHIPPING_OPTIONS[shippingOption].name}</p>
                  <p><span className="font-semibold">Est. Delivery:</span> {SHIPPING_OPTIONS[shippingOption].estimatedDays}</p>
                  <p><span className="font-semibold">Cost:</span> {shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</p>
                </div>
              </div>

              {/* Payment Notice */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>⏳ Payment Processing:</strong> Payment processing is currently being set up. Please contact support to complete your order.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link
                  href="/cart"
                  className="flex-1 inline-block text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  ← Back to Cart
                </Link>
                <Link
                  href="/"
                  className="flex-1 inline-block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Order Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Items Count</p>
                  <p className="font-semibold text-gray-900">{items.reduce((sum, i) => sum + i.quantity, 0)} items</p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Subtotal</p>
                  <p className="font-semibold text-gray-900">₦{total.toLocaleString()}</p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Shipping</p>
                  <p className="font-semibold text-gray-900">{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-gray-600 mb-1">Tax</p>
                  <p className="font-semibold text-gray-900">₦{taxEstimate.toLocaleString()}</p>
                </div>
                <div className="pt-4">
                  <p className="text-gray-600 text-xs mb-2">Total</p>
                  <p className="font-bold text-gray-900 text-xl">₦{totalAmount.toLocaleString()}</p>
                </div>
                <div className="pt-4">
                  <p className="text-gray-600 text-xs mb-2">Status</p>
                  <p className="text-xs text-yellow-600 font-semibold">🟡 Payment Setup In Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
