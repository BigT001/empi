"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import {
  CheckCircle,
  Package,
  Truck,
  Calendar,
  DollarSign,
  Download,
  Home,
  AlertCircle,
  Loader,
} from "lucide-react";

interface Order {
  _id: string;
  reference: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: any[];
  shipping: {
    option: string;
    cost: number;
  };
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  status: string;
  createdAt: string;
}

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!reference) {
      setError("No order reference provided");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?ref=${reference}`);
        if (!res.ok) {
          // If not found, wait a moment and retry (order might still be saving)
          if (res.status === 404) {
            console.log("Order not found yet, retrying in 2 seconds...");
            setTimeout(() => {
              fetchOrder(); // Retry
            }, 2000);
            return;
          }
          throw new Error("Order not found");
        }
        const data = await res.json();
        setOrder(data.order || data);
        setError(null);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err instanceof Error ? err.message : "Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="h-12 w-12 animate-spin text-lime-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your order...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-900 mb-2">Order Not Found</h1>
            <p className="text-red-700 mb-6">{error || "We couldn't find your order"}</p>
            <Link
              href="/"
              className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Return to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-50">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Success Header */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-12 mb-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-6 mb-6 shadow-lg">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Thank you for your purchase. Your order is being processed.
            </p>
            <div className="bg-gray-50 rounded-lg px-6 py-4 inline-block">
              <p className="text-sm text-gray-600">Order Reference</p>
              <p className="text-2xl font-mono font-bold text-lime-600">
                {order.reference || order.orderNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                Order Details
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                    Customer Name
                  </p>
                  <p className="text-lg text-gray-900">{order.customer?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                    Email
                  </p>
                  <p className="text-lg text-gray-900">{order.customer?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                    Phone
                  </p>
                  <p className="text-lg text-gray-900">{order.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                    Order Date
                  </p>
                  <p className="text-lg text-gray-900">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Ordered Items */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Package className="h-6 w-6 text-purple-600" />
                Items Ordered
              </h2>

              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No items found</p>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            {order.shipping?.option === "empi" && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Truck className="h-6 w-6 text-green-600" />
                  Delivery Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      Delivery Method
                    </p>
                    <p className="text-lg font-semibold text-green-900">
                      EMPI Delivery
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      Delivery Cost
                    </p>
                    <p className="text-lg font-semibold text-green-900">
                      {formatPrice(order.shipping.cost)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Estimated Delivery
                      </p>
                      <p className="text-sm text-gray-600">
                        Your order will be delivered within 2-3 business days. You'll receive tracking information via email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="lg:col-span-1">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 mb-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-lime-600" />
                Order Summary
              </h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(order.pricing?.subtotal || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (7.5%)</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(order.pricing?.tax || 0)}
                  </span>
                </div>
                {order.shipping?.cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-semibold text-lime-600">
                      {formatPrice(order.shipping.cost)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline mb-6 pb-6 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Total</span>
                <div>
                  <p className="text-3xl font-bold text-lime-600">
                    {formatPrice(order.pricing?.total || 0)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
                <p className="text-xs font-semibold text-green-900 uppercase mb-1">
                  Payment Status
                </p>
                <p className="text-lg font-bold text-green-600">Completed</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 rounded-lg transition">
                  <Download className="h-5 w-5" />
                  Download Invoice
                </button>

                <Link
                  href="/cart"
                  className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition"
                >
                  <Package className="h-5 w-5" />
                  Continue Shopping
                </Link>

                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  <Home className="h-5 w-5" />
                  Back to Home
                </Link>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h4 className="font-bold text-blue-900 mb-4">What's Next?</h4>
              <ol className="space-y-3 text-sm text-blue-800">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Confirmation email sent to your inbox</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>We'll prepare your order for shipment</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Tracking info will be sent to you</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    4
                  </span>
                  <span>Receive your order at home</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
