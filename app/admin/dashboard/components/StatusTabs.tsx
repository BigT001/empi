"use client";

import type { CustomOrder } from "../CustomOrdersPanel";

interface StatusTabsProps {
  orders: CustomOrder[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export function StatusTabs({ orders, selectedStatus, onStatusChange }: StatusTabsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex gap-2 flex-wrap items-center">
        {[
          { id: "pending", label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-300", badgeColor: "bg-yellow-100" },
          { id: "approved", label: "Approved", color: "bg-blue-50 text-blue-700 border-blue-300", badgeColor: "bg-blue-100" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onStatusChange(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-semibold transition-all border-2 flex items-center gap-2 ${
              selectedStatus === tab.id
                ? `${tab.color} border-current shadow-md scale-105`
                : `${tab.color} border-transparent hover:shadow-md`
            }`}
          >
            <span>{tab.label}</span>
            <span className={`${tab.badgeColor} px-2.5 py-1 rounded-full text-xs font-bold`}>
              {orders.filter(o => o.status === tab.id).length}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
