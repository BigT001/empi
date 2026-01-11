"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, Users, Package, DollarSign, ShoppingBag, Clock, 
  ArrowUpRight, ArrowDownRight, Activity, AlertCircle, UserPlus, UserCheck
} from "lucide-react";
import { useAdmin } from "@/app/context/AdminContext";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingInvoices: number;
  pendingOrders?: number;
  totalRents: number;
  totalSales: number;
  totalRentOrders: number;
  totalSalesOrders: number;
  completedOrders: number;
  totalCustomers: number;
  registeredCustomers: number;
  guestCustomers: number;
  averageOrderValue: number;
  completionRate: number;
  timestamp: string;
}

export default function MobileDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError("");

      console.log('[Dashboard] Loading accurate real data from API...');

      // Fetch dashboard data from dedicated API endpoint
      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const apiData = await response.json();
      console.log('[Dashboard] Received stats:', apiData);

      // Ensure all fields are present with defaults
      const stats: DashboardStats = {
        totalRevenue: apiData.totalRevenue ?? 0,
        totalOrders: apiData.totalOrders ?? 0,
        totalProducts: apiData.totalProducts ?? 0,
        // prefer pendingOrders (includes custom orders) when available
        pendingInvoices: apiData.pendingInvoices ?? 0,
        pendingOrders: apiData.pendingOrders ?? apiData.pendingInvoices ?? 0,
        totalRents: apiData.totalRents ?? 0,
        totalSales: apiData.totalSales ?? 0,
        totalRentOrders: apiData.totalRentOrders ?? 0,
        totalSalesOrders: apiData.totalSalesOrders ?? 0,
        completedOrders: apiData.completedOrders ?? 0,
        totalCustomers: apiData.totalCustomers ?? 0,
        registeredCustomers: apiData.registeredCustomers ?? 0,
        guestCustomers: apiData.guestCustomers ?? 0,
        averageOrderValue: apiData.averageOrderValue ?? 0,
        completionRate: apiData.completionRate ?? 0,
        timestamp: apiData.timestamp ?? new Date().toISOString(),
      };

      console.log('[Dashboard] Normalized stats:', {
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        completionRate: stats.completionRate,
        registeredCustomers: stats.registeredCustomers,
        guestCustomers: stats.guestCustomers,
      });

      setStats(stats);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(errorMsg);
      console.error("[Dashboard Error]", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number | undefined | null) => {
    const n = num ?? 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-NG", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  if (isLoading && !stats) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-semibold">Error Loading Dashboard</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={loadDashboardData}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
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
    <div className="p-4 space-y-6 pb-24">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated ? formatTime(lastUpdated) : "Loading..."}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={isLoading}
          className={`p-2.5 rounded-lg transition ${
            isLoading 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
              : "bg-lime-100 text-lime-600 hover:bg-lime-200"
          }`}
          title="Refresh data"
        >
          <Activity className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Premium Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-lime-600 opacity-10 rounded-full -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-lime-600 opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Welcome Back! 👋</h2>
          <p className="text-slate-300 text-base md:text-lg">Here's your store's real-time performance overview</p>
        </div>
      </div>

      {/* Primary Metrics - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Revenue */}
        <MetricCard
          icon={<DollarSign className="h-6 w-6" />}
          label="REVENUE"
          value={formatCurrency(stats.totalRevenue)}
          subtext="All-time earnings"
          trend={stats.totalSalesOrders > stats.totalRentOrders ? "up" : "down"}
          color="lime"
        />

        {/* Rentals - Order Count */}
        <MetricCard
          icon={<Clock className="h-6 w-6" />}
          label="RENTALS"
          value={formatNumber(stats.totalRentOrders)}
          subtext="Rental orders"
          trend="up"
          color="cyan"
        />

        {/* Sales - Order Count */}
        <MetricCard
          icon={<ShoppingBag className="h-6 w-6" />}
          label="SALES"
          value={formatNumber(stats.totalSalesOrders)}
          subtext="Sales orders"
          trend="up"
          color="green"
        />

        {/* Total Products */}
        <MetricCard
          icon={<Package className="h-6 w-6" />}
          label="PRODUCTS"
          value={formatNumber(stats.totalProducts)}
          subtext="Active in catalog"
          trend="neutral"
          color="purple"
        />
      </div>

      {/* Empty State */}
      {stats.totalOrders === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
          <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-black text-lg mb-2">No Orders Yet</p>
          <p className="text-slate-500 text-sm">
            Orders will appear here when customers start purchasing
          </p>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  trend?: "up" | "down" | "neutral";
  color: "lime" | "blue" | "purple" | "orange" | "cyan" | "green";
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  trend = "neutral",
  color,
}: MetricCardProps) {
  const colorConfigs = {
    lime: {
      icon: "text-lime-600",
      bg: "from-lime-50 to-lime-100",
      border: "border-lime-200",
      textColor: "text-lime-900",
      subText: "text-lime-600",
    },
    blue: {
      icon: "text-blue-600",
      bg: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      textColor: "text-blue-900",
      subText: "text-blue-600",
    },
    purple: {
      icon: "text-purple-600",
      bg: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      textColor: "text-purple-900",
      subText: "text-purple-600",
    },
    orange: {
      icon: "text-orange-600",
      bg: "from-orange-50 to-orange-100",
      border: "border-orange-200",
      textColor: "text-orange-900",
      subText: "text-orange-600",
    },
    cyan: {
      icon: "text-cyan-600",
      bg: "from-cyan-50 to-cyan-100",
      border: "border-cyan-200",
      textColor: "text-cyan-900",
      subText: "text-cyan-600",
    },
    green: {
      icon: "text-green-600",
      bg: "from-green-50 to-green-100",
      border: "border-green-200",
      textColor: "text-green-900",
      subText: "text-green-600",
    },
  };

  const config = colorConfigs[color] || colorConfigs.lime;

  const trendIcon = trend === "up" ? (
    <ArrowUpRight className="h-4 w-4 text-green-600" />
  ) : trend === "down" ? (
    <ArrowDownRight className="h-4 w-4 text-red-600" />
  ) : null;

  return (
    <div className={`bg-gradient-to-br ${config.bg} border ${config.border} rounded-xl p-4 shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-black uppercase tracking-wider ${config.subText}`}>{label}</span>
        <span className={config.icon}>{icon}</span>
      </div>
      <p className={`text-2xl md:text-3xl font-black ${config.textColor}`}>{value}</p>
      <div className="flex items-center justify-between mt-2">
        <p className={`text-xs font-semibold ${config.subText}`}>{subtext}</p>
        {trendIcon && <div className="flex-shrink-0">{trendIcon}</div>}
      </div>
    </div>
  );
}
