"use client";

import { MessageSquare, Calendar, Clock, Trash2, Mail, Phone, CheckCircle } from "lucide-react";

interface Order {
  _id: string;
  customerEmail: string;
  costumeName: string;
  fullName?: string;
  email?: string;
  phone?: string;
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
  deliveryDate?: string;
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
  city?: string;
  address?: string;
  [key: string]: any;
}

interface CompletedOrderCardProps {
  order: Order;
  onImageClick: () => void;
  onChatClick: () => void;
  onDeleteOrder?: (orderId: string) => void;
}

export function CompletedOrderCard({ order, onImageClick, onChatClick, onDeleteOrder }: CompletedOrderCardProps) {
  const allImages = [...(order.designUrls || []), ...(order.images || [])];

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-emerald-300 overflow-hidden shadow-md hover:shadow-xl hover:border-emerald-400 transition-all h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2">{order.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Customer'} <CheckCircle className="h-5 w-5" /></h3>
        <p className="text-sm text-emerald-100 mt-1">{order.city || 'Location not set'}</p>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4 flex-1 overflow-y-auto">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-emerald-600" />
            <p className="text-gray-700 truncate">{order.email}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-emerald-600" />
            <p className="text-gray-700">{order.phone || 'N/A'}</p>
          </div>
        </div>

        {/* What They Ordered */}
        <div className="bg-white rounded-lg p-3 border-2 border-emerald-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">What They Ordered</p>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-2">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-3 bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100 rounded border border-emerald-300 overflow-hidden flex-shrink-0 w-16 h-16">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-xs text-gray-600">No Image</span>
                      </div>
                    )}
                  </div>
                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                    <h4 className="font-bold text-base text-gray-900 truncate">{item.name || item.productName || 'Product'}</h4>
                    <div className="flex gap-2 items-center text-xs">
                      <span className="text-gray-600">Qty: {item.quantity || 1}</span>
                      {item.price && <span className="font-semibold text-emerald-700">₦{(item.price).toLocaleString('en-NG')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-base font-bold text-gray-900">{order.description || order.costumeType || order.costumeName || 'Costume'}</p>
              {/* Design Images for Custom Orders */}
              {(order.designUrls && order.designUrls.length > 0) && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Design Images</p>
                  <div className="grid grid-cols-3 gap-2">
                    {order.designUrls.map((img: string, idx: number) => (
                      <div
                        key={idx}
                        className="relative aspect-square bg-gray-100 rounded border border-emerald-300 overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`Design ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product ID */}
        {order.productId && (
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Product ID</p>
            <p className="font-mono text-sm font-bold text-emerald-700">{order.productId}</p>
          </div>
        )}

        {/* Product Images Gallery */}
        {allImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-gray-600 uppercase">Design Images</p>
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
                className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition"
              >
                Download All
              </button>
            </div>
            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-100">
              <div className="flex gap-2">
                {allImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-gray-100 rounded border border-emerald-300 overflow-hidden cursor-pointer hover:border-emerald-500 transition flex-shrink-0 w-20 h-20"
                    onClick={onImageClick}
                  >
                    <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = ''; }} />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">← Scroll to see more images →</p>
          </div>
        )}



        {/* Order Details */}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Order Info</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            {order.customData?.fabricColor && (
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Fabric:</span> {order.customData.fabricColor}
              </div>
            )}
            {order.customData?.size && (
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Size:</span> {order.customData.size}
              </div>
            )}
          </div>
        </div>

        {/* Customer Message */}
        {order.message && (
          <div className="bg-white rounded-lg p-3 border-2 border-emerald-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Customer Message</p>
            <p className="text-sm text-gray-700">{order.message}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 px-5 pb-5 border-t border-slate-200">
        <button
          onClick={onChatClick}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
        {onDeleteOrder && (
          <button
            onClick={() => {
              if (confirm(`Delete order? This action cannot be undone.`)) {
                onDeleteOrder(order._id);
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
