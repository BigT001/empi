'use client';

import { useEffect, useState, useRef } from 'react';
import {
  SalesRentalsChart,
  RevenueTrendChart,
  CumulativeRevenueChart,
  OrdersCountChart,
} from './DashboardCharts';
import { getTotalOnlineSales, getTotalOnlineRentals, getTotalOfflineSales, getTotalOfflineRentals, getTotalDailyExpenses } from '@/lib/utils/financeCalculations';
import { getTotalOnlineVAT, getTotalOfflineVAT, getTotalInputVAT } from '@/lib/utils/vatCalculations.client';

interface DailyMetrics {
  date: string;
  salesRevenue: number;
  rentalRevenue: number;
  totalRevenue: number;
  ordersCount: number;
  rentalOrdersCount: number;
  salesOrdersCount: number;
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
  topProducts: Array<{ name: string; unitsSold: number; revenue: number }>;
  customerMetrics: {
    newCustomersThisMonth: number;
    returningCustomers: number;
    customerRetentionRate: number;
  };
}

interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}

// Function to calculate daily metrics from orders
function calculateDailyMetrics(orders: any[]): DailyMetrics[] {
  const dailyMetricsMap = new Map<string, DailyMetrics>();

  orders.forEach((order: any) => {
    // Get order date
    const orderDate = order.createdAt || order.created_at || new Date();
    const dateObj = new Date(orderDate);
    const dateStr = dateObj.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Initialize daily metric if not exists
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
    
    // Calculate revenue by item mode
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
        // If no mode specified, check if order has rentalDays to determine type
        if (item.rentalDays) {
          orderRentalRevenue += itemRevenue;
          hasRental = true;
        } else {
          orderSalesRevenue += itemRevenue;
          hasSales = true;
        }
      }
    });

    // If no items or empty items, use order.total
    if (items.length === 0 && order.total) {
      orderSalesRevenue = order.total;
      hasSales = true;
    }

    dailyMetric.salesRevenue += orderSalesRevenue;
    dailyMetric.rentalRevenue += orderRentalRevenue;
    dailyMetric.totalRevenue += orderSalesRevenue + orderRentalRevenue;
    dailyMetric.ordersCount += 1;

    if (hasRental) {
      dailyMetric.rentalOrdersCount += 1;
    }
    if (hasSales) {
      dailyMetric.salesOrdersCount += 1;
    }
  });

  // Convert map to sorted array (by date, newest first)
  return Array.from(dailyMetricsMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function EnhancedDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all financial data using the same utilities as Finance Dashboard
        const [onlineSales, onlineRentals, offlineSales, offlineRentals, expenses, onlineVAT, offlineVAT, inputVAT] = await Promise.all([
          getTotalOnlineSales(),
          getTotalOnlineRentals(),
          getTotalOfflineSales(),
          getTotalOfflineRentals(),
          getTotalDailyExpenses(),
          getTotalOnlineVAT(),
          getTotalOfflineVAT(),
          getTotalInputVAT()
        ]);

        const outputVAT = onlineVAT + offlineVAT;
        const vatPayable = Math.max(outputVAT - inputVAT, 0);

        // Fetch transaction counts and customer data with cache-busting
        const ordersRes = await fetch("/api/orders/unified?t=" + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        const offlineOrdersRes = await fetch("/api/admin/offline-orders?t=" + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        const productsRes = await fetch("/api/products?t=" + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        const usersRes = await fetch("/api/admin/users?t=" + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        
        const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
        const offlineOrdersData = offlineOrdersRes.ok ? await offlineOrdersRes.json() : { data: [] };
        const productsData = productsRes.ok ? await productsRes.json() : { data: [] };
        const usersData = usersRes.ok ? await usersRes.json() : { users: [] };

        const onlineOrders = ordersData.orders?.filter((o: any) => !o.isOffline) || [];
        const offlineOrders = offlineOrdersData.data || [];
        const allOrders = [...onlineOrders, ...offlineOrders];
        const products = productsData.data || [];
        const users = usersData.users || [];

        const onlineCount = onlineOrders.length;
        const offlineCount = offlineOrders.length;
        const completedOrders = allOrders.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length;
        const pendingOrders = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;

        // Count unique customers
        const onlineCustomerEmails = new Set(onlineOrders.map((o: any) => o.email).filter(Boolean));
        const offlineCustomerEmails = new Set(offlineOrders.map((o: any) => o.email).filter(Boolean));
        const totalCustomerEmails = new Set([...onlineCustomerEmails, ...offlineCustomerEmails]);

        const totalRevenue = onlineSales + onlineRentals + offlineSales + offlineRentals;
        const grossProfit = totalRevenue - expenses;
        const netProfit = grossProfit - vatPayable;
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
        const averageOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
        const completionRate = allOrders.length > 0 ? (completedOrders / allOrders.length) * 100 : 0;

        const calculatedAnalytics: Analytics = {
          summary: {
            totalRevenue,
            totalSalesRevenue: onlineSales + offlineSales,
            totalRentalRevenue: onlineRentals + offlineRentals,
            totalOrders: allOrders.length,
            completedOrders,
            pendingOrders,
            totalProducts: products.length,
            totalCustomers: totalCustomerEmails.size,
            registeredCustomers: users.filter((u: any) => !u.isGuest).length,
            guestCustomers: users.filter((u: any) => u.isGuest).length,
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
            count: 0,
            totalAmount: expenses,
            totalVAT: 0,
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
          topProducts: [],
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

        // Always update state immediately - React handles re-render optimization
        if (initialLoadRef.current) {
          setLoading(false);
          initialLoadRef.current = false;
        }
        setAnalytics(calculatedAnalytics);
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    // Initial fetch
    fetchAnalytics();

    // Refresh every 3 seconds for real-time updates
    const interval = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100">
            <svg
              className="w-8 h-8 text-blue-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { summary, dailyMetrics, topProducts, customerMetrics, expenseMetrics, vatMetrics, revenueBreakdown, offlineRevenueBreakdown, orderTypeBreakdown } = analytics;

  // Ensure summary exists before using it
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-yellow-100">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">Analytics data is loading...</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Calculate derived metrics - use cleaned Finance Dashboard calculations
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalExpenses = expenseMetrics?.totalAmount ?? 0;
  const vatPayable = vatMetrics?.vatPayable ?? 0;
  const grossProfit = totalRevenue - totalExpenses;
  const netProfit = grossProfit - vatPayable;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  // Safe summary metrics
  const totalSalesRevenue = summary?.totalSalesRevenue ?? 0;
  const totalRentalRevenue = summary?.totalRentalRevenue ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const completedOrders = summary?.completedOrders ?? 0;
  const pendingOrders = summary?.pendingOrders ?? 0;
  const totalProducts = summary?.totalProducts ?? 0;
  const totalCustomers = summary?.totalCustomers ?? 0;
  const registeredCustomers = summary?.registeredCustomers ?? 0;
  const guestCustomers = summary?.guestCustomers ?? 0;
  const averageOrderValue = summary?.averageOrderValue ?? 0;
  const completionRate = summary?.completionRate ?? 0;

  // Online/Offline breakdown - use actual values from Finance calculations
  const onlineSalesRevenue = revenueBreakdown?.onlineSalesRevenue ?? 0;
  const onlineRentalRevenue = revenueBreakdown?.onlineRentalRevenue ?? 0;
  const offlineSalesRevenue = offlineRevenueBreakdown?.salesRevenue ?? 0;
  const offlineRentalRevenue = offlineRevenueBreakdown?.rentalRevenue ?? 0;
  const onlineTransactions = orderTypeBreakdown?.online ?? 0;
  const offlineTransactions = orderTypeBreakdown?.offline ?? 0;

  // PRIMARY FINANCIAL METRICS - REDESIGNED (Only 4 most important cards)
  const primaryCards: StatCard[] = [
    {
      label: 'Total Revenue',
      value: `₦${(totalRevenue ?? 0).toLocaleString()}`,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Net Profit',
      value: `₦${(netProfit ?? 0).toLocaleString()}`,
      subtext: `${(profitMargin ?? 0).toFixed(1)}% margin`,
      color: 'bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Total Expenses',
      value: `₦${(totalExpenses ?? 0).toLocaleString()}`,
      color: 'bg-orange-50 border-orange-200',
    },
    {
      label: 'VAT Payable',
      value: `₦${(vatPayable ?? 0).toLocaleString()}`,
      color: 'bg-purple-50 border-purple-200',
    },
  ];

  // REVENUE BREAKDOWN - Secondary importance
  const revenueCards: StatCard[] = [
    {
      label: 'Online Sales',
      value: `₦${(onlineSalesRevenue ?? 0).toLocaleString()}`,
      subtext: `${onlineTransactions} transactions`,
      color: 'bg-green-50 border-green-200',
    },
    {
      label: 'Online Rentals',
      value: `₦${(onlineRentalRevenue ?? 0).toLocaleString()}`,
      color: 'bg-teal-50 border-teal-200',
    },
    {
      label: 'Offline Sales',
      value: `₦${(offlineSalesRevenue ?? 0).toLocaleString()}`,
      subtext: `${offlineTransactions} transactions`,
      color: 'bg-yellow-50 border-yellow-200',
    },
    {
      label: 'Offline Rentals',
      value: `₦${(offlineRentalRevenue ?? 0).toLocaleString()}`,
      color: 'bg-amber-50 border-amber-200',
    },
  ];

  // SECONDARY METRICS (Compact cards for supporting data)
  const secondaryCards: StatCard[] = [
    {
      label: 'Total Orders',
      value: totalOrders,
      subtext: `${completedOrders} completed`,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Total Products',
      value: totalProducts,
      subtext: `In catalog`,
      color: 'bg-pink-50 border-pink-200',
    },
    {
      label: 'Total Customers',
      value: totalCustomers,
      subtext: `${registeredCustomers} registered`,
      color: 'bg-cyan-50 border-cyan-200',
    },
    {
      label: 'New Customers',
      value: customerMetrics?.newCustomersThisMonth ?? 0,
      subtext: 'This month',
      color: 'bg-sky-50 border-sky-200',
    },
  ];


  const statColorMap: { [key: string]: string } = {
    'bg-blue-50': 'text-blue-900',
    'bg-green-50': 'text-green-900',
    'bg-amber-50': 'text-amber-900',
    'bg-purple-50': 'text-purple-900',
    'bg-pink-50': 'text-pink-900',
    'bg-teal-50': 'text-teal-900',
    'bg-indigo-50': 'text-indigo-900',
    'bg-cyan-50': 'text-cyan-900',
    'bg-red-50': 'text-red-900',
    'bg-yellow-50': 'text-yellow-900',
    'bg-orange-50': 'text-orange-900',
    'bg-emerald-50': 'text-emerald-900',
  };

  const borderColorMap: { [key: string]: string } = {
    'border-blue-200': 'border-blue-200',
    'border-green-200': 'border-green-200',
    'border-amber-200': 'border-amber-200',
    'border-purple-200': 'border-purple-200',
    'border-pink-200': 'border-pink-200',
    'border-teal-200': 'border-teal-200',
    'border-indigo-200': 'border-indigo-200',
    'border-cyan-200': 'border-cyan-200',
    'border-red-200': 'border-red-200',
    'border-yellow-200': 'border-yellow-200',
    'border-orange-200': 'border-orange-200',
    'border-emerald-200': 'border-emerald-200',
  };

  return (
    <div className="bg-linear-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Dashboard Analytics
        </h1>
        <p className="text-gray-600">Real-time business metrics and performance data</p>
      </div>

      {/* PRIMARY FINANCIAL METRICS - Large prominent cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Financial Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {primaryCards.map((card, index) => {
            const bgClass = card.color.split(' ')[0];
            const borderClass = card.color.split(' ')[1];
            const textColor = statColorMap[bgClass] || 'text-gray-900';
            const borderColor = borderColorMap[borderClass] || 'border-gray-200';

            return (
              <div
                key={index}
                className={`${bgClass} ${borderColor} border-2 rounded-xl p-6 shadow-sm hover:shadow-lg transition duration-200`}
              >
                <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{card.label}</p>
                <p className={`text-3xl font-bold ${textColor} mb-1`}>
                  {card.value}
                </p>
                {card.subtext && (
                  <p className="text-xs text-gray-500 mt-2">{card.subtext}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* REVENUE BREAKDOWN - Secondary section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueCards.map((card, index) => {
            const bgClass = card.color.split(' ')[0];
            const borderClass = card.color.split(' ')[1];
            const textColor = statColorMap[bgClass] || 'text-gray-900';
            const borderColor = borderColorMap[borderClass] || 'border-gray-200';

            return (
              <div
                key={index}
                className={`${bgClass} ${borderColor} border rounded-lg p-5 shadow-sm hover:shadow-md transition`}
              >
                <p className="text-sm font-medium text-gray-600 mb-2">{card.label}</p>
                <p className={`text-2xl font-bold ${textColor}`}>
                  {card.value}
                </p>
                {card.subtext && (
                  <p className="text-xs text-gray-500 mt-2">{card.subtext}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECONDARY METRICS Grid - Compact & Minimal */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Business Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {secondaryCards.map((card, index) => {
            const bgClass = card.color.split(' ')[0];
            const borderClass = card.color.split(' ')[1];
            const textColor = statColorMap[bgClass] || 'text-gray-900';
            const borderColor = borderColorMap[borderClass] || 'border-gray-200';

            return (
              <div
                key={index}
                className={`${bgClass} ${borderColor} border rounded-md p-3 shadow-xs hover:shadow-sm transition`}
              >
                <p className="text-xs font-semibold text-gray-600 mb-1 truncate">{card.label}</p>
                <p className={`text-lg md:text-xl font-bold ${textColor}`}>
                  {card.value}
                </p>
                {card.subtext && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{card.subtext}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SalesRentalsChart
          data={dailyMetrics.map((m) => ({
            name: m.date,
            sales: m.salesRevenue,
            rentals: m.rentalRevenue,
            total: m.totalRevenue,
          }))}
          title="Sales vs Rental Revenue"
        />
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h3>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">
                ₦{(totalSalesRevenue ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mb-4">Sales</p>
              <p className="text-4xl font-bold text-amber-600 mb-2">
                ₦{(totalRentalRevenue ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Rentals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <RevenueTrendChart
          data={dailyMetrics.map((m) => ({
            name: m.date,
            sales: m.salesRevenue,
            rentals: m.rentalRevenue,
            total: m.totalRevenue,
          }))}
          title="Revenue Trend (30 Days)"
        />
        <CumulativeRevenueChart
          data={dailyMetrics.map((m) => ({
            name: m.date,
            sales: m.salesRevenue,
            rentals: m.rentalRevenue,
            total: m.totalRevenue,
          }))}
          title="Cumulative Revenue Growth"
        />
      </div>

      {/* Order Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <OrdersCountChart
          data={dailyMetrics.map((m) => ({
            name: m.date,
            sales: m.salesOrdersCount,
            rentals: m.rentalOrdersCount,
            total: m.ordersCount,
          }))}
          title="Order Count Comparison"
        />
      </div>

      {/* Customer Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">New Customers</p>
            <p className="text-3xl font-bold text-blue-900">
              {customerMetrics.newCustomersThisMonth}
            </p>
            <p className="text-xs text-blue-600 mt-2">This month</p>
          </div>
          <div className="bg-linear-to-br from-green-50 to-green-100 p-6 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">Returning Customers</p>
            <p className="text-3xl font-bold text-green-900">
              {customerMetrics.returningCustomers}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {customerMetrics.customerRetentionRate.toFixed(1)}% retention
            </p>
          </div>
          <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-2">Guest Customers</p>
            <p className="text-3xl font-bold text-purple-900">
              {guestCustomers}
            </p>
            <p className="text-xs text-purple-600 mt-2">
              {totalCustomers > 0
                ? ((guestCustomers / totalCustomers) * 100).toFixed(1)
                : 0}% of total
            </p>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Product Name
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Units Sold
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-900">{product.name}</td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">
                      {product.unitsSold}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">
                      ₦{product.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
