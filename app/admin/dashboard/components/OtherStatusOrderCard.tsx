"use client";

import { ChevronDown, ChevronUp, MessageSquare, AlertCircle, CheckCircle, Clock, Zap, Factory, AlertCircle as AlertIcon, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface Order {
  _id: string;
  customerEmail: string;
  costumeName: string;
  fullName?: string;
  email?: string;
  status: string;
  price?: number;
  quotedPrice?: number;
  quantity?: number;
  quantityOfPieces?: number;
  images?: string[];
  message?: string;
  pickupDate?: string;
  pickupTime?: string;
  productionStartedAt?: string;
  deliveryDate?: string;
  description?: string;
  costumeType?: string;
  designUrls?: string[];
  productId?: string;
  customData?: {
    fabricColor?: string;
    size?: string;
    theme?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface OtherStatusOrderCardProps {
  order: Order;
  expanded: boolean;
  onExpandClick: () => void;
  onImageClick: () => void;
  onChatClick: () => void;
  onDeclineClick: () => void;
  onCancelClick: () => void;
  onStatusChangeClick: (newStatus: string) => void;
  onDeleteClick: () => void;
}

export function OtherStatusOrderCard({
  order,
  expanded,
  onExpandClick,
  onImageClick,
  onChatClick,
  onDeclineClick,
  onCancelClick,
  onStatusChangeClick,
  onDeleteClick
}: OtherStatusOrderCardProps) {
  const [showActions, setShowActions] = useState(false);

  // Debug: Log order data
  useEffect(() => {
    console.log('[OtherStatusOrderCard] Full order object:', {
      _id: order._id,
      quotedPrice: order.quotedPrice,
      price: order.price,
      quantity: order.quantity,
      quantityOfPieces: order.quantityOfPieces,
      fullName: order.fullName,
      costumeName: order.costumeName,
      pickupDate: order.pickupDate,
      deliveryDate: order.deliveryDate,
      status: order.status
    });
  }, [order._id]);

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    "in-progress": { bg: "bg-gradient-to-br from-blue-50 to-indigo-50", text: "text-blue-700", border: "border-blue-300" },
    ready: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    declined: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    cancelled: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }
  };

  const statusConfig = statusColors[order.status] || statusColors.pending;

  const statusActions: Record<string, { label: string; action: string }[]> = {
    pending: [
      { label: "✓ Approve", action: "approved" },
      { label: "✗ Decline", action: "decline" }
    ],
    approved: [
      { label: "Start Production", action: "in-progress" },
      { label: "Cancel", action: "cancel" }
    ],
    "in-progress": [
      { label: "Ready to Ship", action: "ready" },
      { label: "Cancel", action: "cancel" }
    ],
    ready: [
      { label: "Mark Completed", action: "completed" },
      { label: "Cancel", action: "cancel" }
    ]
  };

  const actions = statusActions[order.status] || [];

  return (
    <div className={`${statusConfig.bg} border-2 ${statusConfig.border} rounded-lg p-4 transition hover:shadow-lg ${
      order.status === "in-progress" ? "shadow-md border-l-4 border-l-blue-600" : order.status === "pending" ? "shadow-md border-l-4 border-l-yellow-500" : ""
    }`}>
      {order.status === "pending" ? (
        // Pending Card View - Production Ready - EXPANDED
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg p-4 text-white mb-3 flex-shrink-0">
            <h3 className="font-bold text-lg">{order.fullName || order.costumeName}</h3>
            <p className="text-sm text-yellow-100">{order.email || order.customerEmail}</p>
          </div>

          {/* Product Name Section */}
          <div className="bg-white rounded-lg p-3 border-2 border-yellow-200 mb-3 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">What They're Buying</p>
            <h4 className="font-bold text-base text-gray-900">{order.costumeType || order.description || 'Custom Order'}</h4>
          </div>

          {/* Product ID Section */}
          {order.productId && (
            <div className="bg-white rounded-lg p-3 border-2 border-yellow-200 mb-3 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Product ID</p>
              <p className="font-bold text-base text-gray-900 font-mono">{order.productId}</p>
            </div>
          )}

          {/* Images Gallery */}
          {(order.images && order.images.length > 0 || order.designUrls && order.designUrls.length > 0) && (
            <div className="bg-white rounded-lg p-3 border-2 border-yellow-200 mb-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Images</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const images = (order.images || order.designUrls || []);
                    images.forEach((img, idx) => {
                      const xhr = new XMLHttpRequest();
                      xhr.responseType = 'blob';
                      xhr.onload = () => {
                        const url = window.URL.createObjectURL(xhr.response);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `design-${idx + 1}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      };
                      xhr.open('GET', img);
                      xhr.send();
                    });
                  }}
                  className="text-xs text-yellow-600 font-semibold hover:text-yellow-700 transition"
                >
                  Download All
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(order.images || order.designUrls || []).slice(0, 6).map((img, idx) => (
                  <div key={idx} className="relative aspect-square bg-gray-100 rounded border border-yellow-300 overflow-hidden cursor-pointer hover:border-yellow-500 transition"
                    onClick={onImageClick}
                  >
                    <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {(((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0) > 6) && (
                <button onClick={onImageClick} className="text-xs text-yellow-600 font-semibold mt-2 hover:text-yellow-700">
                  View all {((order.images?.length) ?? 0) + ((order.designUrls?.length) ?? 0)} images
                </button>
              )}
            </div>
          )}

          {/* Order Stats - 3 column grid */}
          <div className="grid grid-cols-3 gap-2 mb-3 flex-shrink-0">
            <div className="bg-white rounded p-2 border border-yellow-200">
              <p className="text-xs font-semibold text-gray-600">📦 Qty</p>
              <p className="text-lg font-bold text-yellow-700">{order.quantity || order.quantityOfPieces || 1}</p>
            </div>
            <div className="bg-white rounded p-2 border border-yellow-200">
              <p className="text-xs font-semibold text-gray-600">💰 Quote</p>
              <p className="text-sm font-bold text-amber-700">
                {(() => {
                  const price = order.quotedPrice || order.price || 0;
                  if (price <= 0) return 'Awaiting';
                  if (price < 1000000) {
                    return (price / 1000) + 'K';
                  }
                  return (price / 1000000) + 'M';
                })()}
              </p>
            </div>
            {(order.pickupDate || order.deliveryDate) && (
              <div className="bg-yellow-100 rounded p-2 border border-yellow-300">
                <p className="text-xs font-semibold text-gray-600">📆 Needed</p>
                <p className="text-sm font-bold text-yellow-700">{new Date((order.pickupDate || order.deliveryDate) as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            )}
          </div>

          {/* Order Info & Specs - Only show if data exists */}
          {(order.pickupDate || order.pickupTime || (order.customData && (order.customData.fabricColor || order.customData.size))) && (
            <div className="bg-white rounded p-2 border border-yellow-200 mb-3 flex-shrink-0 text-xs">
              {order.pickupDate && (
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3 text-yellow-600" />
                  <span className="text-gray-700">Pickup: {new Date(order.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              {order.pickupTime && (
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  <span className="text-gray-700">Time: {order.pickupTime}</span>
                </div>
              )}
              {order.customData?.fabricColor && (
                <div className="mb-1">
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
            <div className="bg-white rounded-lg p-3 border-2 border-yellow-200 mb-3 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Customer Message</p>
              <p className="text-sm text-gray-700">{order.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            {order.images && order.images.length > 0 && (
              <button
                onClick={onImageClick}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-yellow-50 text-yellow-700 font-bold text-sm rounded-lg transition border-2 border-yellow-300 hover:border-yellow-500"
              >
                <Zap className="h-4 w-4" />
                View All Images
              </button>
            )}
            <button
              onClick={onChatClick}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition"
            >
              <MessageSquare className="h-4 w-4" />
              Chat with Buyer
            </button>
          </div>
        </div>
      ) : order.status === "in-progress" ? (
        // Production Card View
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3 text-white mb-2 flex-shrink-0">
            <h3 className="font-bold text-sm line-clamp-2">{order.fullName || order.costumeName}</h3>
            <p className="text-xs text-blue-200 line-clamp-1">{order.email || order.customerEmail}</p>
          </div>

          {/* Production Stats */}
          <div className="grid grid-cols-2 gap-2 mb-2 flex-shrink-0">
            <div className="bg-white rounded p-2 border border-blue-200">
              <p className="text-xs font-semibold text-gray-600">Qty</p>
              <p className="text-lg font-bold text-blue-700">{order.quantity || order.quantityOfPieces || 1}</p>
            </div>
            <div className="bg-white rounded p-2 border border-blue-200">
              <p className="text-xs font-semibold text-gray-600">₦</p>
              <p className="text-sm font-bold text-indigo-700">
                {(() => {
                  const price = order.quotedPrice || order.price || 0;
                  if (price <= 0) return 'Pending';
                  // If price is less than 1 million, show exact amount with K suffix
                  if (price < 1000000) {
                    return (price / 1000) + 'K';
                  }
                  // If price is 1 million or more, show exact amount in millions
                  return (price / 1000000) + 'M';
                })()}
              </p>
            </div>
          </div>

          {/* Production Timeline - Compact */}
          <div className="bg-white rounded p-2 border border-blue-200 mb-2 flex-shrink-0 text-xs">
            {order.deliveryDate && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-gray-700 truncate">
                  Delivery: {new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            {order.productionStartedAt && !order.deliveryDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-gray-700 truncate">
                  Started: {new Date(order.productionStartedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {/* Custom Data - Compact */}
          {order.customData && (
            <div className="bg-white rounded p-2 border border-blue-200 mb-2 flex-shrink-0 text-xs">
              <div className="grid grid-cols-2 gap-1">
                {order.customData.fabricColor && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Fabric</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">{order.customData.fabricColor}</p>
                  </div>
                )}
                {order.customData.size && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Size</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">{order.customData.size}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons - Vertical Stack */}
          <div className="flex flex-col gap-2 mt-auto">
            {order.images && order.images.length > 0 && (
              <button
                onClick={onImageClick}
                className="flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded transition border border-gray-300"
              >
                <Zap className="h-3 w-3" />
                View Design
              </button>
            )}
            <button
              onClick={onChatClick}
              className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition"
            >
              <MessageSquare className="h-3 w-3" />
              Chat
            </button>
            {actions.length > 0 && (
              <div className="relative w-full">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded transition"
                >
                  Actions ▲
                </button>
                {showActions && (
                  <div className="absolute bg-white border border-gray-300 rounded shadow-lg z-50 w-full"
                    style={{
                      bottom: '100%',
                      marginBottom: '0.25rem'
                    }}>
                    {actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setShowActions(false);
                          if (action.action === "decline") {
                            onDeclineClick();
                          } else if (action.action === "cancel") {
                            onCancelClick();
                          } else {
                            onStatusChangeClick(action.action);
                          }
                        }}
                        className="block w-full text-left px-3 py-1 text-gray-700 hover:bg-gray-100 text-xs font-semibold border-b last:border-b-0"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Standard Card View (for other statuses: ready, completed, rejected, etc.)
        <>
          {/* Header */}
          <div
            onClick={onExpandClick}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{order.costumeName}</h3>
              <p className="text-sm text-gray-600">{order.customerEmail}</p>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${statusConfig.text} bg-white`}>
                  {order.status}
                </span>
                <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded">
                  ₦{order.price?.toLocaleString() || "0"}
                </span>
                {order.quantityOfPieces && (
                  <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded">
                    Qty: {order.quantityOfPieces}
                  </span>
                )}
              </div>
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {/* Expanded Section */}
          {expanded && (
            <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-4 animate-in fade-in duration-200">
              {/* Order Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {order.customData?.fabricColor && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Fabric</p>
                    <p className="text-sm font-semibold text-gray-900">{order.customData.fabricColor}</p>
                  </div>
                )}
                {order.customData?.size && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Size</p>
                    <p className="text-sm font-semibold text-gray-900">{order.customData.size}</p>
                  </div>
                )}
                {order.customData?.theme && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Theme</p>
                    <p className="text-sm font-semibold text-gray-900">{order.customData.theme}</p>
                  </div>
                )}
                {order.pickupDate && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Pickup Date</p>
                    <p className="text-sm font-semibold text-gray-900">{new Date(order.pickupDate).toLocaleDateString()}</p>
                  </div>
                )}
                {order.pickupTime && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Pickup Time</p>
                    <p className="text-sm font-semibold text-gray-900">{order.pickupTime}</p>
                  </div>
                )}
              </div>

              {/* Message */}
              {order.message && (
                <div className="bg-white rounded p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Customer Message</p>
                  <p className="text-sm text-gray-700">{order.message}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {order.images && order.images.length > 0 && (
                  <button
                    onClick={onImageClick}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-lg transition border border-gray-300"
                  >
                    <Zap className="h-4 w-4" />
                    View Design
                  </button>
                )}
                <button
                  onClick={onChatClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </button>
                {actions.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                    >
                      Actions ▼
                    </button>
                    {showActions && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-max">
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setShowActions(false);
                              if (action.action === "decline") {
                                onDeclineClick();
                              } else if (action.action === "cancel") {
                                onCancelClick();
                              } else {
                                onStatusChangeClick(action.action);
                              }
                            }}
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm font-semibold"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
