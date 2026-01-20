"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  AlertCircle,
  Download,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Search,
} from "lucide-react";
import OfflineOrdersTable from "./offline-orders-table";

interface VATMetrics {
  rate: number;
  totalSalesExVAT: number;
  outputVAT: number;
  inputVAT: number;
  vatPayable: number;
  estimatedMonthlyVAT: number;
  estimatedAnnualVAT: number;
  annualVATTotal: number;
  monthlyBreakdown: MonthlyVATData[];
  vatHistory: VATHistoryItem[];
  transactionHistory: OrderTransaction[];
}

interface MonthlyVATData {
  month: string;
  monthIndex: number;
  year: number;
  salesExVAT: number;
  outputVAT: number;
  inputVAT: number;
  vatPayable: number;
  orderCount: number;
  totalOrderAmount: number;
  expenseCount?: number;
  totalExpenseAmount?: number;
  daysRemaining?: number;
}

interface VATHistoryItem {
  date: string;
  description: string;
  amount: number;
  type: "output" | "input" | "payment";
}

interface VATPeriod {
  startDate: Date;
  endDate: Date;
  isCurrentPeriod: boolean;
  daysRemaining: number;
  daysToDeadline: number;
  deadlineDate: Date;
  status: "active" | "upcoming" | "overdue";
  notificationLevel: "warning" | "critical" | "normal";
}

interface OrderTransaction {
  _id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  vat: number;
  subtotal: number;
  createdAt: string;
  status: string;
  isOffline?: boolean;
}

export default function VATTab() {
  const [metrics, setMetrics] = useState<VATMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "offline">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [vatPeriod, setVatPeriod] = useState<VATPeriod | null>(null);

  // Calculate current VAT period (21st to 20th of next month)
  const calculateVATPeriod = (): VATPeriod => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let startDate: Date;
    let endDate: Date;
    let deadlineDate: Date;

    if (currentDay >= 21) {
      // Current period: 21st of this month to 20th of next month
      startDate = new Date(currentYear, currentMonth, 21);
      endDate = new Date(currentYear, currentMonth + 1, 20);
      // Deadline is the 21st of next month
      deadlineDate = new Date(currentYear, currentMonth + 1, 21);
    } else {
      // Current period: 21st of last month to 20th of this month
      startDate = new Date(currentYear, currentMonth - 1, 21);
      endDate = new Date(currentYear, currentMonth, 20);
      // Deadline is the 21st of this month
      deadlineDate = new Date(currentYear, currentMonth, 21);
    }

    const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const daysToDeadline = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    let status: "active" | "upcoming" | "overdue" = "active";
    let notificationLevel: "warning" | "critical" | "normal" = "normal";

    if (daysToDeadline <= 0 && currentDay <= 20) {
      status = "overdue";
      notificationLevel = "critical";
    } else if (daysToDeadline <= 3 && daysToDeadline > 0) {
      notificationLevel = "critical";
    } else if (daysToDeadline <= 7) {
      notificationLevel = "warning";
    }

    return {
      startDate,
      endDate,
      isCurrentPeriod: currentDay >= 21,
      daysRemaining,
      daysToDeadline,
      deadlineDate,
      status,
      notificationLevel,
    };
  };

  useEffect(() => {
    const fetchVATMetrics = async () => {
      try {
        setLoading(true);
        
        // Calculate VAT period
        const period = calculateVATPeriod();
        setVatPeriod(period);
        
        // Fetch VAT analytics and order data
        const [vatRes, ordersRes] = await Promise.all([
          fetch("/api/admin/vat-analytics"),
          fetch("/api/orders/unified")
        ]);

        if (!vatRes.ok) {
          throw new Error("Failed to fetch VAT analytics");
        }

        const vatData = await vatRes.json();
        const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };

        if (!vatData.data) {
          throw new Error("No VAT analytics data available");
        }

        const vatBreakdown = vatData.data;
        const currentMonth = new Date().getMonth();
        const currentMonthData = vatBreakdown.monthlyBreakdown[currentMonth];
        
        // Calculate days remaining in current month
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - now.getDate();

        // Add days remaining to current month data
        if (currentMonthData) {
          currentMonthData.daysRemaining = daysRemaining;
        }

        // Generate VAT history from the data
        const vatHistory: VATHistoryItem[] = [];
        
        // Add monthly summary
        vatHistory.push({
          date: new Date().toISOString().split('T')[0],
          description: "Monthly VAT recorded",
          amount: currentMonthData?.vatPayable || 0,
          type: "output",
        });

        // Process transaction history from orders
        const transactionHistory: OrderTransaction[] = ordersData.orders
          ? ordersData.orders
              .filter((order: any) => order.status === "confirmed" || order.status === "completed")
              .map((order: any) => ({
                _id: order._id,
                orderNumber: order.orderNumber || `ORD-${order._id?.toString().slice(-8).toUpperCase()}`,
                buyerName: order.firstName && order.lastName ? `${order.firstName} ${order.lastName}` : order.buyerName || "Unknown",
                buyerEmail: order.email || "N/A",
                amount: order.total || order.subtotal + (order.vat || 0),
                vat: order.vat || 0,
                subtotal: order.subtotal || 0,
                createdAt: order.createdAt,
                status: order.status || "completed",
              }))
          : [];

        console.log(`[VAT Tab] Loaded ${transactionHistory.length} transactions for VAT history`);

        setMetrics({
          rate: 7.5,
          totalSalesExVAT: vatBreakdown.monthlyBreakdown.reduce((sum: number, m: any) => sum + m.salesExVAT, 0),
          outputVAT: vatBreakdown.monthlyBreakdown.reduce((sum: number, m: any) => sum + m.outputVAT, 0),
          inputVAT: vatBreakdown.monthlyBreakdown.reduce((sum: number, m: any) => sum + m.inputVAT, 0),
          vatPayable: vatBreakdown.monthlyBreakdown.reduce((sum: number, m: any) => sum + m.vatPayable, 0),
          estimatedMonthlyVAT: currentMonthData?.vatPayable || 0,
          estimatedAnnualVAT: vatBreakdown.annualVATTotal,
          annualVATTotal: vatBreakdown.annualVATTotal,
          monthlyBreakdown: vatBreakdown.monthlyBreakdown,
          vatHistory: vatHistory.length > 0 ? vatHistory : generateDefaultVATHistory(),
          transactionHistory: transactionHistory,
        });
      } catch (err) {
        console.error("Error fetching VAT metrics:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVATMetrics();
  }, []);

  const generateDefaultVATHistory = (): VATHistoryItem[] => {
    return [
      {
        date: new Date().toISOString().split('T')[0],
        description: "No sales data available for current month",
        amount: 0,
        type: "output",
      },
    ];
  };

  const calculateDaysUntilDeadline = (): number => {
    return vatPeriod?.daysToDeadline ?? 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-lime-600"></div>
          <p className="mt-4 text-gray-600">Loading VAT data...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading VAT Data</h3>
            <p className="text-red-700 text-sm mt-1">{error || "Failed to load VAT metrics"}</p>
          </div>
        </div>
      </div>
    );
  }

  const daysToDeadline = calculateDaysUntilDeadline();

  // Filter transactions based on search and status
  const filteredTransactions = (metrics?.transactionHistory?.filter?.((transaction: any) => {
    const matchesSearch =
      transaction.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;

    return matchesSearch && matchesStatus;
  }) || []);

  return (
    <div className="space-y-8">
      {/* VAT Deadline Alert */}
      <div className={`rounded-2xl border-2 p-6 ${daysToDeadline <= 7 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-start gap-4">
          <Calendar className={`h-6 w-6 mt-0.5 shrink-0 ${daysToDeadline <= 7 ? "text-red-600" : "text-amber-600"}`} />
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${daysToDeadline <= 7 ? "text-red-900" : "text-amber-900"}`}>
              VAT Payment Deadline
            </h3>
            <p className={`text-sm mt-1 ${daysToDeadline <= 7 ? "text-red-700" : "text-amber-700"}`}>
              {daysToDeadline === 0 ? (
                <span className="font-bold">Due today!</span>
              ) : daysToDeadline === 1 ? (
                <span className="font-bold">Due tomorrow</span>
              ) : (
                <>Due in <span className="font-bold">{daysToDeadline} days</span> ({vatPeriod?.deadlineDate.toLocaleDateString('en-NG', { month: 'long', day: 'numeric' })})</>
              )}
            </p>
            <p className="text-xs mt-2 opacity-75">
              Remember to file your VAT return before the deadline to avoid penalties.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 font-medium transition">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* VAT Period Summary */}
      {vatPeriod && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">Current VAT Period</p>
                <p className="text-xs text-blue-600 mt-1">21st-20th each month</p>
              </div>
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-blue-600">Period Start</p>
                <p className="text-sm font-bold text-blue-900">{vatPeriod.startDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Period End</p>
                <p className="text-sm font-bold text-blue-900">{vatPeriod.endDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className={`${vatPeriod.notificationLevel === 'critical' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' : vatPeriod.notificationLevel === 'warning' ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'} rounded-xl p-6 border-2 shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm font-semibold ${vatPeriod.notificationLevel === 'critical' ? 'text-red-700' : vatPeriod.notificationLevel === 'warning' ? 'text-amber-700' : 'text-green-700'}`}>
                  Payment Deadline
                </p>
                <p className={`text-xs mt-1 ${vatPeriod.notificationLevel === 'critical' ? 'text-red-600' : vatPeriod.notificationLevel === 'warning' ? 'text-amber-600' : 'text-green-600'}`}>
                  {vatPeriod.deadlineDate.toLocaleDateString('en-NG', { month: 'long', day: 'numeric' })}
                </p>
              </div>
              <AlertCircle className={`h-6 w-6 ${vatPeriod.notificationLevel === 'critical' ? 'text-red-600' : vatPeriod.notificationLevel === 'warning' ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
            <div className="space-y-3">
              <div>
                <p className={`text-xs ${vatPeriod.notificationLevel === 'critical' ? 'text-red-600' : vatPeriod.notificationLevel === 'warning' ? 'text-amber-600' : 'text-green-600'}`}>Deadline Date</p>
                <p className={`text-sm font-bold ${vatPeriod.notificationLevel === 'critical' ? 'text-red-900' : vatPeriod.notificationLevel === 'warning' ? 'text-amber-900' : 'text-green-900'}`}>
                  {vatPeriod.deadlineDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className={`text-xs ${vatPeriod.notificationLevel === 'critical' ? 'text-red-600' : vatPeriod.notificationLevel === 'warning' ? 'text-amber-600' : 'text-green-600'}`}>Days Remaining</p>
                <p className={`text-lg font-bold ${vatPeriod.notificationLevel === 'critical' ? 'text-red-900' : vatPeriod.notificationLevel === 'warning' ? 'text-amber-900' : 'text-green-900'}`}>
                  {vatPeriod.daysToDeadline} days
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VAT Tab Navigation */}
      <div className="bg-white border-b border-gray-200 rounded-t-2xl overflow-hidden">
        <div className="flex gap-8 px-8">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`py-4 px-2 font-medium border-b-2 transition ${
              activeSubTab === "overview"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              VAT Summary
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeSubTab === "overview" && (
        <div className="space-y-8">
      {/* VAT Calculation Breakdown */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-lime-600" />
          Annual VAT Summary
        </h2>

        {/* VAT Sources Breakdown - Four Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Online Output VAT (Outward) */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Online Sales</p>
                <p className="text-xs text-blue-600">Output VAT (Outward)</p>
              </div>
              <ArrowUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              ₦{(metrics.outputVAT * 0.6).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-blue-500">60% of total output VAT</p>
          </div>

          {/* Offline Output VAT (Outward) */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Offline Sales</p>
                <p className="text-xs text-purple-600">Output VAT (Outward)</p>
              </div>
              <ArrowUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              ₦{(metrics.outputVAT * 0.4).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-purple-500">40% of total output VAT</p>
          </div>

          {/* Input VAT (Inward) */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border-2 border-teal-200 shadow-sm hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">Purchases</p>
                <p className="text-xs text-teal-600">Input VAT (Inward)</p>
              </div>
              <ArrowDown className="h-5 w-5 text-teal-600" />
            </div>
            <p className="text-3xl font-bold text-teal-600 mb-2">
              ₦{metrics.inputVAT.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-teal-500">Deductible expenses</p>
          </div>

          {/* Total VAT Payable */}
          <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-xl p-6 border-2 border-red-300 shadow-md hover:shadow-lg transition ring-1 ring-red-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Net Payable</p>
                <p className="text-xs text-red-600">Total VAT Due</p>
              </div>
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600 mb-2">
              ₦{metrics.vatPayable.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-red-500">To tax authority</p>
          </div>
        </div>

        {/* VAT Calculation Flow */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-lime-100 flex items-center justify-center text-lime-600 font-bold">≡</div>
            VAT Calculation Breakdown
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Online Output VAT */}
            <div className="bg-gradient-to-r from-blue-50 to-transparent rounded-lg p-6 border-l-4 border-blue-400">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    Online Sales Output VAT
                  </p>
                  <p className="text-xs text-gray-500 mt-1">VAT collected from online customers (Outward)</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ₦{(metrics.outputVAT * 0.6).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* Offline Output VAT */}
            <div className="bg-gradient-to-r from-purple-50 to-transparent rounded-lg p-6 border-l-4 border-purple-400">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                    Offline Sales Output VAT
                  </p>
                  <p className="text-xs text-gray-500 mt-1">VAT collected from offline customers (Outward)</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  ₦{(metrics.outputVAT * 0.4).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* Total Output VAT */}
            <div className="bg-gradient-to-r from-orange-50 to-transparent rounded-lg p-6 border-l-4 border-orange-400">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                    Total Output VAT
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Combined VAT from all sales sources</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  ₦{metrics.outputVAT.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-orange-600">
                = Online (₦{(metrics.outputVAT * 0.6).toLocaleString("en-NG", { minimumFractionDigits: 2 })}) + Offline (₦{(metrics.outputVAT * 0.4).toLocaleString("en-NG", { minimumFractionDigits: 2 })})
              </div>
            </div>

            {/* LESS and Input VAT Section */}
            <div className="space-y-4">
              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t-2 border-gray-300"></div>
                <span className="text-sm font-semibold text-gray-500">LESS</span>
                <div className="flex-1 border-t-2 border-gray-300"></div>
              </div>

              {/* Input VAT */}
              <div className="bg-gradient-to-r from-teal-50 to-transparent rounded-lg p-6 border-l-4 border-teal-400">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-teal-500"></span>
                      Total Input VAT (Deductible)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">VAT paid on business purchases & expenses (Inward)</p>
                  </div>
                  <p className="text-2xl font-bold text-teal-600">
                    (₦{metrics.inputVAT.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })})
                  </p>
                </div>
              </div>

              {/* Equals Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t-2 border-red-400"></div>
                <span className="text-sm font-bold text-red-600">EQUALS</span>
                <div className="flex-1 border-t-2 border-red-400"></div>
              </div>
            </div>

            {/* Total VAT Payable */}
            <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-600"></span>
                    Total Annual VAT Payable
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Amount due to tax authority by {vatPeriod?.deadlineDate.toLocaleDateString('en-NG', { month: 'long', day: 'numeric' })}</p>
                </div>
                <p className="text-4xl font-bold text-red-600">
                  ₦{metrics.vatPayable.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-red-200 text-xs text-red-700 space-y-1">
                <p>= Output VAT (₦{metrics.outputVAT.toLocaleString("en-NG", { minimumFractionDigits: 2 })}) - Input VAT (₦{metrics.inputVAT.toLocaleString("en-NG", { minimumFractionDigits: 2 })})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {/* VAT Efficiency */}
          <div className="bg-gradient-to-br from-lime-50 to-emerald-50 rounded-xl p-6 border border-lime-200">
            <p className="text-sm font-semibold text-lime-700 mb-4 uppercase tracking-wide">VAT Efficiency</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-lime-700 font-medium">Output VAT Coverage</span>
                  <span className="text-sm font-bold text-lime-700">
                    {metrics.inputVAT > 0 ? ((metrics.inputVAT / metrics.outputVAT) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
                <div className="w-full bg-lime-200 rounded-full h-2">
                  <div
                    className="bg-lime-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((metrics.inputVAT / metrics.outputVAT) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-lime-700 mt-4">
                {metrics.inputVAT > 0 
                  ? `Your Input VAT covers ${((metrics.inputVAT / metrics.outputVAT) * 100).toFixed(1)}% of your Output VAT`
                  : "No deductible expenses recorded"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VAT History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Archived VAT Periods</h2>
          <p className="text-sm text-gray-600 mb-6">View and manage previous VAT calculation periods (automatically archived on the 21st of each month)</p>
          
          {metrics.monthlyBreakdown && metrics.monthlyBreakdown.length > 0 ? (
            <div className="space-y-3">
              {metrics.monthlyBreakdown.map((month, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-purple-100">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{month.month} {month.year}</p>
                      <p className="text-xs text-gray-500">{month.orderCount} orders • {month.expenseCount} expenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      ₦{month.vatPayable.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Output: ₦{month.outputVAT.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No archived periods yet</p>
          )}
        </div>

        <hr className="my-8" />

        <h2 className="text-xl font-bold text-gray-900 mb-6">VAT Transaction History</h2>
        <div className="space-y-3">
          {metrics.vatHistory.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`p-3 rounded-lg ${
                    item.type === "output"
                      ? "bg-orange-100 text-orange-600"
                      : item.type === "input"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {item.type === "output" ? (
                    <ArrowUp className="h-5 w-5" />
                  ) : item.type === "input" ? (
                    <ArrowDown className="h-5 w-5" />
                  ) : (
                    <DollarSign className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.description}</p>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
              </div>
              <p
                className={`font-bold text-lg ${
                  item.type === "payment" ? "text-green-600" : "text-gray-900"
                }`}
              >
                ₦{item.amount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> About VAT Calculation
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• <strong>Output VAT:</strong> The VAT you charge your customers on sales (7.5% of sales value)</li>
              <li>• <strong>Input VAT:</strong> The VAT you pay on business expenses that can be deducted from output VAT</li>
              <li>• <strong>VAT Payable:</strong> The net amount you owe to the tax authority (Output VAT - Input VAT)</li>
              <li>• <strong>Filing Deadline:</strong> VAT returns must be filed by the 21st of the following month</li>
              <li>• <strong>Monthly Frequency:</strong> VAT is calculated and paid monthly in Nigeria</li>
            </ul>
          </div>
        </div>
      )}

      {/* Offline VAT Summary Tab */}
      {activeSubTab === "offline" && (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Offline Orders Management</h2>
              <p className="text-sm text-gray-600">
                Manage all manual/offline sales transactions. Add, view, edit, or delete offline orders and track their VAT contributions.
              </p>
            </div>

            {/* Offline VAT Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Offline Orders */}
              <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Total Offline Orders</p>
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {metrics?.transactionHistory?.filter((t) => t.isOffline)?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-2">Recorded manual sales</p>
              </div>

              {/* Offline Sales Ex VAT */}
              <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Sales (Ex VAT)</p>
                  <DollarSign className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{(
                    metrics?.transactionHistory
                      ?.filter((t) => t.isOffline)
                      ?.reduce((sum, t) => sum + t.subtotal, 0) || 0
                  ).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">Before VAT is applied</p>
              </div>

              {/* Offline VAT Collected */}
              <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">VAT Collected (7.5%)</p>
                  <ArrowUp className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  ₦{(
                    metrics?.transactionHistory
                      ?.filter((t) => t.isOffline)
                      ?.reduce((sum, t) => sum + t.vat, 0) || 0
                  ).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">Output VAT from offline sales</p>
              </div>

              {/* Offline Total Revenue */}
              <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ₦{(
                    metrics?.transactionHistory
                      ?.filter((t) => t.isOffline)
                      ?.reduce((sum, t) => sum + t.subtotal + t.vat, 0) || 0
                  ).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">Including VAT</p>
              </div>
            </div>

            {/* Offline Orders Management Table */}
            <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm">
              <OfflineOrdersTable onOrderAdded={() => {
                // Refresh metrics when a new offline order is added
                const fetchVATMetrics = async () => {
                  try {
                    const [vatRes, ordersRes] = await Promise.all([
                      fetch("/api/admin/vat-analytics"),
                      fetch("/api/orders/unified")
                    ]);

                    if (vatRes.ok) {
                      const vatData = await vatRes.json();
                      if (vatData.data) {
                        setMetrics(vatData.data);
                      }
                    }
                  } catch (err) {
                    console.error("Error refreshing VAT metrics:", err);
                  }
                };
                fetchVATMetrics();
              }} />
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-800">
                <strong>💡 How Offline Orders Work:</strong> All offline orders are automatically included in your monthly VAT calculations. When you record an offline order, the VAT (7.5%) is calculated automatically and included in your Output VAT totals for tax filing purposes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
