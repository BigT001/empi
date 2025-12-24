"use client";

import { MessageSquare, Package, Phone, Check } from "lucide-react";
import { LogisticsOrder } from "../types";

interface CompletedOrdersTabProps {
  completedOrders: LogisticsOrder[];
  onJoinConversation: (order: LogisticsOrder) => void;
}

const getCustomerName = (order: any) => {
  if (order.fullName) return order.fullName;
  if (order.firstName && order.lastName) return `${order.firstName} ${order.lastName}`;
  if (order.buyerName) return order.buyerName;
  return 'Customer';
};

export function CompletedOrdersTab({
  completedOrders,
  onJoinConversation,
}: CompletedOrdersTabProps) {
  return (
    <>
      {completedOrders.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {completedOrders.map(order => (
            <div key={order._id} className="bg-white border-2 border-green-200 rounded-lg p-3 h-full flex flex-col gap-2 shadow-md hover:shadow-lg transition">
              {/* Header with Status Badge */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 text-white">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-sm mb-0.5">📦 {getCustomerName(order)}</p>
                    <p className="text-xs opacity-90">Order #{order.orderNumber}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-green-400 text-green-900">
                    ✓ Delivered
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded p-2 border border-gray-200 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{order.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 text-green-600">📧</span>
                  <span className="text-gray-700 truncate">{order.email}</span>
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 rounded p-2 border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-0.5">Quantity</p>
                  <p className="text-sm font-bold text-green-700">
                    {order.quantity || (order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0)}
                  </p>
                </div>
                <div className="bg-green-50 rounded p-2 border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-0.5">Method</p>
                  <p className="text-xs font-bold text-green-700">
                    {order.deliveryOption === 'pickup' || order.shippingType === 'self' ? '📍 Pickup' : '🚚 Delivery'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {order.description && (
                <div className="bg-green-50 rounded p-2 border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-0.5">Description</p>
                  <p className="text-xs text-gray-900 line-clamp-2">{order.description}</p>
                </div>
              )}

              {/* Product Images */}
              {(() => {
                const customImages = (order.images || order.designUrls || []);
                const itemImages = order.items?.map((item: any) => item.imageUrl).filter(Boolean) || [];
                const allImages = [...customImages, ...itemImages];
                return allImages.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600">Images</p>
                    <div className="grid grid-cols-3 gap-1">
                      {allImages.slice(0, 3).map((img, idx) => (
                        <div key={idx} className="relative aspect-square bg-gray-100 rounded border border-green-300 overflow-hidden hover:border-green-500 transition cursor-pointer">
                          <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Delivery Address */}
              {order.address && (
                <div className="bg-emerald-50 rounded p-2 border border-emerald-200 text-xs">
                  <p className="font-semibold text-gray-600 mb-0.5">📍 Delivery Address</p>
                  <p className="text-gray-900 font-semibold text-xs">{order.address}</p>
                  {order.city && <p className="text-gray-600 text-xs">{order.city}</p>}
                </div>
              )}

              {/* Completion Date */}
              {order.updatedAt && (
                <div className="bg-green-50 rounded p-2 border border-green-200 text-xs">
                  <p className="font-semibold text-gray-600 mb-0.5">✓ Completed On</p>
                  <p className="text-gray-900 font-bold">{new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-auto pt-2">
                <button 
                  onClick={() => onJoinConversation(order)}
                  className="w-full flex items-center justify-center gap-2 px-2 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg transition"
                >
                  <MessageSquare className="h-4 w-4" />
                  View Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 bg-white rounded-lg border border-gray-200">
          <Package className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">No completed orders yet</p>
        </div>
      )}
    </>
  );
}
