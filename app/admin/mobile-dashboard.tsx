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
  totalRents: number;
  totalSales: number;
  completedOrders: number;
  totalCustomers: number;
  registeredCustomers: number;
  guestCustomers: number;
  averageOrderValue: number;
  growthRate: number;
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

      console.log('[Dashboard] Loading data from APIs...');

      // Fetch all necessary data in parallel
      const [ordersResponse, productsResponse] = await Promise.all([
        fetch("/api/orders").catch(err => {
          console.error('[Dashboard] Orders fetch error:', err);
          return null;
        }),
        fetch("/api/products").catch(err => {
          console.error('[Dashboard] Products fetch error:', err);
          return null;
        }),
      ]);

      // Handle null responses (network errors)
      if (!ordersResponse) {
        console.warn('[Dashboard] Orders API unavailable, using empty data');
        throw new Error('Failed to fetch orders data');
      }

      let orders = [];
      let products = [];

      // Parse orders response
      if (ordersResponse?.ok) {
        try {
          const ordersData = await ordersResponse.json();
          console.log('[Dashboard] Orders response:', ordersData);
          orders = ordersData.orders || [];
        } catch (e) {
          console.error('[Dashboard] Failed to parse orders:', e);
          throw new Error('Invalid orders data format');
        }
      } else {
        throw new Error('Failed to fetch orders: ' + ordersResponse?.status);
      }

      // Parse products response
      if (productsResponse?.ok) {
        try {
          const productsData = await productsResponse.json();
          console.log('[Dashboard] Products response:', productsData);
          products = productsData.products || [];
        } catch (e) {
          console.error('[Dashboard] Failed to parse products:', e);
        }
      }

      console.log('[Dashboard] Loaded - Orders:', orders.length, 'Products:', products.length);

      // Calculate comprehensive stats
      let totalRevenue = 0;
      let totalRents = 0;
      let totalSales = 0;
      let pendingInvoices = 0;
      let completedOrders = 0;
      let registeredCustomersCount = 0;
      let guestCustomersCount = 0;
      const uniqueRegisteredEmails = new Set<string>();
      const uniqueGuestEmails = new Set<string>();

      orders.forEach((order: any) => {
        const amount = order.total || order.totalAmount || 0;
        totalRevenue += amount;

        // Track registered vs guest customers by buyerId
        // If buyerId exists = registered customer (signed up and logged in)
        // If no buyerId = guest customer (checkout without signup)
        if (order.buyerId) {
          // Registered user - has signed up
          if (order.email) {
            uniqueRegisteredEmails.add(order.email);
          }
        } else {
          // Guest user - bought without signing up
          if (order.email) {
            uniqueGuestEmails.add(order.email);
          }
        }

        // Categorize by type
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item.mode === "rent" || item.rentalDays) {
              totalRents += (item.price || 0) * (item.quantity || 1);
            } else {
              totalSales += (item.price || 0) * (item.quantity || 1);
            }
          });
        }

        // Track status
        if (order.status === "pending" || order.status === "unpaid") {
          pendingInvoices += 1;
        } else if (order.status === "completed" || order.status === "delivered") {
          completedOrders += 1;
        }
      });

      // Get unique counts
      const registeredCount = uniqueRegisteredEmails.size;
      const guestCount = uniqueGuestEmails.size;
      const totalCustomersCount = registeredCount + guestCount; // Total = Registered + Guest

      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Calculate growth rate (simple: completed vs pending ratio)
      const growthRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

      console.log('[Dashboard] Customer breakdown:', {
        registered: registeredCount,
        guest: guestCount,
        total: totalCustomersCount
      });

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        pendingInvoices,
        totalRents,
        totalSales,
        completedOrders,
        totalCustomers: totalCustomersCount,
        registeredCustomers: registeredCount,
        guestCustomers: guestCount,
        averageOrderValue,
        growthRate,
      });

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
    <div className="p-4 space-y-4 pb-24">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdated ? formatTime(lastUpdated) : "Loading..."}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={isLoading}
          className={`p-2 rounded-lg transition ${
            isLoading 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
              : "bg-lime-100 text-lime-600 hover:bg-lime-200"
          }`}
          title="Refresh data"
        >
          <Activity className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-lime-600 to-lime-700 rounded-lg p-4 text-white">
        <h2 className="text-xl font-bold mb-1">Welcome Back! 👋</h2>
        <p className="text-lime-100 text-sm">Here's your store's performance overview</p>
      </div>

      {/* Primary Metrics - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Revenue */}
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="REVENUE"
          value={formatCurrency(stats.totalRevenue)}
          subtext="Total all-time"
          trend={stats.totalSales > stats.totalRents ? "up" : "down"}
          color="lime"
        />

        {/* Total Orders */}
        <MetricCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="ORDERS"
          value={formatNumber(stats.totalOrders)}
          subtext={`${stats.completedOrders} completed`}
          trend="up"
          color="blue"
        />

        {/* Total Products */}
        <MetricCard
          icon={<Package className="h-5 w-5" />}
          label="PRODUCTS"
          value={formatNumber(stats.totalProducts)}
          subtext="In catalog"
          trend="neutral"
          color="purple"
        />

        {/* Total Customers */}
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="CUSTOMERS"
          value={formatNumber(stats.totalCustomers)}
          subtext="Total unique"
          trend="up"
          color="orange"
        />
      </div>

      {/* Customer Breakdown - Registered vs Guest */}
      <div className="grid grid-cols-2 gap-3">
        {/* Registered Customers */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-700 uppercase">Registered</span>
            <UserCheck className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.registeredCustomers}</p>
          <p className="text-xs text-blue-600 mt-1">
            {stats.totalCustomers > 0 
              ? ((stats.registeredCustomers / stats.totalCustomers) * 100).toFixed(0) 
              : "0"}% of total
          </p>
        </div>

        {/* Guest Customers */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-orange-700 uppercase">Guest</span>
            <UserPlus className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{stats.guestCustomers}</p>
          <p className="text-xs text-orange-600 mt-1">
            {stats.totalCustomers > 0 
              ? ((stats.guestCustomers / stats.totalCustomers) * 100).toFixed(0) 
              : "0"}% of total
          </p>
        </div>
      </div>

      {/* Key Performance Indicators - 3 Column */}
      <div className="grid grid-cols-3 gap-2">
        {/* Average Order Value */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-semibold mb-1">AVG ORDER</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(stats.averageOrderValue)}
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-semibold mb-1">PENDING</p>
          <p className="text-sm font-bold text-orange-600">{stats.pendingInvoices}</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-semibold mb-1">COMPLETION</p>
          <p className="text-sm font-bold text-green-600">{stats.growthRate.toFixed(0)}%</p>
        </div>
      </div>

      {/* Revenue Breakdown - Pie Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
        <div className="flex items-center justify-center mb-6">
          <PieChart 
            salesRevenue={stats.totalSales} 
            rentalRevenue={stats.totalRents}
          />
        </div>
        
        {/* Legend and Details */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <span className="text-sm text-gray-600">Sales (Buy)</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(stats.totalSales)}
              </p>
              <p className="text-xs text-gray-500">
                {stats.totalRevenue > 0
                  ? ((stats.totalSales / stats.totalRevenue) * 100).toFixed(1)
                  : "0"}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
              <span className="text-sm text-gray-600">Rentals</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(stats.totalRents)}
              </p>
              <p className="text-xs text-gray-500">
                {stats.totalRevenue > 0
                  ? ((stats.totalRents / stats.totalRevenue) * 100).toFixed(1)
                  : "0"}%
              </p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Activity Status */}
      {stats.totalOrders > 0 && (
        <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="h-3 w-3 bg-lime-600 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-semibold text-lime-900">Store Active</p>
              <p className="text-xs text-lime-700 mt-0.5">
                Processing orders and serving customers successfully
              </p>
            </div>
          </div>
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
  const colorMap = {
    lime: "text-lime-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  const trendIcon = trend === "up" ? (
    <ArrowUpRight className="h-4 w-4 text-green-600" />
  ) : trend === "down" ? (
    <ArrowDownRight className="h-4 w-4 text-red-600" />
  ) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-xs font-semibold">{label}</span>
        <span className={colorMap[color]}>{icon}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-500">{subtext}</p>
        {trendIcon && <div className="flex-shrink-0">{trendIcon}</div>}
      </div>
    </div>
  );
}
