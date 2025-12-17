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
        <button
          onClick={() => onStatusChange("all")}
          className={`px-4 py-2.5 rounded-xl font-semibold transition-all border-2 flex items-center gap-2 ${
            selectedStatus === "all"
              ? "bg-slate-100 text-slate-700 border-slate-300 border-current shadow-md scale-105"
              : "bg-slate-100 text-slate-700 border-slate-300 border-transparent hover:shadow-md"
          }`}
        >
          <span>Clients</span>
          <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
            {new Set(orders.map(o => o.email)).size}
          </span>
        </button>

        {[
          { id: "pending", label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-300", badgeColor: "bg-yellow-100" },
          { id: "approved", label: "Approved", color: "bg-blue-50 text-blue-700 border-blue-300", badgeColor: "bg-blue-100" },
          { id: "in-progress", label: "In Progress", color: "bg-purple-50 text-purple-700 border-purple-300", badgeColor: "bg-purple-100" },
          { id: "ready", label: "Ready", color: "bg-green-50 text-green-700 border-green-300", badgeColor: "bg-green-100" },
          { id: "completed", label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-300", badgeColor: "bg-emerald-100" },
          { id: "rejected", label: "Rejected", color: "bg-red-50 text-red-700 border-red-300", badgeColor: "bg-red-100" }
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
