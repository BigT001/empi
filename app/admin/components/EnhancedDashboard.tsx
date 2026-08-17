'use client';

import { useEffect, useState, useRef } from 'react';
import {
  SalesRentalsChart,
  RevenueTrendChart,
  CumulativeRevenueChart,
  OrdersCountChart,
} from './DashboardCharts';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  Receipt,
  Package,
  Users,
  RefreshCw,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Activity,
  Layers,
  Award
} from 'lucide-react';

interface DailyMetrics {
  date: string;
  salesRevenue: number;
  rentalRevenue: number;
  totalRevenue: number;
  ordersCount: number;
  rentalOrdersCount: number;
  salesOrdersCount: number;
}

interface StoreActivity {
  id: string;
  type: 'order' | 'user' | 'payment' | 'offline';
  title: string;
  subtitle: string;
  timestamp: string;
  badge: string;
  badgeColor: string;
}

interface Analytics {
  summary: {
    totalRevenue: number;
    totalSalesRevenue: number;
    totalRentalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalProducts: number;
    totalCustomers: number;
    registeredCustomers: number;
    guestCustomers: number;
    averageOrderValue: number;
    completionRate: number;
  };
  cautionFeeMetrics: {
    totalCollected: number;
    totalRefunded: number;
    totalPartiallyRefunded: number;
    totalForfeited: number;
    pendingReturn: number;
    refundRate: number;
    averageRefundDays: number;
  };
  expenseMetrics?: {
    count: number;
    totalAmount: number;
    totalVAT: number;
  };
  vatMetrics?: {
    totalVAT: number;
    inputVAT: number;
    outputVAT: number;
    vatPayable: number;
    vatExempt: number;
  };
  revenueBreakdown?: {
    onlineSalesRevenue: number;
    onlineRentalRevenue: number;
  };
  offlineRevenueBreakdown?: {
    salesRevenue: number;
    rentalRevenue: number;
  };
  orderTypeBreakdown?: {
    online: number;
    offline: number;
  };
  dailyMetrics: DailyMetrics[];
  topProducts: Array<{ name: string; imageUrl?: string; unitsSold: number; revenue: number }>;
  recentActivities: StoreActivity[];
  customerMetrics: {
    newCustomersThisMonth: number;
    returningCustomers: number;
    customerRetentionRate: number;
  };
}

// Function to calculate daily metrics from orders
function calculateDailyMetrics(orders: any[]): DailyMetrics[] {
  const dailyMetricsMap = new Map<string, DailyMetrics>();

  orders.forEach((order: any) => {
    const isOnline = !order.isOffline;
    if (isOnline && order.paymentVerified !== true) return;

    const orderDate = order.createdAt || order.created_at || new Date();
    const dateObj = new Date(orderDate);
    const dateStr = dateObj.toISOString().split('T')[0];

    if (!dailyMetricsMap.has(dateStr)) {
      dailyMetricsMap.set(dateStr, {
        date: dateStr,
        salesRevenue: 0,
        rentalRevenue: 0,
        totalRevenue: 0,
        ordersCount: 0,
        rentalOrdersCount: 0,
        salesOrdersCount: 0,
      });
    }

    const dailyMetric = dailyMetricsMap.get(dateStr)!;
    const items = order.items || [];

    let orderSalesRevenue = 0;
    let orderRentalRevenue = 0;
    let hasRental = false;
    let hasSales = false;

    items.forEach((item: any) => {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 1;
      const itemRevenue = itemPrice * itemQuantity;

      if (item.mode === 'rent' || item.mode === 'rental') {
        orderRentalRevenue += itemRevenue;
        hasRental = true;
      } else if (item.mode === 'buy' || item.mode === 'sale' || item.mode === 'sales') {
        orderSalesRevenue += itemRevenue;
        hasSales = true;
      } else {
        if (item.rentalDays) {
          orderRentalRevenue += itemRevenue;
          hasRental = true;
        } else {
          orderSalesRevenue += itemRevenue;
          hasSales = true;
        }
      }
    });

    if (items.length === 0 && order.total) {
      orderSalesRevenue = order.total;
      hasSales = true;
    }

    dailyMetric.salesRevenue += orderSalesRevenue;
    dailyMetric.rentalRevenue += orderRentalRevenue;
    dailyMetric.totalRevenue += orderSalesRevenue + orderRentalRevenue;
    dailyMetric.ordersCount += 1;

    if (hasRental) dailyMetric.rentalOrdersCount += 1;
    if (hasSales) dailyMetric.salesOrdersCount += 1;
  });

  return Array.from(dailyMetricsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function EnhancedDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [error, setError] = useState<string | null>(null);
  const initialLoadRef = useRef(true);

  const fetchAnalytics = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      setError(null);

      const [ordersRes, offlineOrdersRes, productsRes, usersRes, expensesRes] = await Promise.all([
        fetch("/api/orders/unified?limit=500&t=" + Date.now(), { cache: 'no-store' }),
        fetch("/api/admin/offline-orders?t=" + Date.now(), { cache: 'no-store' }),
        fetch("/api/products?t=" + Date.now(), { cache: 'no-store' }),
        fetch("/api/admin/buyers?t=" + Date.now(), { cache: 'no-store' }),
        fetch("/api/expenses?t=" + Date.now(), { cache: 'no-store' }),
      ]);

      const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [], total: 0 };
      const offlineOrdersData = offlineOrdersRes.ok ? await offlineOrdersRes.json() : { data: [], pagination: { total: 0 } };
      const productsData = productsRes.ok ? await productsRes.json() : { data: [], pagination: { total: 0 } };
      const usersData = usersRes.ok ? await usersRes.json() : { buyers: [], total: 0 };
      const expensesData = expensesRes.ok ? await expensesRes.json() : { expenses: [] };

      const onlineOrders = ordersData.orders?.filter((o: any) => !o.isOffline) || [];
      const offlineOrders = offlineOrdersData.data || [];
      const allOrders = [...onlineOrders, ...offlineOrders];
      const products = productsData.data || [];
      const users = usersData.buyers || [];
      const expensesList = expensesData.expenses || [];

      // Financial Calculation Inline Logic
      let onlineSales = 0;
      let onlineRentals = 0;
      onlineOrders.forEach((order: any) => {
        if (order.paymentVerified !== true) return;
        const items = order.items || [];
        if (items.length === 0) {
          onlineSales += order.total || order.amount || 0;
        } else {
          items.forEach((item: any) => {
            const itemRevenue = (item.price || 0) * (item.quantity || 1);
            if (item.mode === 'rent' || item.rentalDays) {
              onlineRentals += itemRevenue;
            } else {
              onlineSales += itemRevenue;
            }
          });
        }
      });

      let offlineSales = 0;
      let offlineRentals = 0;
      offlineOrders.forEach((order: any) => {
        const items = order.items || [];
        if (items.length === 0) {
          offlineSales += order.total || order.amount || 0;
        } else {
          items.forEach((item: any) => {
            const itemRevenue = (item.price || 0) * (item.quantity || 1);
            if (item.mode === 'rent' || item.rentalDays) {
              offlineRentals += itemRevenue;
            } else {
              offlineSales += itemRevenue;
            }
          });
        }
      });

      const expenses = expensesList.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
      const inputVAT = expensesList.reduce((sum: number, exp: any) => sum + (exp.vatAmount || 0), 0);
      const outputVAT = (onlineSales + onlineRentals + offlineSales + offlineRentals) * 0.075;
      const vatPayable = Math.max(0, outputVAT - inputVAT);

      const totalOrdersCount = ordersData.total || onlineOrders.length;
      const totalOfflineOrdersCount = offlineOrdersData.pagination?.total || offlineOrders.length;
      const totalProductsCount = productsData.pagination?.total || products.length;
      const totalUsersCount = usersData.total || users.length;

      const onlineCount = onlineOrders.length;
      const offlineCount = offlineOrders.length;
      const completedOrders = allOrders.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length;
      const pendingOrders = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;

      const onlineCustomerEmails = new Set(onlineOrders.map((o: any) => o.email).filter(Boolean));
      const offlineCustomerEmails = new Set(offlineOrders.map((o: any) => o.email).filter(Boolean));
      const totalCustomerEmails = new Set([...onlineCustomerEmails, ...offlineCustomerEmails]);

      const totalRevenue = onlineSales + onlineRentals + offlineSales + offlineRentals;
      const grossProfit = totalRevenue - expenses;
      const netProfit = grossProfit - vatPayable;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
      const averageOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
      const completionRate = allOrders.length > 0 ? (completedOrders / allOrders.length) * 100 : 0;

      // Calculate Top Products/Costumes
      const productSalesMap = new Map<string, { name: string; imageUrl?: string; unitsSold: number; revenue: number }>();
      allOrders.forEach((o: any) => {
        (o.items || []).forEach((item: any) => {
          const name = item.name || item.title || 'Costume Item';
          const price = item.price || 0;
          const qty = item.quantity || 1;
          const imageUrl = item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : undefined);

          if (!productSalesMap.has(name)) {
            productSalesMap.set(name, {
              name,
              imageUrl,
              unitsSold: 0,
              revenue: 0,
            });
          }
          const current = productSalesMap.get(name)!;
          current.unitsSold += qty;
          current.revenue += price * qty;
          if (!current.imageUrl && imageUrl) current.imageUrl = imageUrl;
        });
      });

      const topProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6);

      // Build Store Activity Stream
      const recentActivities: StoreActivity[] = [];

      allOrders.slice(0, 8).forEach((o: any) => {
        const customerName = `${o.firstName || ''} ${o.lastName || ''}`.trim() || o.fullName || o.email || 'Guest Customer';
        const orderNum = o.orderNumber || (o._id ? `#${o._id.slice(-6)}` : '#ORDER');
        const isOffline = o.isOffline;

        let badge = 'PENDING';
        let badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
        if (o.status === 'completed' || o.status === 'delivered') {
          badge = 'COMPLETED';
          badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        } else if (o.status === 'approved' || o.paymentVerified) {
          badge = 'VERIFIED';
          badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
        }

        recentActivities.push({
          id: `ord-${o._id || Math.random()}`,
          type: isOffline ? 'offline' : 'order',
          title: `${isOffline ? 'Offline Sale' : 'Online Order'} ${orderNum}`,
          subtitle: `${customerName} • ₦${Number(o.total || 0).toLocaleString()}`,
          timestamp: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
          badge,
          badgeColor,
        });
      });

      users.slice(0, 4).forEach((u: any) => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email;
        recentActivities.push({
          id: `usr-${u._id || Math.random()}`,
          type: 'user',
          title: `New Customer Account`,
          subtitle: `${name} (${u.email || ''})`,
          timestamp: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
          badge: 'USER',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        });
      });

      const calculatedAnalytics: Analytics = {
        summary: {
          totalRevenue,
          totalSalesRevenue: onlineSales + offlineSales,
          totalRentalRevenue: onlineRentals + offlineRentals,
          totalOrders: totalOrdersCount + totalOfflineOrdersCount,
          completedOrders,
          pendingOrders,
          totalProducts: totalProductsCount,
          totalCustomers: totalCustomerEmails.size,
          registeredCustomers: totalUsersCount,
          guestCustomers: Math.max(0, totalCustomerEmails.size - totalUsersCount),
          averageOrderValue,
          completionRate,
        },
        cautionFeeMetrics: {
          totalCollected: 0,
          totalRefunded: 0,
          totalPartiallyRefunded: 0,
          totalForfeited: 0,
          pendingReturn: 0,
          refundRate: 0,
          averageRefundDays: 0,
        },
        expenseMetrics: {
          count: expensesList.length,
          totalAmount: expenses,
          totalVAT: inputVAT,
        },
        vatMetrics: {
          totalVAT: outputVAT,
          inputVAT,
          outputVAT,
          vatPayable,
          vatExempt: 0,
        },
        revenueBreakdown: {
          onlineSalesRevenue: onlineSales,
          onlineRentalRevenue: onlineRentals,
        },
        offlineRevenueBreakdown: {
          salesRevenue: offlineSales,
          rentalRevenue: offlineRentals,
        },
        orderTypeBreakdown: {
          online: onlineCount,
          offline: offlineCount,
        },
        dailyMetrics: calculateDailyMetrics(allOrders),
        topProducts,
        recentActivities,
        customerMetrics: {
          newCustomersThisMonth: users.filter((u: any) => {
            if (!u.createdAt) return false;
            const userDate = new Date(u.createdAt);
            const now = new Date();
            return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
          }).length,
          returningCustomers: totalCustomerEmails.size > 0 ? totalCustomerEmails.size - users.filter((u: any) => {
            if (!u.createdAt) return false;
            const userDate = new Date(u.createdAt);
            const now = new Date();
            return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
          }).length : 0,
          customerRetentionRate: totalCustomerEmails.size > 0 ? ((totalCustomerEmails.size - users.filter((u: any) => {
            if (!u.createdAt) return false;
            const userDate = new Date(u.createdAt);
            const now = new Date();
            return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
          }).length) / totalCustomerEmails.size) * 100 : 0,
        },
      };

      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
      setAnalytics(calculatedAnalytics);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(false), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && initialLoadRef.current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
        </div>
        <p className="text-gray-600 font-medium">Loading store analytics & real-time metrics...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center max-w-md bg-white rounded-2xl p-8 border border-red-100 shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-50 text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Failed to load Dashboard</h3>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => fetchAnalytics(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md hover:shadow-blue-200 flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const {
    summary,
    dailyMetrics,
    topProducts,
    recentActivities,
    customerMetrics,
    expenseMetrics,
    vatMetrics,
    revenueBreakdown,
    offlineRevenueBreakdown,
    orderTypeBreakdown
  } = analytics;

  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalExpenses = expenseMetrics?.totalAmount ?? 0;
  const vatPayable = vatMetrics?.vatPayable ?? 0;
  const grossProfit = totalRevenue - totalExpenses;
  const netProfit = grossProfit - vatPayable;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  const totalSalesRevenue = summary?.totalSalesRevenue ?? 0;
  const totalRentalRevenue = summary?.totalRentalRevenue ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const completedOrders = summary?.completedOrders ?? 0;
  const pendingOrders = summary?.pendingOrders ?? 0;
  const totalProducts = summary?.totalProducts ?? 0;
  const totalCustomers = summary?.totalCustomers ?? 0;
  const registeredCustomers = summary?.registeredCustomers ?? 0;
  const guestCustomers = summary?.guestCustomers ?? 0;

  const onlineSalesRevenue = revenueBreakdown?.onlineSalesRevenue ?? 0;
  const onlineRentalRevenue = revenueBreakdown?.onlineRentalRevenue ?? 0;
  const offlineSalesRevenue = offlineRevenueBreakdown?.salesRevenue ?? 0;
  const offlineRentalRevenue = offlineRevenueBreakdown?.rentalRevenue ?? 0;

  return (
    <div className="space-y-8 pb-10">
      {/* 🟢 TOP CONTROL BAR */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Store Overview & Analytics</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500">
            Real-time business performance, inventory sales, costume rentals, and customer updates.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right text-xs text-gray-400 hidden sm:block">
            <span>Last updated</span>
            <p className="font-semibold text-gray-600">{lastSyncTime}</p>
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition active:scale-95 disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 💎 4 PRIMARY FINANCIAL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg shadow-indigo-100 group transition hover:-translate-y-1">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition duration-500"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">Total Revenue</span>
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mb-2">₦{totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-xs text-indigo-100 font-medium">
            <span className="bg-white/20 px-2 py-0.5 rounded-md">Sales: ₦{(totalSalesRevenue).toLocaleString()}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md">Rentals: ₦{(totalRentalRevenue).toLocaleString()}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="relative overflow-hidden bg-linear-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-lg shadow-emerald-100 group transition hover:-translate-y-1">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition duration-500"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Net Profit</span>
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mb-2">₦{netProfit.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-xs text-emerald-100 font-medium">
            <span className="bg-emerald-400/30 text-white px-2.5 py-0.5 rounded-md font-bold">
              {profitMargin.toFixed(1)}% Margin
            </span>
            <span>After expenses & VAT</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-6 shadow-sm group transition hover:-translate-y-1 hover:border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Expenses</span>
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mb-2">₦{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            {expenseMetrics?.count ?? 0} recorded store operating expenses
          </p>
        </div>

        {/* VAT Payable */}
        <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-6 shadow-sm group transition hover:-translate-y-1 hover:border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">VAT Payable</span>
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mb-2">₦{vatPayable.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            Net Tax (Output: ₦{vatMetrics?.outputVAT?.toLocaleString() || 0})
          </p>
        </div>
      </div>

      {/* 🚀 QUICK ACCESS DASHBOARD SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a
          href="/admin/dashboard?tab=pending"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition group"
        >
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Orders Hub</p>
            <p className="text-[11px] text-gray-500">{totalOrders} total ({pendingOrders} pending)</p>
          </div>
        </a>

        <a
          href="/admin/dashboard?tab=products"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition group"
        >
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Costume Catalog</p>
            <p className="text-[11px] text-gray-500">{totalProducts} active products</p>
          </div>
        </a>

        <a
          href="/admin/dashboard?tab=users"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md hover:border-purple-200 transition group"
        >
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Customer Base</p>
            <p className="text-[11px] text-gray-500">{registeredCustomers} registered users</p>
          </div>
        </a>

        <a
          href="/invoices"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200 transition group"
        >
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Financial Invoices</p>
            <p className="text-[11px] text-gray-500">VAT & payment receipts</p>
          </div>
        </a>
      </div>

      {/* 📊 REVENUE BREAKDOWN & STORE METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Revenue breakdown & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Source Cards */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Revenue Channel Distribution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <span className="text-xs font-semibold text-blue-700">Online Sales</span>
                <p className="text-lg font-bold text-blue-950 mt-1">₦{onlineSalesRevenue.toLocaleString()}</p>
                <span className="text-[11px] text-blue-600">{orderTypeBreakdown?.online || 0} web orders</span>
              </div>
              <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-100">
                <span className="text-xs font-semibold text-teal-700">Online Rentals</span>
                <p className="text-lg font-bold text-teal-950 mt-1">₦{onlineRentalRevenue.toLocaleString()}</p>
                <span className="text-[11px] text-teal-600">Web costume rentals</span>
              </div>
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                <span className="text-xs font-semibold text-amber-700">Offline Sales</span>
                <p className="text-lg font-bold text-amber-950 mt-1">₦{offlineSalesRevenue.toLocaleString()}</p>
                <span className="text-[11px] text-amber-600">{orderTypeBreakdown?.offline || 0} walk-in/POS</span>
              </div>
              <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-100">
                <span className="text-xs font-semibold text-orange-700">Offline Rentals</span>
                <p className="text-lg font-bold text-orange-950 mt-1">₦{offlineRentalRevenue.toLocaleString()}</p>
                <span className="text-[11px] text-orange-600">In-store rentals</span>
              </div>
            </div>
          </div>

          {/* Main Revenue Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <SalesRentalsChart
              data={dailyMetrics.map((m) => ({
                name: m.date,
                sales: m.salesRevenue,
                rentals: m.rentalRevenue,
                total: m.totalRevenue,
              }))}
              title="Daily Sales vs Rental Revenue (30 Days)"
            />
          </div>

          {/* Cumulative & Trend Charts */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <RevenueTrendChart
                data={dailyMetrics.map((m) => ({
                  name: m.date,
                  sales: m.salesRevenue,
                  rentals: m.rentalRevenue,
                  total: m.totalRevenue,
                }))}
                title="Revenue Trend & Dynamics"
              />
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <OrdersCountChart
                data={dailyMetrics.map((m) => ({
                  name: m.date,
                  sales: m.salesOrdersCount,
                  rentals: m.rentalOrdersCount,
                  total: m.ordersCount,
                }))}
                title="Daily Volume of Costume Orders & Rentals"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Activity & Top Costumes */}
        <div className="space-y-8">
          {/* ⚡ REAL-TIME STORE ACTIVITY FEED */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="font-bold text-gray-900 text-base">Live Activity Feed</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">Real-time stream</span>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No recent activities recorded</p>
              ) : (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70 hover:bg-gray-100/80 transition border border-gray-100/80"
                  >
                    <div className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 shrink-0 mt-0.5">
                      {act.type === 'user' ? (
                        <UserPlus className="w-4 h-4 text-blue-600" />
                      ) : act.type === 'offline' ? (
                        <Receipt className="w-4 h-4 text-amber-600" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-bold text-gray-900 truncate">{act.title}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${act.badgeColor}`}>
                          {act.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{act.subtitle}</p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {act.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 👑 TOP PERFORMING PRODUCTS LEADERBOARD */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900 text-base">Top Performing Costumes</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">By Revenue</span>
            </div>

            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No sales data available yet</p>
              ) : (
                topProducts.map((prod, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-200">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{prod.name}</p>
                      <p className="text-[11px] text-gray-500">{prod.unitsSold} unit(s) ordered</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-emerald-700">₦{prod.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 👥 CUSTOMER OVERVIEW CARD */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Customer Demographics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-xs font-semibold text-purple-900">Total Buyers</span>
                <span className="text-sm font-extrabold text-purple-950">{totalCustomers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-xs font-semibold text-blue-900">Registered Accounts</span>
                <span className="text-sm font-extrabold text-blue-950">{registeredCustomers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">Guest Checkout</span>
                <span className="text-sm font-extrabold text-gray-900">{guestCustomers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedDashboard;
