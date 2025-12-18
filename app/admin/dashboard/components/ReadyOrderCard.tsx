"use client";

import { useState } from "react";
import { MessageSquare, Zap, Calendar, Clock, DollarSign, Truck, X } from "lucide-react";

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
  createdAt: string;
  [key: string]: any;
}

interface ReadyOrderCardProps {
  order: Order;
  onImageClick: () => void;
  onChatClick: () => void;
}

export function ReadyOrderCard({ order, onImageClick, onChatClick }: ReadyOrderCardProps) {
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  
  // Truncate description to 2 lines (~80 characters)
  const maxDescLength = 80;
  const fullDescription = order.description || order.costumeType || order.costumeName || 'Costume';
  const isTruncated = fullDescription.length > maxDescLength;
  const truncatedDescription = isTruncated ? fullDescription.substring(0, maxDescLength) + '...' : fullDescription;
  
  // Get all images
  const allImages = [...(order.images || []), ...(order.designUrls || [])];
  
  return (
    <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      {/* Header - Customer Info */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-3 text-white">
        <p className="text-xs font-semibold uppercase opacity-90 flex items-center gap-1">
          <Truck className="h-3 w-3" /> Ready to Ship
        </p>
        <p className="font-bold text-sm">{order.fullName || order.email}</p>
        <p className="text-xs opacity-75">{order.email}</p>
      </div>

      {/* Costume Description */}
      <div className="bg-white rounded p-2 border border-purple-200">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Costume</p>
        <p 
          onClick={() => isTruncated && setShowDescriptionModal(true)}
          className={`text-sm font-bold text-purple-700 line-clamp-2 ${isTruncated ? 'cursor-pointer hover:text-purple-900 transition' : ''}`}
        >
          {truncatedDescription}
        </p>
        {isTruncated && (
          <p className="text-xs text-purple-600 font-semibold cursor-pointer hover:text-purple-700 mt-1">
            Click to view full description
          </p>
        )}
      </div>

      {/* Product Images Gallery - Horizontal Scrollable */}
      {allImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-gray-600 uppercase">Product Images ({allImages.length})</p>
            <button
              onClick={() => {
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
              className="text-xs text-purple-600 font-semibold hover:text-purple-700 transition"
            >
              Download All
            </button>
          </div>
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
            <div className="flex gap-2">
              {allImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square bg-gray-100 rounded border border-purple-300 overflow-hidden cursor-pointer hover:border-purple-500 transition flex-shrink-0 w-20 h-20"
                  onClick={onImageClick}
                >
                  <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">← Scroll to see more images →</p>
        </div>
      )}

      {/* Order Stats */}
      <div className="grid grid-cols-1 gap-2 mb-3 flex-shrink-0">
        <div className="bg-white rounded p-2 border border-purple-200">
          <p className="text-xs font-semibold text-gray-600">Qty</p>
          <p className="text-lg font-bold text-purple-700">{order.quantity || order.quantityOfPieces || 1}</p>
        </div>
      </div>

      {/* Order Info & Specs */}
      {(order.pickupDate || order.pickupTime || (order.customData && (order.customData.fabricColor || order.customData.size))) && (
        <div className="bg-white rounded p-2 border border-purple-200 mb-3 flex-shrink-0 text-xs space-y-1">
          {order.pickupDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-purple-600" />
              <span className="text-gray-700">Pickup: {new Date(order.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
          {order.pickupTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-purple-600" />
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
        <div className="bg-white rounded-lg p-3 border-2 border-purple-200 mb-3 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Customer Message</p>
          <p className="text-sm text-gray-700">{order.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        <button
          onClick={onChatClick}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-lg transition"
        >
          <MessageSquare className="h-4 w-4" />
          Chat with Buyer
        </button>
      </div>

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDescriptionModal(false)}>
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Full Description</h3>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {fullDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
