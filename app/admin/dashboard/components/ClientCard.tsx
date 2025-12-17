"use client";

import { Mail, Phone, Calendar } from "lucide-react";
import type { CustomOrder } from "../CustomOrdersPanel";

interface ClientCardProps {
  email: string;
  firstOrder: CustomOrder;
  clientOrders: CustomOrder[];
  onStatusClick: (status: string) => void;
}

export function ClientCard({ email, firstOrder, clientOrders, onStatusClick }: ClientCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-md hover:shadow-xl hover:border-slate-300 transition-all h-full flex flex-col">
      {/* Client Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white flex-shrink-0">
        <h3 className="font-bold text-xl">{firstOrder.fullName || 'Buyer'}</h3>
        <p className="text-sm text-indigo-100 mt-1">{firstOrder.city || 'Location not set'}</p>
      </div>

      {/* Client Details */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* Contact Info */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-indigo-600 flex-shrink-0" />
            <p className="text-gray-700 truncate">{email}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-indigo-600 flex-shrink-0" />
            <p className="text-gray-700">{firstOrder.phone || 'N/A'}</p>
          </div>
        </div>

        {/* Orders Count */}
        <div className="pt-3 border-t border-slate-200 flex-shrink-0">
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <p className="text-3xl font-bold text-indigo-700">{clientOrders.length}</p>
            <p className="text-xs text-indigo-600 font-medium mt-1">Total Orders</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="pt-3 border-t border-slate-200 flex-1 flex flex-col">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider flex-shrink-0">Order Status</p>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {[
              { status: 'pending', label: 'Pending', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' },
              { status: 'approved', label: 'Approved', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' },
              { status: 'in-progress', label: 'In Progress', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200' },
              { status: 'ready', label: 'Ready', color: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' },
              { status: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' },
              { status: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' }
            ].map((stat) => {
              const count = clientOrders.filter(o => o.status === stat.status).length;
              return (
                <button
                  key={stat.status}
                  onClick={() => count > 0 && onStatusClick(stat.status)}
                  disabled={count === 0}
                  className={`${stat.color} rounded-lg p-2 text-center text-xs font-semibold transition-all ${count > 0 ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <p className="font-bold text-lg">{count}</p>
                  <p className="text-xs">{stat.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
