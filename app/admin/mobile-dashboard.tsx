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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
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
          trend={stats.totalSales > stats.totalRents ? "up" : "down"}
          color="lime"
        />

        {/* Total Orders */}
        <MetricCard
          icon={<ShoppingBag className="h-6 w-6" />}
          label="ORDERS"
          value={formatNumber(stats.totalOrders)}
          subtext={`${stats.completedOrders} completed`}
          trend="up"
          color="blue"
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

        {/* Total Customers */}
        <MetricCard
          icon={<Users className="h-6 w-6" />}
          label="CUSTOMERS"
          value={formatNumber(stats.totalCustomers)}
          subtext="Unique buyers"
          trend="up"
          color="orange"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* Sales Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-green-700 uppercase tracking-wider">Sales</span>
            <ShoppingBag className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-black text-green-900">{formatCurrency(stats.totalSales)}</p>
          <p className="text-xs text-green-600 mt-2 font-semibold">
            {stats.totalRevenue > 0 
              ? ((stats.totalSales / stats.totalRevenue) * 100).toFixed(0) 
              : "0"}% of revenue
          </p>
        </div>

        {/* Rental Revenue */}
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-cyan-700 uppercase tracking-wider">Rentals</span>
            <Clock className="h-5 w-5 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-cyan-900">{formatCurrency(stats.totalRents)}</p>
          <p className="text-xs text-cyan-600 mt-2 font-semibold">
            {stats.totalRevenue > 0 
              ? ((stats.totalRents / stats.totalRevenue) * 100).toFixed(0) 
              : "0"}% of revenue
          </p>
        </div>
      </div>

      {/* Customer Breakdown - Registered vs Guest */}
      <div className="grid grid-cols-2 gap-4">
        {/* Registered Customers */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-blue-700 uppercase tracking-wider">Registered</span>
            <UserCheck className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-900">{stats.registeredCustomers}</p>
          <p className="text-xs text-blue-600 mt-2 font-semibold">
            {stats.totalCustomers > 0 
              ? ((stats.registeredCustomers / stats.totalCustomers) * 100).toFixed(0) 
              : "0"}% of customers
          </p>
        </div>

        {/* Guest Customers */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-pink-700 uppercase tracking-wider">Guest</span>
            <UserPlus className="h-5 w-5 text-pink-600" />
          </div>
          <p className="text-3xl font-black text-pink-900">{stats.guestCustomers}</p>
          <p className="text-xs text-pink-600 mt-2 font-semibold">
            {stats.totalCustomers > 0 
              ? ((stats.guestCustomers / stats.totalCustomers) * 100).toFixed(0) 
              : "0"}% of customers
          </p>
        </div>
      </div>

      {/* Key Performance Indicators - Premium Section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-5">Key Metrics</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* Average Order Value */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition">
            <p className="text-xs font-black text-slate-600 uppercase mb-2 tracking-wider">Avg Order</p>
            <p className="text-xl font-black text-slate-900">
              {formatCurrency(stats.averageOrderValue)}
            </p>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition">
            <p className="text-xs font-black text-slate-600 uppercase mb-2 tracking-wider">Pending</p>
            <p className="text-xl font-black text-orange-600">{(stats.pendingOrders ?? stats.pendingInvoices)}</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition">
            <p className="text-xs font-black text-slate-600 uppercase mb-2 tracking-wider">Complete</p>
            <p className="text-xl font-black text-green-600">
              {typeof stats.completionRate === 'number' ? stats.completionRate.toFixed(0) : '0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {stats.totalOrders > 0 && (
        <div className="bg-gradient-to-r from-lime-600 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-white rounded-full animate-pulse"></div>
              <div>
                <p className="font-black text-lg">Store Active</p>
                <p className="text-lime-100 text-sm">Processing orders & serving customers</p>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-lime-100" />
          </div>
        </div>
      )}

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

// Pie Chart Component for Revenue Breakdown
interface PieChartProps {
  salesRevenue: number;
  rentalRevenue: number;
}

function PieChart({ salesRevenue, rentalRevenue }: PieChartProps) {
  const total = salesRevenue + rentalRevenue;
  const salesPercentage = total > 0 ? (salesRevenue / total) * 100 : 0;
  const rentalPercentage = total > 0 ? (rentalRevenue / total) * 100 : 0;

  // Convert percentages to SVG path angles
  const salesAngle = (salesPercentage / 100) * 360;
  const rentalAngle = (rentalPercentage / 100) * 360;

  // SVG pie chart dimensions
  const radius = 50;
  const centerX = 60;
  const centerY = 60;

  // Calculate arc paths
  const getSvgPath = (startAngle: number, endAngle: number, isLarge: boolean) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = isLarge ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const salesPath = getSvgPath(0, salesAngle, salesAngle > 180);
  const rentalPath = getSvgPath(salesAngle, 360, rentalAngle > 180);

  return (
    <div className="relative w-40 h-40">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Sales Slice (Blue) */}
        <path
          d={salesPath}
          fill="url(#blueGradient)"
          stroke="white"
          strokeWidth="2"
        />
        {/* Rental Slice (Purple) */}
        <path
          d={rentalPath}
          fill="url(#purpleGradient)"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-bold text-gray-900">100%</p>
        </div>
      </div>
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
  color: "lime" | "blue" | "purple" | "orange";
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
  };

  const config = colorConfigs[color];

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
