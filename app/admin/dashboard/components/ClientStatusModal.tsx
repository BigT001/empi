"use client";

import { X, MessageSquare } from "lucide-react";

interface Order {
  _id: string;
  orderNumber: string;
  customerEmail: string;
  costumeName: string;
  costumeType?: string;
  fullName?: string;
  status: string;
  price?: number;
  quotedPrice?: number;
  quantity?: number;
  images?: string[];
  designUrls?: string[];
  pickupDate?: string;
  pickupTime?: string;
  description?: string;
  customData?: {
    fabricColor?: string;
    size?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface ClientStatusModalProps {
  open: boolean;
  onClose: () => void;
  customerEmail: string;
  selectedStatus: string;
  orders: Order[];
  onChatClick: (order: Order) => void;
}

export function ClientStatusModal({
  open,
  onClose,
  customerEmail,
  selectedStatus,
  orders,
  onChatClick
}: ClientStatusModalProps) {
  if (!open) return null;

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300" },
    approved: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
    "in-progress": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
    ready: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300" },
    completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300" },
    rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300" }
  };

  const statusConfig = statusColors[selectedStatus] || statusColors.pending;
  const statusColorMap: Record<string, string> = {
    pending: "from-yellow-500 to-yellow-600",
    approved: "from-green-500 to-green-600",
    "in-progress": "from-blue-500 to-indigo-600",
    ready: "from-purple-500 to-purple-600",
    completed: "from-emerald-500 to-emerald-600",
    rejected: "from-red-500 to-red-600"
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className={`sticky top-0 bg-gradient-to-r ${statusColorMap[selectedStatus] || "from-blue-600 to-blue-700"} px-6 py-5 flex items-center justify-between flex-shrink-0`}>
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{selectedStatus} Orders</h2>
            <p className="text-white/80 text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} • {customerEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Orders Grid */}
        <div className="overflow-y-auto p-6 flex-1" style={{ maxHeight: "calc(85vh - 120px)" }}>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No orders found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => {
                const displayPrice = order.quotedPrice || order.price || 0;
                const formattedPrice = displayPrice > 0 
                  ? (displayPrice < 1000000 ? (displayPrice / 1000) + 'K' : (displayPrice / 1000000) + 'M')
                  : 'Pending';

                return (
                  <div key={order._id} className={`${statusConfig.bg} border-2 ${statusConfig.border} rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition`}>
                    {/* Order Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Order #{order.orderNumber}</p>
                        <h4 className={`font-bold text-base ${statusConfig.text}`}>{order.costumeType || order.costumeName || 'Costume'}</h4>
                      </div>
                    </div>

                    {/* Order Images Preview */}
                    {(order.images?.length || 0) > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {order.images?.slice(0, 3).map((img, idx) => (
                          <div key={idx} className="aspect-square rounded bg-gray-200 overflow-hidden">
                            <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Order Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-semibold text-gray-900">{order.quantity || 1}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Quote:</span>
                        <span className="font-bold text-lg" style={{color: statusConfig.text.split('-')[1]}}>{formattedPrice}</span>
                      </div>
                      {order.pickupDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Pickup:</span>
                          <span className="font-semibold text-gray-900">{new Date(order.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                      {order.customData?.fabricColor && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Fabric:</span>
                          <span className="font-semibold text-gray-900">{order.customData.fabricColor}</span>
                        </div>
                      )}
                      {order.customData?.size && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-semibold text-gray-900">{order.customData.size}</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Button */}
                    <button
                      onClick={() => onChatClick(order)}
                      className={`mt-auto px-3 py-2 ${statusConfig.text} ${statusConfig.bg} border-2 ${statusConfig.border} hover:shadow-md rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat with Buyer
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
