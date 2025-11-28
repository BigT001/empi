"use client";

import { useState, useEffect } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Loader,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";

interface Transaction {
  _id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  vat?: number;
  subtotal?: number;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  type?: "income" | "expense";
  description?: string;
}

interface TransactionHistoryProps {
  metrics?: any;
}

export default function TransactionHistory({ metrics }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all orders (both online and offline)
      const response = await fetch("/api/orders");
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      const orders = data.orders || [];

      // Transform orders into transactions
      const allTransactions: Transaction[] = orders.map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        buyerName: `${order.firstName || ""} ${order.lastName || ""}`.trim(),
        buyerEmail: order.email,
        amount: order.total || order.subtotal || 0,
        subtotal: order.subtotal || 0,
        vat: order.vat || 0,
        createdAt: order.createdAt,
        status: order.status,
        paymentMethod: order.paymentMethod,
        type: "income", // All orders are income
        description: order.items?.[0]?.name || "Order",
      }));

      setTransactions(allTransactions);
      applyFiltersAndSort(allTransactions, searchTerm, filterType, filterStatus, sortBy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = (
    data: Transaction[],
    search: string,
    type: string,
    status: string,
    sort: string
  ) => {
    let filtered = [...data];

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (t) =>
          t.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          t.buyerName.toLowerCase().includes(search.toLowerCase()) ||
          t.buyerEmail.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply type filter
    if (type !== "all") {
      filtered = filtered.filter((t) => t.type === type);
    }

    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    setFilteredTransactions(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFiltersAndSort(transactions, value, filterType, filterStatus, sortBy);
  };

  const handleFilterType = (value: string) => {
    setFilterType(value as "all" | "income" | "expense");
    applyFiltersAndSort(transactions, searchTerm, value, filterStatus, sortBy);
  };

  const handleFilterStatus = (value: string) => {
    setFilterStatus(value);
    applyFiltersAndSort(transactions, searchTerm, filterType, value, sortBy);
  };

  const handleSort = (value: string) => {
    setSortBy(value as any);
    applyFiltersAndSort(transactions, searchTerm, filterType, filterStatus, value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case "bank_transfer":
        return "🏦";
      case "card":
        return "💳";
      case "cash":
        return "💵";
      default:
        return "💰";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = filteredTransactions.length;

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <Loader className="h-8 w-8 animate-spin text-lime-600 mx-auto mb-3" />
        <p className="text-gray-600">Loading transaction history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Error Loading Transactions</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Transactions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Total Transactions</p>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalTransactions}</p>
          <p className="text-xs text-gray-500 mt-2">All recorded transactions</p>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Total Income</p>
            <ArrowDownLeft className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ₦{totalIncome.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-2">From all transactions</p>
        </div>

        {/* Average Transaction */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Average Transaction</p>
            <Wallet className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            ₦{totalTransactions > 0 ? (totalIncome / totalTransactions).toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0"}
          </p>
          <p className="text-xs text-gray-500 mt-2">Per transaction</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filter & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, name, or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
            />
          </div>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => handleFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>

          {/* Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg px-4 py-2">
            <Filter className="h-4 w-4" />
            <span>Showing {filteredTransactions.length} of {transactions.length}</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">Order #</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">Customer</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">Payment</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-900 text-sm">Amount</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-900 text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr
                    key={transaction._id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900 text-sm">
                        {transaction.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{transaction.buyerName}</p>
                        <p className="text-gray-500 text-xs">{transaction.buyerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg">{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                      <p className="text-xs text-gray-600 mt-1">
                        {transaction.paymentMethod?.replace("_", " ") || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-bold text-gray-900">
                        ₦{transaction.amount.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      {transaction.vat && (
                        <p className="text-xs text-orange-600 mt-1">
                          VAT: ₦{transaction.vat.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No transactions found</p>
          <p className="text-gray-500 text-sm mt-2">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "No transactions have been recorded yet"}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-sm text-blue-800">
          <strong>📊 Transaction History:</strong> This page shows all incoming and outgoing transactions including orders, payments, and other financial activities. Use the filters above to find specific transactions or time periods.
        </p>
      </div>
    </div>
  );
}
