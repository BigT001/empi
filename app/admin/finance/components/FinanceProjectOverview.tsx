'use client';

import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Truck, Calendar, AlertCircle } from 'lucide-react';
import { getTotalOnlineSales, getTotalOnlineRentals, getTotalOfflineSales, getTotalOfflineRentals, getTotalDailyExpenses } from '@/lib/utils/financeCalculations';
import { getTotalOnlineVAT, getTotalOfflineVAT, getTotalInputVAT } from '@/lib/utils/vatCalculations.client';

interface FinanceMetrics {
  // Online Revenue
  onlineSalesRevenue: number;
  onlineRentalRevenue: number;

  // Offline Revenue
  offlineSalesRevenue: number;
  offlineRentalRevenue: number;

  // Caution Fees
  cautionFeeCollected: number;
  cautionFeeRefunded: number;

  // VAT
  totalVAT: number;
  inputVAT: number;
  outputVAT: number;
  vatPayable: number;
  vatExempt: number;

  // Daily Expenses
  totalDailyExpenses: number;
  expenseCount: number;

  // Transactions
  totalOnlineTransactions: number;
  totalOfflineTransactions: number;

  // Customers
  totalOnlineCustomers: number;
  totalOfflineCustomers: number;

  // Dates
  generatedAt: string;
}

interface FinanceOverviewProps {
  data?: FinanceMetrics;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return `₦${Math.round(value).toLocaleString()}`;
}

function calculateMetrics(data: FinanceMetrics) {
  const onlineRevenue = data.onlineSalesRevenue + data.onlineRentalRevenue;
  const offlineRevenue = data.offlineSalesRevenue + data.offlineRentalRevenue;
  const totalRevenue = onlineRevenue + offlineRevenue;
  const totalExpenses = data.totalDailyExpenses;
  const grossProfit = totalRevenue - totalExpenses;
  const netProfit = grossProfit - data.vatPayable;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  return {
    onlineRevenue,
    offlineRevenue,
    totalRevenue,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMargin,
  };
}

export function FinanceProjectOverview({ data, loading }: FinanceOverviewProps) {
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(!data && loading !== false);
  const initialLoadRef = useRef(true);

  const fetchMetrics = async () => {
    try {
      // Use utility functions to fetch pre-calculated values from transaction history
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
      const vatPayable = outputVAT - inputVAT;

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
      const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
      const offlineOrdersData = offlineOrdersRes.ok ? await offlineOrdersRes.json() : { data: [] };

      const onlineOrders = ordersData.orders?.filter((o: any) => !o.isOffline) || [];
      const offlineOrders = offlineOrdersData.data || [];

      const onlineCount = onlineOrders.length;
      const offlineCount = offlineOrders.length;

      // Count unique customers
      const onlineCustomerEmails = new Set(onlineOrders.map((o: any) => o.email).filter(Boolean));
      const offlineCustomerEmails = new Set(offlineOrders.map((o: any) => o.email).filter(Boolean));

      const calculated: FinanceMetrics = {
        onlineSalesRevenue: onlineSales,
        onlineRentalRevenue: onlineRentals,
        offlineSalesRevenue: offlineSales,
        offlineRentalRevenue: offlineRentals,
        cautionFeeCollected: 0,
        cautionFeeRefunded: 0,
        totalVAT: outputVAT,
        inputVAT,
        outputVAT,
        vatPayable: Math.max(vatPayable, 0),
        vatExempt: 0,
        totalDailyExpenses: expenses,
        expenseCount: 0,
        totalOnlineTransactions: onlineCount,
        totalOfflineTransactions: offlineCount,
        totalOnlineCustomers: onlineCustomerEmails.size,
        totalOfflineCustomers: offlineCustomerEmails.size,
        generatedAt: new Date().toLocaleString(),
      };

      // Always update state immediately - React handles re-render optimization
      setMetrics(calculated);
      setError(null);
      // Only hide loading on initial load
      if (initialLoadRef.current) {
        setIsInitialLoading(false);
        initialLoadRef.current = false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
    }
  };

  useEffect(() => {
    if (data) {
      setMetrics(data);
      setIsInitialLoading(false);
      initialLoadRef.current = false;
    } else {
      fetchMetrics();
      
      // Auto-refresh every 3 seconds when not provided external data
      const interval = setInterval(fetchMetrics, 3000);
      return () => clearInterval(interval);
    }
  }, [data]);

  if (isInitialLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">Error Loading Financial Data</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const calc = calculateMetrics(metrics);

  return (
    <div className="space-y-6">
      {/* Main Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-emerald-900">Total Revenue</h3>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-900 mb-4">{formatCurrency(calc.totalRevenue)}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-emerald-700">Online Sales</span>
              <span className="font-semibold text-emerald-900">{formatCurrency(metrics.onlineSalesRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Online Rentals</span>
              <span className="font-semibold text-emerald-900">{formatCurrency(metrics.onlineRentalRevenue)}</span>
            </div>
            <div className="flex justify-between border-t border-emerald-200 pt-2 mt-2">
              <span className="text-emerald-700">Offline Sales</span>
              <span className="font-semibold text-emerald-900">{formatCurrency(metrics.offlineSalesRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Offline Rentals</span>
              <span className="font-semibold text-emerald-900">{formatCurrency(metrics.offlineRentalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className={`bg-gradient-to-br ${calc.netProfit >= 0 ? 'from-blue-50 to-cyan-50 border-blue-200' : 'from-red-50 to-pink-50 border-red-200'} border-2 rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Net Profit</h3>
            <div className={`${calc.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'} p-2 rounded-lg`}>
              {calc.netProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-blue-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
          <p className={`text-3xl font-bold mb-4 ${calc.netProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
            {formatCurrency(calc.netProfit)}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Online Revenue</span>
              <span className="font-semibold text-gray-900">{formatCurrency(metrics.onlineSalesRevenue + metrics.onlineRentalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Offline Revenue</span>
              <span className="font-semibold text-gray-900">{formatCurrency(metrics.offlineSalesRevenue + metrics.offlineRentalRevenue)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-600">Total Expenses</span>
              <span className="font-semibold text-gray-900">{formatCurrency(calc.totalExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">VAT Payable</span>
              <span className="font-semibold text-gray-900">{formatCurrency(metrics.vatPayable)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-600">Profit Margin</span>
              <span className="font-semibold text-gray-900">{calc.profitMargin}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Daily Expenses */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">Daily Expenses</p>
            <div className="bg-orange-100 p-1.5 rounded">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalDailyExpenses)}</p>
          <p className="text-xs text-gray-500 mt-2">{metrics.expenseCount} expenses recorded</p>
        </div>

        {/* VAT Due */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">VAT Due</p>
            <div className="bg-red-100 p-1.5 rounded">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.vatPayable)}</p>
          <p className="text-xs text-gray-500 mt-2">Output - Input VAT</p>
        </div>

        {/* Caution Fees */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">Caution Fees</p>
            <div className="bg-indigo-100 p-1.5 rounded">
              <Package className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.cautionFeeCollected)}</p>
          <p className="text-xs text-gray-500 mt-2">Refunded: {formatCurrency(metrics.cautionFeeRefunded)}</p>
        </div>
      </div>

      {/* Detailed Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
        {/* Online vs Offline Comprehensive Metrics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Online vs Offline Metrics
          </h3>
          
          <div className="space-y-6">
            {/* Revenue Comparison */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Revenue Comparison</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-blue-700">Online Revenue</span>
                    <span className="text-xs font-bold text-blue-600">{formatCurrency(calc.onlineRevenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${calc.totalRevenue > 0 ? (calc.onlineRevenue / calc.totalRevenue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(calc.totalRevenue > 0 ? (calc.onlineRevenue / calc.totalRevenue) * 100 : 0).toFixed(1)}% of total
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-emerald-700">Offline Revenue</span>
                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(calc.offlineRevenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{
                        width: `${calc.totalRevenue > 0 ? (calc.offlineRevenue / calc.totalRevenue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(calc.totalRevenue > 0 ? (calc.offlineRevenue / calc.totalRevenue) * 100 : 0).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            </div>

            <hr className="my-2" />

            {/* Transaction Volume */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Transaction Volume</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-blue-700">Online Transactions</span>
                    <span className="text-xs font-bold text-blue-600">{metrics.totalOnlineTransactions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (metrics.totalOnlineTransactions + metrics.totalOfflineTransactions) > 0
                            ? (metrics.totalOnlineTransactions / (metrics.totalOnlineTransactions + metrics.totalOfflineTransactions)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(
                      (metrics.totalOnlineTransactions + metrics.totalOfflineTransactions) > 0
                        ? (metrics.totalOnlineTransactions / (metrics.totalOnlineTransactions + metrics.totalOfflineTransactions)) * 100
                        : 0
                    ).toFixed(1)}
                    % of total
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-emerald-700">Offline Transactions</span>
                    <span className="text-xs font-bold text-emerald-600">{metrics.totalOfflineTransactions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (metrics.totalOnlineTransactions + metrics.totalOfflineTransactions) > 0
                            ? (metrics.totalOfflineTransactions / (metrics.totalOnlineTransactions + metrics.totalOfflineTransactions)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(
                      (metrics.totalOnlineTransactions + metrics.totalOfflineTransactions) > 0
                        ? (metrics.totalOfflineTransactions / (metrics.totalOnlineTransactions + metrics.totalOfflineTransactions)) * 100
                        : 0
                    ).toFixed(1)}
                    % of total
                  </p>
                </div>
              </div>
            </div>

            <hr className="my-2" />

            {/* Customer Metrics */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Customer Base</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-blue-700">Online Customers</span>
                    <span className="text-xs font-bold text-blue-600">{metrics.totalOnlineCustomers || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (metrics.totalOnlineCustomers || 0) + (metrics.totalOfflineCustomers || 0) > 0
                            ? ((metrics.totalOnlineCustomers || 0) / ((metrics.totalOnlineCustomers || 0) + (metrics.totalOfflineCustomers || 0))) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(
                      (metrics.totalOnlineCustomers || 0) + (metrics.totalOfflineCustomers || 0) > 0
                        ? ((metrics.totalOnlineCustomers || 0) / ((metrics.totalOnlineCustomers || 0) + (metrics.totalOfflineCustomers || 0))) * 100
                        : 0
                    ).toFixed(1)}
                    % of total
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-emerald-700">Offline Customers</span>
                    <span className="text-xs font-bold text-emerald-600">{metrics.totalOfflineCustomers || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (metrics.totalOnlineCustomers || 0) + (metrics.totalOfflineCustomers || 0) > 0
                            ? ((metrics.totalOfflineCustomers || 0) / ((metrics.totalOnlineCustomers || 0) + (metrics.totalOfflineCustomers || 0))) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(
                      (metrics.totalOnlineCustomers || 0) + (metrics.totalOfflineCustomers || 0) > 0
                        ? ((metrics.totalOfflineCustomers || 0) / ((metrics.totalOnlineCustomers || 0) + (metrics.totalOfflineCustomers || 0))) * 100
                        : 0
                    ).toFixed(1)}
                    % of total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VAT Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-600" />
            VAT Management
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Output VAT (Charged)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(metrics.outputVAT)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Input VAT (Paid)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(metrics.inputVAT)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">VAT Exempt</span>
              <span className="font-semibold text-gray-900">{formatCurrency(metrics.vatExempt)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 bg-amber-50 px-3 py-2 rounded">
              <span className="text-sm font-semibold text-amber-900">VAT Payable</span>
              <span className="text-lg font-bold text-amber-900">{formatCurrency(metrics.vatPayable)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Metadata */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-900">Report Generated</p>
          <p>{metrics.generatedAt}</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}
