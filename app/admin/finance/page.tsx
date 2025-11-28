"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  AlertCircle,
  Calendar,
  TrendingDown,
  MoreVertical,
  ArrowUp,
  Plus,
} from "lucide-react";

// Mobile components
const MobileFinancePage = dynamic(() => import("../mobile-finance"), {
  ssr: false,
});
import MobileAdminLayout from "../mobile-layout";
import VATTab from "../vat-tab";
import OfflineOrderForm from "../offline-order-form";
import TransactionHistory from "../transaction-history";

interface FinanceMetrics {
  totalRevenue: number;
  totalIncome: number;
  totalExpenses: number;
  pendingAmount: number;
  completedAmount: number;
  annualTurnover: number;
  businessSize: 'small' | 'medium' | 'large';
  taxBreakdown: TaxBreakdown;
  monthlyTax: MonthlyTaxBreakdown;
  weeklyProjection: WeeklyData[];
  transactionBreakdown: TransactionBreakdown;
  profitMargin: number;
  averageOrderValue: number;
  conversionMetrics: ConversionMetrics;
}

interface TaxBreakdown {
  vat: VATBreakdown;
  corporateIncomeTax: number;
  educationTax: number;
  totalAnnualTax: number;
}

interface VATBreakdown {
  rate: number;
  totalSalesExVAT: number;
  outputVAT: number;
  inputVAT: number;
  vatPayable: number;
}

interface MonthlyTaxBreakdown {
  estimatedMonthlyVAT: number;
  estimatedMonthlyCIT: number;
  estimatedMonthlyEducationTax: number;
  estimatedMonthlyTotal: number;
}

interface WeeklyData {
  week: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface TransactionBreakdown {
  sales: number;
  rentals: number;
  customOrders: number;
  returns: number;
  refunds: number;
}

interface ConversionMetrics {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  cancelledTransactions: number;
  conversionRate: number;
}

export default function FinancePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vat" | "overview" | "analytics" | "transactions">("overview");
  const [showOfflineOrderForm, setShowOfflineOrderForm] = useState(false);

  // Detect mobile device
  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch finance metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/finance");
        
        if (!response.ok) throw new Error("Failed to fetch metrics");
        const financeData = await response.json();
        setMetrics(financeData.metrics);
      } catch (err) {
        console.error("Error fetching finance metrics:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (isMounted && !isMobile) {
      fetchMetrics();
    }
  }, [isMounted, isMobile]);

  // Show mobile view on small screens
  if (!isMounted) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileAdminLayout>
        <MobileFinancePage />
      </MobileAdminLayout>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-lime-600"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
            <p className="text-sm text-gray-600">
              Track your revenue, expenses, and tax calculations
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Data</h3>
                <p className="text-red-700 text-sm mt-1">
                  {error || "Failed to load financial metrics"}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
            <p className="text-sm text-gray-600">
              Track your revenue, expenses, and tax calculations
            </p>
          </div>
          <button
            onClick={() => setShowOfflineOrderForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Offline Order
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === "overview"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("vat")}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === "vat"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                VAT Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === "analytics"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === "transactions"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Transaction History
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 w-full">
        {activeTab === "vat" && <VATTab />}
        
        {activeTab === "overview" && (
          <>
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₦{metrics.totalRevenue.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.conversionMetrics.totalTransactions} total transactions
            </p>
          </div>

          {/* Completed Income */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Completed Income</p>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              ₦{metrics.totalIncome.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.conversionMetrics.completedTransactions} completed
            </p>
          </div>

          {/* Pending Amount */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              ₦{metrics.pendingAmount.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.conversionMetrics.pendingTransactions} pending
            </p>
          </div>
        </div>

        {/* Financial Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue vs Expenses */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Financial Overview
            </h2>
            <div className="space-y-6">
              {/* Total Revenue */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="font-bold text-gray-900">
                    ₦{metrics.totalRevenue.toLocaleString("en-NG")}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-lg p-4 border border-lime-200">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-900">Gross Profit</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦
                    {(metrics.totalRevenue - metrics.totalExpenses).toLocaleString(
                      "en-NG",
                      { minimumFractionDigits: 2 }
                    )}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Profit Margin: {metrics.profitMargin}%
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Key Metrics</h2>
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ₦{metrics.averageOrderValue.toLocaleString("en-NG")}
                </p>
              </div>
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-lime-600 mt-2">
                  {metrics.conversionMetrics.conversionRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {metrics.conversionMetrics.totalTransactions}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction Types */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Transaction Breakdown
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-600"></div>
                  <p className="text-sm font-medium text-gray-700">Direct Sales</p>
                </div>
                <p className="font-bold text-gray-900">
                  {metrics.transactionBreakdown.sales}
                </p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                  <p className="text-sm font-medium text-gray-700">Rentals</p>
                </div>
                <p className="font-bold text-gray-900">
                  {metrics.transactionBreakdown.rentals}
                </p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                  <p className="text-sm font-medium text-gray-700">Custom Orders</p>
                </div>
                <p className="font-bold text-gray-900">
                  {metrics.transactionBreakdown.customOrders}
                </p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-orange-600"></div>
                  <p className="text-sm font-medium text-gray-700">Returns</p>
                </div>
                <p className="font-bold text-gray-900">
                  {metrics.transactionBreakdown.returns}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-600"></div>
                  <p className="text-sm font-medium text-gray-700">Refunds</p>
                </div>
                <p className="font-bold text-gray-900">
                  {metrics.transactionBreakdown.refunds}
                </p>
              </div>
            </div>
          </div>

          {/* Conversion Metrics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Conversion Metrics
            </h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600">Completed Transactions</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {metrics.conversionMetrics.completedTransactions}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {(
                    (metrics.conversionMetrics.completedTransactions /
                      metrics.conversionMetrics.totalTransactions) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-gray-600">Pending Transactions</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {metrics.conversionMetrics.pendingTransactions}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {(
                    (metrics.conversionMetrics.pendingTransactions /
                      metrics.conversionMetrics.totalTransactions) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-gray-600">Cancelled Transactions</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {metrics.conversionMetrics.cancelledTransactions}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {(
                    (metrics.conversionMetrics.cancelledTransactions /
                      metrics.conversionMetrics.totalTransactions) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600 text-lg">Analytics dashboard coming soon...</p>
          </div>
        )}

        {activeTab === "transactions" && <TransactionHistory metrics={metrics} />}
      </main>

      {/* Offline Order Modal */}
      {showOfflineOrderForm && (
        <OfflineOrderForm
          onClose={() => setShowOfflineOrderForm(false)}
          onSuccess={() => {
            // Refresh metrics after successful offline order
            const fetchMetrics = async () => {
              try {
                const response = await fetch("/api/admin/finance");
                if (!response.ok) throw new Error("Failed to fetch metrics");
                const financeData = await response.json();
                setMetrics(financeData.metrics);
              } catch (err) {
                console.error("Error refreshing metrics:", err);
              }
            };
            fetchMetrics();
          }}
        />
      )}
    </div>
  );
}
