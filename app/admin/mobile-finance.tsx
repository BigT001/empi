"use client";

import { useEffect, useState } from "react";
import { DollarSign, BarChart3, Calendar, ShoppingCart, TrendingDown } from "lucide-react";
import VATTab from "./vat-tab";
import TransactionHistory from "./transaction-history";
import DailyExpenses from "./daily-expenses";

interface FinanceStats {
  totalRevenue: number;
  totalRents: number;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export default function MobileFinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "vat" | "expenses">("overview");

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch orders to calculate stats
      const response = await fetch("/api/orders/unified?limit=100");
      if (!response.ok) throw new Error("Failed to fetch finance data");

      const data = await response.json();
      const orders = data.orders || [];

      // Calculate stats
      let totalRevenue = 0;
      let totalRents = 0;
      let totalSales = 0;
      const productMap = new Map<
        string,
        { name: string; sales: number; revenue: number }
      >();

      orders.forEach((order: any) => {
        const amount = order.totalAmount || 0;
        totalRevenue += amount;

        if (order.type === "rent") {
          totalRents += amount;
        } else {
          totalSales += amount;
        }

        // Track top products
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const key = item.productId || item.productName || "Unknown";
            const existing = productMap.get(key) || {
              name: item.productName || "Unknown Product",
              sales: 0,
              revenue: 0,
            };
            existing.sales += item.quantity || 1;
            existing.revenue += (item.price || 0) * (item.quantity || 1);
            productMap.set(key, existing);
          });
        }
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalRents,
        totalSales,
        totalOrders: orders.length,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        topProducts,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading finance data";
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-lime-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600 font-semibold">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">❌ {error}</p>
          <button
            onClick={loadFinanceData}
            className="px-6 py-2 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const formatNaira = (value: number) => {
    return `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-3 px-4 py-2 min-w-max">
          <button onClick={() => setActiveTab("overview")} className={`flex items-center gap-1 py-3 px-3 whitespace-nowrap border-b-2 font-medium transition text-sm ${activeTab === "overview" ? "border-lime-600 text-lime-600" : "border-transparent text-gray-600"}`}>
            <DollarSign className="h-4 w-4" />
            Overview
          </button>
          <button onClick={() => setActiveTab("transactions")} className={`flex items-center gap-1 py-3 px-3 whitespace-nowrap border-b-2 font-medium transition text-sm ${activeTab === "transactions" ? "border-lime-600 text-lime-600" : "border-transparent text-gray-600"}`}>
            <ShoppingCart className="h-4 w-4" />
            History
          </button>
          <button onClick={() => setActiveTab("vat")} className={`flex items-center gap-1 py-3 px-3 whitespace-nowrap border-b-2 font-medium transition text-sm ${activeTab === "vat" ? "border-lime-600 text-lime-600" : "border-transparent text-gray-600"}`}>
            <Calendar className="h-4 w-4" />
            VAT
          </button>
          <button onClick={() => setActiveTab("expenses")} className={`flex items-center gap-1 py-3 px-3 whitespace-nowrap border-b-2 font-medium transition text-sm ${activeTab === "expenses" ? "border-lime-600 text-lime-600" : "border-transparent text-gray-600"}`}>
            <TrendingDown className="h-4 w-4" />
            Expenses
          </button>
        </div>
      </div>

      <main className="px-4 py-6">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-2xl p-6 border border-lime-200">
              <p className="text-xs font-bold text-gray-700 uppercase mb-1">Total Revenue</p>
              <p className="text-3xl font-black text-lime-700">{formatNaira(stats?.totalRevenue || 0)}</p>
              <p className="text-xs text-gray-700 mt-2">📈 {stats?.totalOrders || 0} orders</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-600 mb-2">SALES</p>
                <p className="text-xl font-black text-blue-600">{formatNaira(stats?.totalSales || 0)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-600 mb-2">RENTALS</p>
                <p className="text-xl font-black text-purple-600">{formatNaira(stats?.totalRents || 0)}</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === "transactions" && <TransactionHistory />}
        {activeTab === "vat" && <VATTab />}
        {activeTab === "expenses" && <DailyExpenses />}
      </main>
    </div>
  );
}
