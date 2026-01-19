'use client';

import { useEffect, useState } from 'react';
import {
  SalesRentalsChart,
  RevenueTrendChart,
  CumulativeRevenueChart,
  OrdersCountChart,
} from './DashboardCharts';

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

export function EnhancedDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
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

  const { summary, dailyMetrics, topProducts, customerMetrics } = analytics;

  const statCards: StatCard[] = [
    {
      label: 'Total Revenue',
      value: `₦${summary.totalRevenue.toLocaleString()}`,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Sales Revenue',
      value: `₦${summary.totalSalesRevenue.toLocaleString()}`,
      subtext: `Sales orders made`,
      color: 'bg-green-50 border-green-200',
    },
    {
      label: 'Rental Revenue',
      value: `₦${summary.totalRentalRevenue.toLocaleString()}`,
      subtext: `Rental orders made`,
      color: 'bg-amber-50 border-amber-200',
    },
    {
      label: 'Total Orders',
      value: summary.totalOrders,
      subtext: `${summary.completedOrders} completed`,
      color: 'bg-purple-50 border-purple-200',
    },
    {
      label: 'Total Products',
      value: summary.totalProducts,
      subtext: `In catalog`,
      color: 'bg-red-50 border-red-200',
    },
    {
      label: 'Total Customers',
      value: summary.totalCustomers,
      subtext: `${summary.registeredCustomers} registered`,
      color: 'bg-pink-50 border-pink-200',
    },
    {
      label: 'Avg Order Value',
      value: `₦${summary.averageOrderValue.toLocaleString()}`,
      color: 'bg-teal-50 border-teal-200',
    },
    {
      label: 'Completion Rate',
      value: `${summary.completionRate.toFixed(1)}%`,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      label: 'New Customers',
      value: customerMetrics.newCustomersThisMonth,
      subtext: 'This month',
      color: 'bg-cyan-50 border-cyan-200',
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

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => {
          const bgClass = card.color.split(' ')[0];
          const borderClass = card.color.split(' ')[1];
          const textColor = statColorMap[bgClass] || 'text-gray-900';
          const borderColor = borderColorMap[borderClass] || 'border-gray-200';

          return (
            <div
              key={index}
              className={`${bgClass} ${borderColor} border rounded-lg p-6 shadow-sm hover:shadow-md transition`}
            >
              <p className="text-sm font-medium text-gray-600 mb-2">{card.label}</p>
              <p className={`text-2xl md:text-3xl font-bold ${textColor}`}>
                {card.value}
              </p>
              {card.subtext && (
                <p className="text-xs text-gray-500 mt-2">{card.subtext}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Caution Fee Metrics - Top Visibility */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Rental Caution Fees (Liability)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Deposits from renters - refundable when costumes return in good condition
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <p className="text-xs font-medium text-purple-900 mb-1">Collected</p>
            <p className="text-lg font-bold text-purple-900">
              ₦{analytics.cautionFeeMetrics.totalCollected.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600 mt-2">Deposits held</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">Refunded</p>
            <p className="text-lg font-bold text-blue-900">
              ₦{analytics.cautionFeeMetrics.totalRefunded.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-2">Full refunds</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-xs font-medium text-yellow-900 mb-1">Partial</p>
            <p className="text-lg font-bold text-yellow-900">
              ₦{analytics.cautionFeeMetrics.totalPartiallyRefunded.toLocaleString()}
            </p>
            <p className="text-xs text-yellow-600 mt-2">Deductions</p>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-xs font-medium text-red-900 mb-1">Forfeited</p>
            <p className="text-lg font-bold text-red-900">
              ₦{analytics.cautionFeeMetrics.totalForfeited.toLocaleString()}
            </p>
            <p className="text-xs text-red-600 mt-2">Lost items</p>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-xs font-medium text-green-900 mb-1">Refund Rate</p>
            <p className="text-lg font-bold text-green-900">
              {analytics.cautionFeeMetrics.refundRate.toFixed(1)}%
            </p>
            <p className="text-xs text-green-600 mt-2">~{analytics.cautionFeeMetrics.averageRefundDays}d</p>
          </div>
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
                ₦{summary.totalSalesRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mb-4">Sales</p>
              <p className="text-4xl font-bold text-amber-600 mb-2">
                ₦{summary.totalRentalRevenue.toLocaleString()}
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
              {summary.guestCustomers}
            </p>
            <p className="text-xs text-purple-600 mt-2">
              {summary.totalCustomers > 0
                ? ((summary.guestCustomers / summary.totalCustomers) * 100).toFixed(1)
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
