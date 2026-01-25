"use client";

import { useState, useEffect, useRef } from "react";
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
import { getTotalOnlineSales, getTotalOnlineRentals, getTotalOfflineSales, getTotalOfflineRentals, getTotalDailyExpenses } from '@/lib/utils/financeCalculations';
import { getTotalOnlineVAT, getTotalOfflineVAT, getTotalInputVAT } from '@/lib/utils/vatCalculations.client';

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
  const [expensesRefreshKey, setExpensesRefreshKey] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const initialLoadRef = useRef(true);

  // Fetch finance metrics from transaction history and offline data
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Only show loading on initial load, not on background refreshes
        if (initialLoadRef.current) {
          setLoading(true);
        }
        
        // Use same utility functions as dashboard - fetch from transaction history and offline data
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

        const financeMetrics: FinanceMetrics = {
          totalRevenue: onlineSales + onlineRentals + offlineSales + offlineRentals,
          totalIncome: 0,
          totalExpenses: expenses,
          pendingAmount: 0,
          completedAmount: 0,
          totalSalesAmount: onlineSales + offlineSales,
          totalRentalsAmount: onlineRentals + offlineRentals,
          completedOutgoing: 0,
          annualTurnover: 0,
          businessSize: 'medium',
          taxBreakdown: {
            vat: {
              rate: 0.075,
              totalSalesExVAT: (onlineSales + offlineSales) / 1.075,
              outputVAT: outputVAT,
              inputVAT: inputVAT,
              vatPayable: vatPayable,
            },
            corporateIncomeTax: 0,
            educationTax: 0,
            totalAnnualTax: vatPayable,
          },
          monthlyTax: {
            estimatedMonthlyVAT: vatPayable / 12,
            estimatedMonthlyCIT: 0,
            estimatedMonthlyEducationTax: 0,
            estimatedMonthlyTotal: vatPayable / 12,
          },
          weeklyProjection: [],
          transactionBreakdown: {
            sales: onlineSales + offlineSales,
            rentals: onlineRentals + offlineRentals,
            customOrders: 0,
            returns: 0,
            refunds: 0,
          },
          profitMargin: 0,
          averageOrderValue: 0,
          conversionMetrics: {
            totalTransactions: 0,
            completedTransactions: 0,
            pendingTransactions: 0,
            cancelledTransactions: 0,
            conversionRate: 0,
          },
        };

        setMetrics(financeMetrics);
        setError(null);
      } catch (err) {
        console.error("Error fetching finance metrics:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        // Only hide loading on initial load
        if (initialLoadRef.current) {
          setLoading(false);
          initialLoadRef.current = false;
        }
      }
    };

    if (mounted) {
      fetchMetrics();
      
      // Auto-refresh every 3 seconds for real-time updates
      const interval = setInterval(fetchMetrics, 3000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  // Handle scroll to hide/show header
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide header when scrolling down past 100px, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
      {/* Tab Navigation - Scrollable on Mobile */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 overflow-x-auto">
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
          <DailyExpenses key={expensesRefreshKey} onAddExpenseClick={() => setShowOfflineExpenseForm(true)} />
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
            // Trigger DailyExpenses refresh
            setExpensesRefreshKey(prev => prev + 1);
            
            // Also refresh metrics
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
