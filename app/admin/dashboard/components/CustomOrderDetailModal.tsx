"use client";

import { useState, useEffect } from "react";
import { X, Download, Eye, AlertCircle } from "lucide-react";

interface CustomOrderDetails {
  _id: string;
  orderNumber: string;
  buyerId?: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  description: string;
  designUrls?: string[];
  quantity: number;
  deliveryDate?: string;
  quotedPrice?: number;
  status: string;
  createdAt: string;
}

interface CustomOrderDetailModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
}

export function CustomOrderDetailModal({ isOpen, orderId, onClose }: CustomOrderDetailModalProps) {
  const [order, setOrder] = useState<CustomOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/unified/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();
      setOrder(data.customOrder || data.order);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(err instanceof Error ? err.message : "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Custom Order Details</h2>
            {order && (
              <p className="text-blue-100">{order.orderNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading order details...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Error Loading Order</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {order && (
            <>
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                    <p className="text-gray-900">{order.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900 break-all">{order.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                    <p className="text-gray-900">{order.phone}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Buyer ID</label>
                    <p className="text-gray-900 font-mono text-sm">{order.buyerId || "Not signed up"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                    <p className="text-gray-900">{order.address || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                    <p className="text-gray-900">{order.city}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                    <p className="text-gray-900">{order.state || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Order Number</label>
                    <p className="text-gray-900 font-bold">{order.orderNumber}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    <div className="inline-block">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
                    <p className="text-gray-900">{order.quantity}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Quoted Price</label>
                    <p className="text-gray-900 font-bold">₦{order.quotedPrice ? order.quotedPrice.toLocaleString() : "Pending"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Date</label>
                    <p className="text-gray-900">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not specified"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Submitted</label>
                    <p className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{order.description}</p>
                </div>
              </div>

              {/* Design Images */}
              {order.designUrls && order.designUrls.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Design Images ({order.designUrls.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {order.designUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                      >
                        <img
                          src={url}
                          alt={`Design ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all"
                        >
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
                >
                  Close
                </button>
                <a
                  href={`/dashboard?customOrder=${order.orderNumber}`}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-center"
                >
                  Go to Order
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
