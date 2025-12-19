"use client";

import { MessageSquare, Zap, Calendar, Clock, DollarSign, AlertCircle, Trash2 } from "lucide-react";

interface Order {
  _id: string;
  customerEmail: string;
  costumeName: string;
  fullName?: string;
  email?: string;
  status: string;
  quotedPrice?: number;
  price?: number;
  quantity?: number;
  quantityOfPieces?: number;
  images?: string[];
  designUrls?: string[];
  message?: string;
  pickupDate?: string;
  pickupTime?: string;
  description?: string;
  costumeType?: string;
  productId?: string;
  customData?: {
    fabricColor?: string;
    size?: string;
    theme?: string;
    [key: string]: any;
  };
  declineReason?: string;
  rejectedAt?: string;
  createdAt: string;
  [key: string]: any;
}

interface RejectedOrderCardProps {
  order: Order;
  onImageClick: () => void;
  onChatClick: () => void;
  onDeleteOrder?: (orderId: string) => void;
}

export function RejectedOrderCard({ order, onImageClick, onChatClick, onDeleteOrder }: RejectedOrderCardProps) {
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      {/* Header - Customer Info */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-3 text-white">
        <p className="text-xs font-semibold uppercase opacity-90">Rejected Order</p>
        <p className="font-bold text-sm">{order.fullName || order.email}</p>
        <p className="text-xs opacity-75">{order.email}</p>
      </div>

      {/* What They Were Trying to Order */}
      <div className="bg-white rounded p-2 border border-red-200">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Order Details</p>
        <p className="text-sm font-bold text-red-700">{order.costumeType || order.costumeName || 'Costume'}</p>
      </div>

      {/* Product ID */}
      {order.productId && (
        <div className="bg-white rounded p-2 border border-red-200">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Product ID</p>
          <p className="text-sm font-bold text-red-700 font-mono">{order.productId}</p>
        </div>
      )}

      {/* Decline Reason */}
      {order.declineReason && (
        <div className="bg-white rounded-lg p-3 border-2 border-red-300 flex-shrink-0 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Decline Reason</p>
              <p className="text-sm text-red-700 font-medium">{order.declineReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Product Images Gallery */}
      {(order.images?.length || 0) + (order.designUrls?.length || 0) > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-gray-600 uppercase">Product Images</p>
            <button
              onClick={() => {
                const allImages = [...(order.images || []), ...(order.designUrls || [])];
                allImages.forEach((img, idx) => {
                  const xhr = new XMLHttpRequest();
                  xhr.responseType = 'blob';
                  xhr.open('GET', img, true);
                  xhr.onload = () => {
                    const url = window.URL.createObjectURL(xhr.response);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `image-${idx + 1}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  };
                  xhr.send();
                });
              }}
              className="text-xs text-red-600 font-semibold hover:text-red-700 transition"
            >
              Download All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(order.images || order.designUrls || []).slice(0, 6).map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square bg-gray-100 rounded border border-red-300 overflow-hidden cursor-pointer hover:border-red-500 transition"
                onClick={onImageClick}
              >
                <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {(((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) > 6) && (
            <button onClick={onImageClick} className="text-xs text-red-600 font-semibold hover:text-red-700">
              View all {((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0)} images
            </button>
          )}
        </div>
      )}

      {/* Order Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
        <div className="bg-white rounded p-2 border border-red-200">
          <p className="text-xs font-semibold text-gray-600">Qty</p>
          <p className="text-lg font-bold text-red-700">{order.quantity || order.quantityOfPieces || 1}</p>
        </div>
        <div className="bg-white rounded p-2 border border-red-200">
          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Quote
          </p>
          <p className="text-sm font-bold text-red-700">
            {(() => {
              const price = order.quotedPrice || order.price || 0;
              if (price <= 0) return 'N/A';
              if (price < 1000000) {
                return (price / 1000) + 'K';
              }
              return (price / 1000000) + 'M';
            })()}
          </p>
        </div>
      </div>

      {/* Order Info & Specs */}
      {(order.pickupDate || order.pickupTime || (order.customData && (order.customData.fabricColor || order.customData.size)) || order.rejectedAt) && (
        <div className="bg-white rounded p-2 border border-red-200 mb-3 flex-shrink-0 text-xs space-y-1">
          {order.pickupDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-red-600" />
              <span className="text-gray-700">Requested: {new Date(order.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
          {order.pickupTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-red-600" />
              <span className="text-gray-700">Time: {order.pickupTime}</span>
            </div>
          )}
          {order.customData?.fabricColor && (
            <div>
              <p className="text-xs text-gray-600 font-semibold">Fabric: <span className="text-gray-900">{order.customData.fabricColor}</span></p>
            </div>
          )}
          {order.customData?.size && (
            <div>
              <p className="text-xs text-gray-600 font-semibold">Size: <span className="text-gray-900">{order.customData.size}</span></p>
            </div>
          )}
          {order.rejectedAt && (
            <div className="pt-1 border-t border-red-200">
              <p className="text-xs text-gray-600 font-semibold">Rejected: <span className="text-red-700">{new Date(order.rejectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></p>
            </div>
          )}
        </div>
      )}

      {/* Customer Message */}
      {order.message && (
        <div className="bg-white rounded-lg p-3 border-2 border-red-200 mb-3 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Customer Message</p>
          <p className="text-sm text-gray-700">{order.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        {(order.images?.length || 0) > 0 && (
          <button
            onClick={onImageClick}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-700 font-bold text-sm rounded-lg transition border-2 border-red-300 hover:border-red-500"
          >
            <Zap className="h-4 w-4" />
            View All Images
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={onChatClick}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition"
          >
            <MessageSquare className="h-4 w-4" />
            Chat with Buyer
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete order? This action cannot be undone.`)) {
                onDeleteOrder?.(order._id);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
