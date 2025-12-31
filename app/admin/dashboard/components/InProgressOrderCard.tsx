"use client";

import { useState } from "react";
import { MessageSquare, Zap, Calendar, Clock, DollarSign, Wrench, Trash2, CheckCircle } from "lucide-react";

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
  productionStartedAt?: string;
  createdAt: string;
  [key: string]: any;
}

interface InProgressOrderCardProps {
  order: Order;
  onImageClick: () => void;
  onChatClick: () => void;
  onMarkReady?: () => void;
  onDelete?: () => void;
}

export function InProgressOrderCard({ order, onImageClick, onChatClick, onMarkReady, onDelete }: InProgressOrderCardProps) {
  const [showReadyConfirm, setShowReadyConfirm] = useState(false);

  const handleMarkReady = () => {
    setShowReadyConfirm(true);
  };

  const confirmReady = () => {
    setShowReadyConfirm(false);
    onMarkReady?.();
  };
  return (
    <>
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      {/* Header - Customer Info */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-3 text-white">
        <p className="text-xs font-semibold uppercase opacity-90 flex items-center gap-1">
          <Wrench className="h-3 w-3" /> In Production
        </p>
        <p className="font-bold text-sm">{order.fullName || order.email}</p>
        <p className="text-xs opacity-75">{order.email}</p>
      </div>

      {/* What They're Ordering */}
      <div className="bg-white rounded p-2 border border-blue-200">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Product Description</p>
        <p className="text-sm font-bold text-blue-700">{order.description || order.costumeType || order.costumeName || 'Custom Order'}</p>
      </div>

      {/* Product ID */}
      {order.productId && (
        <div className="bg-white rounded p-2 border border-blue-200">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Product ID</p>
          <p className="text-sm font-bold text-blue-700 font-mono">{order.productId}</p>
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
              className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition"
            >
              Download All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(order.images || order.designUrls || []).slice(0, 6).map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square bg-gray-100 rounded border border-blue-300 overflow-hidden cursor-pointer hover:border-blue-500 transition"
                onClick={onImageClick}
              >
                <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {(((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) > 6) && (
            <button onClick={onImageClick} className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              View all {((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0)} images
            </button>
          )}
        </div>
      )}

      {/* Order Stats - Quantity and Agreed Date */}
      <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
        <div className="bg-white rounded p-2 border border-blue-200">
          <p className="text-xs font-semibold text-gray-600">📦 Qty</p>
          <p className="text-lg font-bold text-blue-700">{order.quantity || order.quantityOfPieces || 1}</p>
        </div>
        {(order.pickupDate || order.deliveryDate) && (
          <div className="bg-blue-100 rounded p-2 border border-blue-300">
            <p className="text-xs font-semibold text-gray-600">✓ Agreed</p>
            <p className="text-sm font-bold text-blue-700">{new Date(order.pickupDate || order.deliveryDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}</p>
          </div>
        )}
      </div>

      {/* Order Info & Specs */}
      {(order.pickupDate || order.pickupTime || (order.customData && (order.customData.fabricColor || order.customData.size)) || order.productionStartedAt) && (
        <div className="bg-white rounded p-2 border border-blue-200 mb-3 flex-shrink-0 text-xs space-y-1">
          {order.productionStartedAt && (
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3 text-blue-600" />
              <span className="text-gray-700">Started: {new Date(order.productionStartedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          {order.pickupDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-600" />
              <span className="text-gray-700">Due: {new Date(order.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
          {order.pickupTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
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
        </div>
      )}

      {/* Customer Message */}
      {order.message && (
        <div className="bg-white rounded-lg p-3 border-2 border-blue-200 mb-3 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Customer Message</p>
          <p className="text-sm text-gray-700">{order.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        {(order.images?.length || 0) > 0 && (
          <button
            onClick={onImageClick}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm rounded-lg transition border-2 border-blue-300 hover:border-blue-500"
          >
            <Zap className="h-4 w-4" />
            View All Images
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={onChatClick}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition"
          >
            <MessageSquare className="h-4 w-4" />
            Chat with Buyer
          </button>
          <button
            onClick={handleMarkReady}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-lg transition"
          >
            ✓ Ready?
          </button>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition w-full"
          >
            <Trash2 className="h-4 w-4" />
            Delete Order
          </button>
        )}
      </div>
    </div>
    
    {/* Ready Confirmation Modal */}
    {showReadyConfirm && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mx-auto mb-4">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Confirm Production Ready?</h3>
          <p className="text-gray-600 text-center mb-6">Is the production of this costume complete and ready for delivery/pickup? The customer will be notified about the next steps.</p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowReadyConfirm(false)}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
            >
              Not Yet
            </button>
            <button
              onClick={confirmReady}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              Yes, Ready!
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

