"use client";

import { Mail, Phone, Calendar, Clock, FileText, MessageCircle, Play } from "lucide-react";
import type { CustomOrder } from "../CustomOrdersPanel";

interface ApprovedOrderCardProps {
  order: CustomOrder;
  onChatClick: (orderId: string) => void;
  onStartProduction?: (orderId: string) => void;
}

export function ApprovedOrderCard({ order, onChatClick, onStartProduction }: ApprovedOrderCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-blue-200 overflow-hidden shadow-md hover:shadow-xl hover:border-blue-300 transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-5 text-white">
        <h3 className="font-bold text-lg">{order.fullName}</h3>
        <p className="text-sm text-blue-100 mt-1">{order.city || 'Location not set'}</p>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-blue-600" />
            <p className="text-gray-700 truncate">{order.email}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-blue-600" />
            <p className="text-gray-700">{order.phone || 'N/A'}</p>
          </div>
        </div>

        {/* Stats - 3 column grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200">
          <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{order.quantity || '—'}</p>
            <p className="text-xs text-blue-600 font-medium">Quantity</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
            <p className="text-lg font-bold text-green-700">
              ₦{order.quotedPrice ? (
                order.quotedPrice < 1000000 
                  ? (order.quotedPrice / 1000) + 'K'
                  : (order.quotedPrice / 1000000) + 'M'
              ) : 'Pending'}
            </p>
            <p className="text-xs text-green-600 font-medium">💚 Paid</p>
          </div>
          {order.deliveryDate && (
            <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-200">
              <p className="text-xs font-bold text-emerald-700">{new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}</p>
              <p className="text-xs text-emerald-600 font-medium">✓ Agreed</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Order Info</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <FileText className="h-3.5 w-3.5" />
              <span>#{order.orderNumber}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={() => onStartProduction?.(order._id)}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Production
          </button>
          <button
            onClick={() => onChatClick(order._id)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}
