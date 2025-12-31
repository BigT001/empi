"use client";

import { MessageSquare, Package, Phone } from "lucide-react";
import { LogisticsOrder } from "../types";

interface PickupOrdersTabProps {
  pickupOrders: LogisticsOrder[];
  onJoinConversation: (order: LogisticsOrder) => void;
}

const getCustomerName = (order: any) => {
  if (order.fullName) return order.fullName;
  if (order.firstName && order.lastName) return `${order.firstName} ${order.lastName}`;
  if (order.buyerName) return order.buyerName;
  return `Order #${order.orderNumber}`;
};

export function PickupOrdersTab({
  pickupOrders,
  onJoinConversation,
}: PickupOrdersTabProps) {
  return (
    <>
      {pickupOrders.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {pickupOrders.map(order => (
            <div key={order._id} className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 h-full flex flex-col gap-2 shadow-sm hover:shadow-md transition">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-3 text-white">
                <p className="text-xs font-semibold uppercase opacity-90 flex items-center gap-1 mb-1">
                  <Package className="h-3 w-3" /> 📍 Pickup - {order.status.toUpperCase()}
                </p>
                <p className="font-bold text-sm mb-0.5">👤 {getCustomerName(order)}</p>
                <p className="font-bold text-sm">#{order.orderNumber}</p>
              </div>

              {/* Order Info */}
              <div className="space-y-2">
                <div className="bg-white rounded p-2 border border-purple-200 text-xs">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Order Description</p>
                  <p className="text-sm font-bold text-purple-700">{order.description}</p>
                </div>

                {/* Product Images Gallery */}
                {(order.images?.length || 0) + (order.designUrls?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold text-gray-600 uppercase">Product Images</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(order.images || order.designUrls || []).slice(0, 6).map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square bg-gray-100 rounded border border-purple-300 overflow-hidden cursor-pointer hover:border-purple-500 transition"
                        >
                          <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {(((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) > 6) && (
                      <p className="text-xs text-purple-600 font-semibold">
                        +{((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) - 6} more images
                      </p>
                    )}
                  </div>
                )}

                {/* Customer Contact */}
                <div className="bg-white rounded p-2 border border-purple-200 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-purple-600" />
                    <span className="text-gray-700">{order.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 text-purple-600">✉</span>
                    <span className="text-gray-700 truncate">{order.email}</span>
                  </div>
                </div>

                {/* Quantity & Delivery */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded p-2 border border-purple-200">
                    <p className="text-xs font-semibold text-gray-600">Qty</p>
                    <p className="text-lg font-bold text-purple-700">
                      {order.quantity || (order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded p-2 border border-purple-200">
                    <p className="text-xs font-semibold text-gray-600">Type</p>
                    <p className="text-sm font-bold text-purple-700">📍 Pickup</p>
                  </div>
                </div>

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
                          <div key={idx} className="relative aspect-square bg-gray-100 rounded border border-purple-300 overflow-hidden hover:border-purple-500 transition cursor-pointer">
                            <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Pickup Location Info */}
                <div className="bg-white rounded p-2 border border-purple-200 text-xs">
                  <p className="text-xs font-semibold text-gray-600 mb-1">📍 Pickup Location</p>
                  <p className="text-gray-900 font-semibold">22 Chi-Ben street, Ojo, Lagos</p>
                  <p className="text-gray-600">Customer will pick up here</p>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => onJoinConversation(order)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition mt-auto"
              >
                <MessageSquare className="h-4 w-4" />
                Open Chat
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 bg-white rounded-lg border border-gray-200">
          <Package className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">No pickup orders</p>
        </div>
      )}
    </>
  );
}
