"use client";

import { useState, useEffect } from "react";
import { PendingPanel } from "./PendingPanel";
import { ApprovedOrdersPanel } from "./ApprovedOrdersPanel";
import { Clock, CheckCircle2, CheckCircle } from "lucide-react";
import { Search } from "lucide-react";

interface RegularOrdersPanelProps {}

export function RegularOrdersPanel({}: RegularOrdersPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "approved" | "completed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalOrderCount, setTotalOrderCount] = useState(0);

  // Fetch total orders count
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const response = await fetch('/api/orders?limit=1000');
        const data = response.ok ? await response.json() : { orders: [] };
        const orders = Array.isArray(data) ? data : (data.orders || []);
        // Count pending/unpaid and approved/paid orders
        const regularOrders = orders.filter((o: any) => 
          (o.status === 'pending' || o.status === 'unpaid' || o.status === 'processing' || o.paymentStatus === 'pending') ||
          (o.status === 'approved' || o.paymentStatus === 'paid')
        );
        setTotalOrderCount(regularOrders.length);
      } catch (error) {
        console.error('[RegularOrdersPanel] Error fetching order count:', error);
      }
    };

    fetchTotalCount();
    // Refresh every 10 seconds
    const interval = setInterval(fetchTotalCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusTabs = [
    { id: "pending", label: "Pending", icon: Clock, color: "bg-red-50 text-red-700 border-red-300", badgeColor: "bg-red-100" },
    { id: "approved", label: "Approved", icon: CheckCircle2, color: "bg-green-50 text-green-700 border-green-300", badgeColor: "bg-green-100" },
    { id: "completed", label: "Completed", icon: CheckCircle, color: "bg-blue-50 text-blue-700 border-blue-300", badgeColor: "bg-blue-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full -ml-48 -mb-48"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-black text-white mb-2">Regular Orders</h2>
            <p className="text-white/90 text-lg">Manage product orders and track order status</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wide">Total Orders</p>
            <p className="text-5xl font-black text-white mt-2">{totalOrderCount}</p>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex gap-2 flex-wrap items-center">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id as "pending" | "approved" | "completed")}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all border-2 flex items-center gap-2 ${
                selectedStatus === tab.id
                  ? `${tab.color} border-current shadow-md scale-105`
                  : `${tab.color} border-transparent hover:shadow-md`
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2 rounded-lg border border-gray-300 bg-white placeholder-gray-400 text-gray-900 outline-none focus:ring-2 focus:ring-lime-600 focus:border-lime-600 transition"
          />
        </div>
      </div>

      {/* Content - Show appropriate panel based on selected status */}
      {selectedStatus === "pending" && <PendingPanel searchQuery={searchQuery} />}
      {selectedStatus === "approved" && <ApprovedOrdersPanel searchQuery={searchQuery} />}
      {selectedStatus === "completed" && <ApprovedOrdersPanel searchQuery={searchQuery} />}
    </div>
  );
}
