"use client";

import { MessageSquare, Zap, Calendar, Clock, DollarSign } from "lucide-react";

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
  completedAt?: string;
  createdAt: string;
  [key: string]: any;
}

interface CompletedOrderCardProps {
  order: Order;
  onImageClick: () => void;
  onChatClick: () => void;
}

export function CompletedOrderCard({ order, onImageClick, onChatClick }: CompletedOrderCardProps) {
  return (
    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      {/* Header - Customer Info */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-3 text-white">
        <p className="text-xs font-semibold uppercase opacity-90">Completed Order</p>
        <p className="font-bold text-sm">{order.fullName || order.email}</p>
        <p className="text-xs opacity-75">{order.email}</p>
      </div>

      {/* What They're Buying */}
      <div className="bg-white rounded p-2 border border-emerald-200">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">What They Ordered</p>
        <p className="text-sm font-bold text-emerald-700">{order.costumeType || order.costumeName || 'Costume'}</p>
      </div>

      {/* Product ID */}
      {order.productId && (
        <div className="bg-white rounded p-2 border border-emerald-200">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Product ID</p>
          <p className="text-sm font-bold text-emerald-700 font-mono">{order.productId}</p>
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
                const xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                
                allImages.forEach((img, idx) => {
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
              className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition"
            >
              Download All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(order.images || order.designUrls || []).slice(0, 6).map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square bg-gray-100 rounded border border-emerald-300 overflow-hidden cursor-pointer hover:border-emerald-500 transition"
                onClick={onImageClick}
              >
                <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {(((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) > 6) && (
            <button onClick={onImageClick} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">
              View all {((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0)} images
            </button>
          )}
        </div>
      )}

      {/* Order Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
        <div className="bg-white rounded p-2 border border-emerald-200">
          <p className="text-xs font-semibold text-gray-600">Qty</p>
          <p className="text-lg font-bold text-emerald-700">{order.quantity || order.quantityOfPieces || 1}</p>
        </div>
        <div className="bg-white rounded p-2 border border-emerald-200">
          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Quote
          </p>
          <p className="text-sm font-bold text-emerald-700">
            {(() => {
              const price = order.quotedPrice || order.price || 0;
              if (price <= 0) return 'Pending';
              if (price < 1000000) {
                return (price / 1000) + 'K';
              }
              return (price / 1000000) + 'M';
            })()}
          </p>
        </div>
      </div>

      {/* Order Info & Specs */}
      {(order.pickupDate || order.pickupTime || (order.customData && (order.customData.fabricColor || order.customData.size)) || order.completedAt) && (
        <div className="bg-white rounded p-2 border border-emerald-200 mb-3 flex-shrink-0 text-xs space-y-1">
          {order.pickupDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-emerald-600" />
              <span className="text-gray-700">Pickup: {new Date(order.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
          {order.pickupTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-emerald-600" />
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
          {order.completedAt && (
            <div className="pt-1 border-t border-emerald-200">
              <p className="text-xs text-gray-600 font-semibold">Completed: <span className="text-emerald-700">{new Date(order.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></p>
            </div>
          )}
        </div>
      )}

      {/* Customer Message */}
      {order.message && (
        <div className="bg-white rounded-lg p-3 border-2 border-emerald-200 mb-3 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Customer Message</p>
          <p className="text-sm text-gray-700">{order.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        {(order.images?.length || 0) > 0 && (
          <button
            onClick={onImageClick}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-sm rounded-lg transition border-2 border-emerald-300 hover:border-emerald-500"
          >
            <Zap className="h-4 w-4" />
            View All Images
          </button>
        )}
        <button
          onClick={onChatClick}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition"
        >
          <MessageSquare className="h-4 w-4" />
          Chat with Buyer
        </button>
      </div>
    </div>
  );
}
