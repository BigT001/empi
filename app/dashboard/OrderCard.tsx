'use client';

import { MessageCircle, Clock, Check, MapPin, Package, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { CountdownTimer } from '../components/CountdownTimer';

interface CustomOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  description: string;
  designUrl?: string;
  designUrls?: string[];
  quantity?: number;
  deliveryDate?: string;
  proposedDeliveryDate?: string;
  buyerAgreedToDate?: boolean;
  status: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  notes?: string;
  quotedPrice?: number;
  productId?: string;
  deadlineDate?: string;
  timerStartedAt?: string;
  timerDurationDays?: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderCardProps {
  order: CustomOrder;
  messageCount: { total: number; unread: number };
  onChat: () => void;
  onViewImages: () => void;
}

export function OrderCard({
  order,
  messageCount,
  onChat,
  onViewImages,
}: OrderCardProps) {
  const calculateTotal = (order: CustomOrder) => {
    const basePrice = order.quotedPrice || 0;
    const quantity = order.quantity || 1;
    const subtotal = basePrice * quantity;
    const vat = (subtotal * 7.5) / 100;
    return subtotal + vat;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { badge: string; text: string }> = {
      'pending': { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-600' },
      'approved': { badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600' },
      'in-progress': { badge: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600' },
      'ready': { badge: 'bg-green-50 text-green-700 border-green-200', text: 'text-green-600' },
      'completed': { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' },
      'rejected': { badge: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-600' }
    };
    return colors[status] || colors['pending'];
  };

  const deliveryMethod = order.productId ? 'Pickup' : 'Delivery';
  const statusColors = getStatusColor(order.status);

  return (
    <div
      key={order._id}
      id={`order-${order._id}`}
      className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 hover:border-lime-300 group"
    >
      {/* Header Section */}
      <div className="relative bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 border-b border-lime-200 px-4 md:px-5 py-4 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Order #{order.orderNumber}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 whitespace-nowrap border ${statusColors.badge}`}>
                {order.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                {order.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <p className={`text-xs font-medium ${statusColors.text}`}>Created {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-5 py-4 md:py-5 space-y-3">
        {/* Description */}
        <div>
          <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-1.5">Description</p>
          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
            {order.description}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Quantity */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-blue-700 mb-1">
              <Package className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Qty</span>
            </div>
            <p className="text-base font-bold text-blue-900">{order.quantity || 1}</p>
          </div>

          {/* Total Price */}
          {order.quotedPrice && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-emerald-700 mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Total</span>
              </div>
              <p className="text-base font-bold text-emerald-900">₦{Math.round(calculateTotal(order)).toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Delivery Method & Timeline */}
        <div className="grid grid-cols-2 gap-2">
          {/* Delivery Method */}
          <div className={`${deliveryMethod === 'Pickup' ? 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200' : 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200'} border rounded-lg p-2.5`}>
            <div className={`flex items-center gap-1 ${deliveryMethod === 'Pickup' ? 'text-orange-700' : 'text-cyan-700'} mb-1`}>
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Delivery</span>
            </div>
            <p className={`text-base font-bold ${deliveryMethod === 'Pickup' ? 'text-orange-900' : 'text-cyan-900'}`}>
              {deliveryMethod}
            </p>
          </div>

          {/* Timeline */}
          {order.timerStartedAt && order.deadlineDate ? (
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-red-700 mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Deadline</span>
              </div>
              <p className="text-base font-bold text-red-900">
                {Math.ceil(
                  (new Date(order.deadlineDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )}d
              </p>
            </div>
          ) : order.buyerAgreedToDate && order.proposedDeliveryDate ? (
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-green-700 mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Agreed</span>
              </div>
              <p className="text-base font-bold text-green-900">
                {new Date(order.proposedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          ) : order.deliveryDate ? (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-indigo-700 mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Needed</span>
              </div>
              <p className="text-base font-bold text-indigo-900">
                {new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          ) : null}
        </div>

        {/* Countdown Timer */}
        {order.timerStartedAt && order.deadlineDate && (
          <div className="mt-1">
            <CountdownTimer
              timerStartedAt={order.timerStartedAt}
              deadlineDate={order.deadlineDate}
              status={order.status}
              compact={true}
            />
          </div>
        )}

        {/* Admin Notes */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wide mb-1">Note</p>
            <p className="text-sm text-amber-900 line-clamp-2">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Footer - Actions */}
      <div className="border-t border-gray-100 px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-gray-50/50 to-lime-50/50 flex items-center gap-3">
        {/* View Images Button */}
        {(order.designUrls && order.designUrls.length > 0) || order.designUrl ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewImages();
            }}
            className="flex-1 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>View Design ({order.designUrls?.length || 1})</span>
          </button>
        ) : null}

        {/* Chat Button */}
        <div className="relative flex-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChat();
            }}
            className="w-full bg-gradient-to-br from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white p-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 font-semibold text-sm"
            title="Open chat"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Chat</span>
          </button>

          {messageCount.unread > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg border-2 border-white">
              {messageCount.unread > 99 ? '99+' : messageCount.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
