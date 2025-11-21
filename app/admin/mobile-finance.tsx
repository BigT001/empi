"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

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

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch orders to calculate stats
      const response = await fetch("/api/orders?limit=100");
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
      Sentry.captureException(err);
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
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">📊 Finance & Analytics</h1>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 space-y-3">
        {/* Total Revenue - Hero Card */}
        <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-2xl p-6 border border-lime-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Total Revenue
              </p>
              <p className="text-4xl font-black text-lime-700">
                {formatNaira(stats?.totalRevenue || 0)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-lime-600 opacity-30" />
          </div>
          <p className="text-xs text-gray-700">
            📈 {stats?.totalOrders || 0} orders processed
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Sales */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">SALES</p>
            <p className="text-2xl font-black text-blue-600">
              {formatNaira(stats?.totalSales || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">🛍️ Direct sales</p>
          </div>

          {/* Total Rents */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">RENTALS</p>
            <p className="text-2xl font-black text-purple-600">
              {formatNaira(stats?.totalRents || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">👗 Rental revenue</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">ORDERS</p>
            <p className="text-2xl font-black text-orange-600">{stats?.totalOrders || 0}</p>
            <p className="text-xs text-gray-500 mt-2">📦 Total transactions</p>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">AVG ORDER</p>
            <p className="text-2xl font-black text-emerald-600">
              {formatNaira(stats?.averageOrderValue || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">💰 Per order</p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Revenue Breakdown</h3>

          {/* Sales Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-700">Sales</p>
              <p className="text-sm font-bold text-blue-600">
                {((stats?.totalSales || 0) / (stats?.totalRevenue || 1) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${((stats?.totalSales || 0) / (stats?.totalRevenue || 1) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{formatNaira(stats?.totalSales || 0)}</p>
          </div>

          {/* Rentals Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-700">Rentals</p>
              <p className="text-sm font-bold text-purple-600">
                {((stats?.totalRents || 0) / (stats?.totalRevenue || 1) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500"
                style={{
                  width: `${((stats?.totalRents || 0) / (stats?.totalRevenue || 1) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{formatNaira(stats?.totalRents || 0)}</p>
          </div>
        </div>

        {/* Top Products */}
        {stats?.topProducts && stats.topProducts.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="font-bold text-lg text-gray-900 mb-4">🔥 Top Products</h3>
            <div className="space-y-3">
              {stats.topProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {product.sales} item{product.sales > 1 ? "s" : ""} sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lime-600">{formatNaira(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!stats?.topProducts || stats.topProducts.length === 0) && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
            <p className="text-gray-500 font-semibold">📭 No sales data yet</p>
            <p className="text-xs text-gray-400 mt-2">Products will appear here once customers start ordering</p>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={loadFinanceData}
          className="w-full py-3 px-4 bg-lime-600 hover:bg-lime-700 text-white rounded-xl font-bold transition active:scale-95"
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
