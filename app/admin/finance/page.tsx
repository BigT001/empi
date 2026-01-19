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
import { PermissionGuard } from "@/app/components/PermissionGuard";
import { FinanceProjectOverview } from "./components/FinanceProjectOverview";
import { useResponsive } from "@/app/hooks/useResponsive";

// Lazy load these desktop-heavy components
const VATTab = dynamic(() => import("../vat-tab"), { ssr: false });
const OfflineOrderForm = dynamic(() => import("../offline-order-form"), { ssr: false });
const OfflineExpenseForm = dynamic(() => import("../offline-expense-form"), { ssr: false });
const TransactionHistory = dynamic(() => import("../transaction-history"), { ssr: false });
const DailyExpenses = dynamic(() => import("../daily-expenses"), { ssr: false });

interface FinanceMetrics {
  totalRevenue: number;
  totalIncome: number;
  totalExpenses: number;
  pendingAmount: number;
  completedAmount: number;
  totalSalesAmount: number;
  totalRentalsAmount: number;
  completedOutgoing: number;
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

function FinancePageContent() {
  const { mounted } = useResponsive();
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vat" | "overview" | "transactions" | "offline" | "expenses">("overview");
  const [showOfflineOrderForm, setShowOfflineOrderForm] = useState(false);
  const [showOfflineExpenseForm, setShowOfflineExpenseForm] = useState(false);

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

    if (mounted) {
      fetchMetrics();
    }
  }, [mounted]);

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
      {/* Header - Responsive */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Finance Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Track your revenue, expenses, and tax calculations
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Scrollable on Mobile */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 overflow-x-auto">
        <div className="px-4 sm:px-6">
          <div className="flex gap-1 sm:gap-8 min-w-min sm:min-w-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-2 sm:px-3 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                <span className="hidden sm:inline">Project Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-4 px-2 sm:px-3 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === "transactions"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <ShoppingCart className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                <span className="hidden sm:inline">Transaction History</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("offline")}
              className={`py-4 px-2 sm:px-3 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === "offline"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <ShoppingCart className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                <span className="hidden sm:inline">💸 Offline Sales & Rentals</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("vat")}
              className={`py-4 px-2 sm:px-3 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === "vat"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                <span className="hidden sm:inline">VAT Management</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`py-4 px-2 sm:px-3 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === "expenses"
                  ? "border-lime-600 text-lime-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <TrendingDown className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                <span className="hidden sm:inline">Daily Expenses</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content - Responsive */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-12 w-full">
        {activeTab === "vat" && <VATTab />}
        
        {activeTab === "overview" && (
          <FinanceProjectOverview loading={loading} />
        )}

        {activeTab === "transactions" && <TransactionHistory metrics={metrics} />}

        {activeTab === "offline" && <TransactionHistory metrics={metrics} offlineTab={true} />}

        {activeTab === "expenses" && (
          <DailyExpenses onAddExpenseClick={() => setShowOfflineExpenseForm(true)} />
        )}
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

      {/* Offline Expense Modal */}
      {showOfflineExpenseForm && (
        <OfflineExpenseForm
          onClose={() => setShowOfflineExpenseForm(false)}
          onSuccess={() => {
            // Refresh metrics after successful offline expense
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

// Wrap with permission guard
export default function FinancePage() {
  return (
    <PermissionGuard requiredPermission="view_finance">
      <FinancePageContent />
    </PermissionGuard>
  );
}
