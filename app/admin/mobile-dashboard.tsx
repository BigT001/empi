"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Package, DollarSign, ShoppingBag, Clock } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingInvoices: number;
  totalRents: number;
  totalSales: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderId: string;
    totalAmount: number;
    status: string;
    type: string;
    createdAt: string;
  }>;
}

export default function MobileDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch orders and products data
      const [ordersResponse, productsResponse] = await Promise.all([
        fetch("/api/orders?limit=100"),
        fetch("/api/products?limit=100"),
      ]);

      if (!ordersResponse.ok || !productsResponse.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();

      const orders = ordersData.orders || [];
      const products = productsData.products || [];

      // Calculate stats
      let totalRevenue = 0;
      let totalRents = 0;
      let totalSales = 0;
      let pendingInvoices = 0;
      const productMap = new Map<
        string,
        { name: string; sales: number; revenue: number }
      >();
      const recentOrdersList: any[] = [];

      orders.forEach((order: any) => {
        const amount = order.totalAmount || 0;
        totalRevenue += amount;

        if (order.type === "rent") {
          totalRents += amount;
        } else {
          totalSales += amount;
        }

        if (order.status === "pending" || order.status === "unpaid") {
          pendingInvoices += 1;
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

        // Get recent orders (last 5)
        if (recentOrdersList.length < 5) {
          recentOrdersList.push({
            id: order._id,
            orderId: order.orderId || order._id,
            totalAmount: amount,
            status: order.status,
            type: order.type,
            createdAt: order.createdAt,
          });
        }
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        pendingInvoices,
        totalRents,
        totalSales,
        topProducts,
        recentOrders: recentOrdersList,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(errorMsg);
      Sentry.captureException(err, {
        tags: { component: "MobileDashboard" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-lime-600 to-lime-700 rounded-lg p-4 text-white">
        <h1 className="text-2xl font-bold mb-1">Welcome Back! 👋</h1>
        <p className="text-lime-100 text-sm">Here's your store's performance today</p>
      </div>

      {/* Key Metrics - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Revenue */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs font-medium">REVENUE</span>
            <DollarSign className="h-5 w-5 text-lime-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total all time</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs font-medium">ORDERS</span>
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Total orders</p>
        </div>

        {/* Total Products */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs font-medium">PRODUCTS</span>
            <Package className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.totalProducts}</p>
          <p className="text-xs text-gray-500 mt-1">In catalog</p>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs font-medium">PENDING</span>
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.pendingInvoices}</p>
          <p className="text-xs text-gray-500 mt-1">Unpaid invoices</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Sales</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(stats.totalSales)}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full"
                style={{
                  width: `${
                    stats.totalRevenue > 0
                      ? (stats.totalSales / stats.totalRevenue) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Rentals</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(stats.totalRents)}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full"
                style={{
                  width: `${
                    stats.totalRevenue > 0
                      ? (stats.totalRents / stats.totalRevenue) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {stats.topProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-bold text-gray-900 mb-3">Top Products</h2>
          <div className="space-y-2">
            {stats.topProducts.slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.sales} sales
                  </p>
                </div>
                <p className="text-sm font-bold text-lime-600">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {stats.recentOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-bold text-gray-900 mb-3">Recent Orders</h2>
          <div className="space-y-2">
            {stats.recentOrders.map((order, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.type === "rent" ? "🎫 Rental" : "🛍️ Sale"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : order.status === "pending" || order.status === "unpaid"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalOrders === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-2">No orders yet</p>
          <p className="text-gray-500 text-sm">
            Orders will appear here when customers start purchasing
          </p>
        </div>
      )}
    </div>
  );
}
