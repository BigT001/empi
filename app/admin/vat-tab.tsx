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
  daysRemaining?: number;
}

interface VATHistoryItem {
  date: string;
  description: string;
  amount: number;
  type: "output" | "input" | "payment";
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
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "transactions" | "offline">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const fetchVATMetrics = async () => {
      try {
        setLoading(true);
        
        // Fetch VAT analytics and order data
        const [vatRes, ordersRes] = await Promise.all([
          fetch("/api/admin/vat-analytics"),
          fetch("/api/orders")
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
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    // VAT deadline is typically 21st of next month
    const deadline = new Date(currentYear, currentMonth + 1, 21);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
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
  const filteredTransactions = metrics?.transactionHistory.filter((transaction) => {
    const matchesSearch =
      transaction.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;

    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-8">
      {/* VAT Deadline Alert */}
      <div className={`rounded-2xl border-2 p-6 ${daysToDeadline <= 7 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-start gap-4">
          <Calendar className={`h-6 w-6 mt-0.5 flex-shrink-0 ${daysToDeadline <= 7 ? "text-red-600" : "text-amber-600"}`} />
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
                <>Due in <span className="font-bold">{daysToDeadline} days</span> (21st of next month)</>
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

      {/* VAT KPI Cards - Directly under deadline alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Month VAT */}
        <div className="bg-gradient-to-br from-green-50 to-green-50 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Current Month VAT</p>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{metrics.estimatedMonthlyVAT.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center gap-2 mt-2 text-green-600">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs">VAT Rate: {metrics.rate}%</p>
          </div>
        </div>

        {/* Annual VAT Total */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Annual VAT Total</p>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{metrics.annualVATTotal.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Based on actual monthly data
          </p>
        </div>

        {/* Total Output VAT (Sales) */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-50 rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Total Output VAT</p>
            <ArrowUp className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{metrics.outputVAT.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            VAT on all sales
          </p>
        </div>

        {/* Total Input VAT */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-50 rounded-2xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Total Input VAT</p>
            <TrendingDown className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{metrics.inputVAT.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Deductible VAT
          </p>
        </div>
      </div>

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
          <button
            onClick={() => setActiveSubTab("transactions")}
            className={`py-4 px-2 font-medium border-b-2 transition ${
              activeSubTab === "transactions"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Transaction History
              {metrics?.transactionHistory && (
                <span className="ml-2 bg-lime-100 text-lime-700 px-2 py-1 rounded-full text-xs font-bold">
                  {metrics.transactionHistory.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab("offline")}
            className={`py-4 px-2 font-medium border-b-2 transition ${
              activeSubTab === "offline"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Offline VAT Summary
              {metrics?.transactionHistory && (
                <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">
                  {metrics.transactionHistory.filter((t) => t.isOffline)?.length || 0}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeSubTab === "overview" && (
        <div className="space-y-8">
      {/* VAT Calculation Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Annual VAT Summary</h2>
        <div className="space-y-4">
          {/* Sales Ex VAT */}
          <div className="pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-600">Total Sales (Ex VAT)</p>
              <p className="font-bold text-gray-900">
                ₦{metrics.totalSalesExVAT.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Amount before VAT is applied
            </p>
          </div>

          {/* Output VAT Calculation */}
          <div className="pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-600">
                Total Output VAT ({metrics.rate}% on sales)
              </p>
              <p className="font-bold text-orange-600">
                ₦{metrics.outputVAT.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>

          {/* Input VAT */}
          <div className="pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-600">Total Input VAT (Deductible)</p>
              <p className="font-bold text-blue-600">
                ₦{metrics.inputVAT.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              VAT paid on purchases and expenses
            </p>
          </div>

          {/* Total VAT Payable */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">
                Total Annual VAT Payable
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Output VAT</span>
                <span className="font-semibold">
                  ₦{metrics.outputVAT.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Less: Input VAT</span>
                <span className="font-semibold">
                  (₦{metrics.inputVAT.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })})
                </span>
              </div>
              <div className="border-t border-red-200 pt-3 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Annual VAT Payable</span>
                <span className="text-2xl font-bold text-red-600">
                  ₦{metrics.vatPayable.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="bg-white rounded p-2 mt-3">
                <p className="text-xs text-gray-600">
                  <strong>Monthly Average:</strong> ₦{(metrics.vatPayable / 12).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly VAT Breakdown (This Year)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-900">Month</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-900">Orders</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-900">Sales Ex VAT</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-900">Output VAT</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-900">Input VAT</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-900">VAT Payable</th>
              </tr>
            </thead>
            <tbody>
              {metrics.monthlyBreakdown.map((month, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                    month.daysRemaining !== undefined ? "bg-lime-50" : ""
                  }`}
                >
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">{month.month}</span>
                    {month.daysRemaining !== undefined && (
                      <span className="ml-2 text-xs bg-lime-200 text-lime-700 px-2 py-1 rounded-full font-semibold">
                        Current ({month.daysRemaining}d left)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-900">
                    {month.orderCount}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-900">
                    ₦{month.salesExVAT.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-orange-600">
                    ₦{month.outputVAT.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-blue-600">
                    ₦{month.inputVAT.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-red-600">
                    ₦{month.vatPayable.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Months with no orders display ₦0.00. Data is pulled from actual order records in the database.
          </p>
        </div>
      </div>

      {/* VAT History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
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

      {/* Transaction History Tab */}
      {activeSubTab === "transactions" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Sales Transaction History</h2>
            <p className="text-sm text-gray-600 mb-6">
              View all transactions that contribute to your VAT calculations. This shows the buyer date, order amount, and VAT charged.
            </p>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number, buyer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-lime-600"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredTransactions.length} of {metrics?.transactionHistory.length || 0} transactions
            </div>
          </div>

          {/* Transaction Table */}
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Order Number</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Buyer Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Email</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">Amount (Ex VAT)</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">VAT (7.5%)</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">Total</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => {
                    const total = transaction.subtotal + transaction.vat;
                    const formattedDate = new Date(transaction.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="py-4 px-4 font-semibold text-gray-900">{transaction.orderNumber}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              transaction.isOffline
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {transaction.isOffline ? "Offline" : "Online"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{transaction.buyerName}</td>
                        <td className="py-4 px-4 text-gray-600 text-xs">{transaction.buyerEmail}</td>
                        <td className="py-4 px-4 text-right font-semibold text-gray-900">
                          ₦{transaction.subtotal.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-orange-600">
                          ₦{transaction.vat.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-green-600">
                          ₦{total.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{formattedDate}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No transactions found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search filters"
                  : "No transactions have been recorded yet"}
              </p>
            </div>
          )}

          {/* Transaction Summary */}
          {filteredTransactions.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <p className="text-sm text-green-700 font-semibold">Total Sales (Ex VAT)</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₦{filteredTransactions
                    .reduce((sum, t) => sum + t.subtotal, 0)
                    .toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                <p className="text-sm text-orange-700 font-semibold">Total VAT Collected</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  ₦{filteredTransactions
                    .reduce((sum, t) => sum + t.vat, 0)
                    .toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                <p className="text-sm text-blue-700 font-semibold">Total Amount (Inc VAT)</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  ₦{filteredTransactions
                    .reduce((sum, t) => sum + t.subtotal + t.vat, 0)
                    .toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-blue-800">
              <strong>How this data is used:</strong> Each transaction shown here contributes to your Output VAT calculation. The VAT amount shown (7.5% of the pre-VAT amount) is what you collect from buyers and remit to the tax authority monthly.
            </p>
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
                      fetch("/api/orders")
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
