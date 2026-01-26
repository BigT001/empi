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
  Plus,
  X,
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
  transactionType?: "sales" | "rentals";
  items?: Array<{ mode: 'buy' | 'rent'; price: number; quantity: number; name: string; cautionFee?: number }>;
}

interface OfflineSale {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  amount: number;
  subtotal: number;
  vat: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items?: Array<{ mode: 'buy' | 'rent'; price: number; quantity: number; name: string; cautionFee?: number }>;
  transactionType?: "sales" | "rentals";
}

interface TransactionHistoryProps {
  metrics?: any;
  offlineTab?: boolean;
}

export default function TransactionHistory({ metrics, offlineTab = false }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [offlineSales, setOfflineSales] = useState<OfflineSale[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filteredSales, setFilteredSales] = useState<OfflineSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [activeTab, setActiveTab] = useState<"orders" | "expenses">(offlineTab ? "expenses" : "orders");
  const [showAddSaleForm, setShowAddSaleForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchOfflineSales();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch orders and products in parallel
      const [ordersResponse, productsResponse] = await Promise.all([
        fetch("/api/orders/unified"),
        fetch("/api/products")
      ]);
      
      if (!ordersResponse.ok) throw new Error("Failed to fetch transactions");

      const data = await ordersResponse.json();
      const orders = data.orders || [];
      
      // Fetch products to get caution fees
      let productsMap = new Map();
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const products = productsData.products || [];
        products.forEach((product: any) => {
          productsMap.set(product._id, product);
        });
      }

      const allTransactions: Transaction[] = orders.map((order: any) => {
        // Enrich items with caution fees from products
        const enrichedItems = (order.items || []).map((item: any) => {
          const product = productsMap.get(item.productId);
          return {
            ...item,
            cautionFee: (item.mode === 'rent' && product?.cautionFee) ? product.cautionFee : 0
          };
        });

        // Determine transaction type based on items
        let transactionType: "sales" | "rentals" = "sales";
        if (enrichedItems.length > 0) {
          const hasSales = enrichedItems.some((item: any) => item.mode === "buy");
          const hasRentals = enrichedItems.some((item: any) => item.mode === "rent");
          
          // If only rentals, mark as rentals
          if (hasRentals && !hasSales) {
            transactionType = "rentals";
          }
          // If only sales, mark as sales
          else if (hasSales && !hasRentals) {
            transactionType = "sales";
          }
          // If mixed, default to sales (primary type)
          else {
            transactionType = "sales";
          }
        }

        return {
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
          type: "income",
          description: enrichedItems[0]?.name || "Order",
          transactionType,
          items: enrichedItems,
        };
      });

      setTransactions(allTransactions);
      applyFiltersAndSort(allTransactions, searchTerm, filterType, filterStatus, sortBy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter offline sales with explicit data parameter
  const applyFiltersAndSortToSales = (
    salesData: OfflineSale[],
    search: string,
    status: string,
    sort: string
  ) => {
    console.log("🔄 Applying filters to sales...", { salesCount: salesData.length, search, status, sort });
    
    let filteredSalesData = [...salesData];

    if (search.trim()) {
      filteredSalesData = filteredSalesData.filter(
        (sale) =>
          sale.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          sale.firstName.toLowerCase().includes(search.toLowerCase()) ||
          sale.lastName.toLowerCase().includes(search.toLowerCase()) ||
          sale.email.toLowerCase().includes(search.toLowerCase())
      );
      console.log(`🔍 After search filter: ${filteredSalesData.length} sales`);
    }

    // Filter by transaction type (sales or rentals) OR status
    if (status === "sales") {
      filteredSalesData = filteredSalesData.filter((sale) => sale.transactionType === "sales");
      console.log(`🏷️ After sales filter: ${filteredSalesData.length} sales`);
    } else if (status === "rentals") {
      filteredSalesData = filteredSalesData.filter((sale) => sale.transactionType === "rentals");
      console.log(`🏷️ After rentals filter: ${filteredSalesData.length} rentals`);
    } else if (status !== "all") {
      // Filter by actual status (completed, pending, cancelled, etc.)
      filteredSalesData = filteredSalesData.filter((sale) => sale.status === status);
      console.log(`🏷️ After status filter: ${filteredSalesData.length} sales`);
    }

    filteredSalesData.sort((a: OfflineSale, b: OfflineSale) => {
      switch (sort) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount-desc":
          return b.total - a.total;
        case "amount-asc":
          return a.total - b.total;
        default:
          return 0;
      }
    });

    console.log(`✅ Filtered sales updated: ${filteredSalesData.length} items`);
    setFilteredSales(filteredSalesData);
  };

  const fetchOfflineSales = async () => {
    try {
      console.log("🔄 Fetching offline sales...");
      
      // Fetch offline sales and products in parallel
      const [offlineResponse, productsResponse] = await Promise.all([
        fetch("/api/admin/offline-orders"),
        fetch("/api/products")
      ]);
      
      if (!offlineResponse.ok) throw new Error("Failed to fetch offline sales");

      const data = await offlineResponse.json();
      const sales = data.data || [];
      
      // Fetch products to get caution fees
      let productsMap = new Map();
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const products = productsData.products || [];
        products.forEach((product: any) => {
          productsMap.set(product._id, product);
        });
      }
      
      console.log(`📊 Found ${sales.length} offline sales`, sales);

      const formattedSales: OfflineSale[] = sales.map((order: any) => {
        // Enrich items with caution fees from products
        const enrichedItems = (order.items || []).map((item: any) => {
          const product = productsMap.get(item.productId);
          return {
            ...item,
            cautionFee: (item.mode === 'rent' && product?.cautionFee) ? product.cautionFee : 0
          };
        });

        // Determine transaction type based on items
        let transactionType: "sales" | "rentals" = "sales";
        if (enrichedItems.length > 0) {
          const hasSales = enrichedItems.some((item: any) => item.mode === "buy");
          const hasRentals = enrichedItems.some((item: any) => item.mode === "rent");
          
          // If only rentals, mark as rentals
          if (hasRentals && !hasSales) {
            transactionType = "rentals";
          }
          // If only sales, mark as sales
          else if (hasSales && !hasRentals) {
            transactionType = "sales";
          }
          // If mixed, default to sales (primary type)
          else {
            transactionType = "sales";
          }
        }

        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          firstName: order.firstName,
          lastName: order.lastName,
          email: order.email,
          amount: order.total || 0,
          subtotal: order.subtotal || 0,
          vat: order.vat || 0,
          total: order.total || 0,
          status: order.status,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          items: enrichedItems,
          transactionType,
        };
      });

      setOfflineSales(formattedSales);
      console.log("✅ Offline sales updated in state");
      
      // Immediately apply filters with the new data
      applyFiltersAndSortToSales(formattedSales, searchTerm, filterStatus, sortBy);
    } catch (err) {
      console.error("❌ Error fetching offline sales:", err);
    }
  };

  const deleteOfflineSale = async (saleId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete offline order ${orderNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(saleId);
      setDeleteError(null);

      const response = await fetch(`/api/admin/offline-orders/${saleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete offline order");
      }

      console.log(`✅ Deleted offline order: ${orderNumber}`);
      
      // Remove from state
      setOfflineSales(prev => prev.filter(sale => sale._id !== saleId));
      setFilteredSales(prev => prev.filter(sale => sale._id !== saleId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete order";
      setDeleteError(errorMsg);
      console.error("❌ Error deleting offline order:", errorMsg);
    } finally {
      setDeleting(null);
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

    if (search.trim()) {
      filtered = filtered.filter(
        (t) =>
          t.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          t.buyerName.toLowerCase().includes(search.toLowerCase()) ||
          t.buyerEmail.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type !== "all") {
      filtered = filtered.filter((t) => t.type === type);
    }

    // Filter by transaction type (sales or rentals) OR status
    if (status === "sales") {
      filtered = filtered.filter((t) => t.transactionType === "sales");
    } else if (status === "rentals") {
      filtered = filtered.filter((t) => t.transactionType === "rentals");
    } else if (status !== "all") {
      // Filter by actual status (completed, pending, cancelled, etc.)
      filtered = filtered.filter((t) => t.status === status);
    }

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

    // Use the dedicated offline sales filter function with current offlineSales state
    applyFiltersAndSortToSales(offlineSales, search, status, sort);
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
      case "verified":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
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

  // Calculate caution fee from transaction items
  const getCautionFee = (transaction: Transaction): number => {
    // Only rentals have caution fees
    if (transaction.transactionType !== 'rentals') return 0;
    
    if (!transaction.items || transaction.items.length === 0) return 0;
    
    // Sum caution fees from rental items
    return transaction.items.reduce((sum, item) => {
      // Caution fee is typically stored in item data or calculate from item
      // For now, fetch from item's cautionFee field if available
      return sum + (item.cautionFee || 0);
    }, 0);
  };

  // Calculate caution fee for offline sales
  const getOfflineCautionFee = (sale: OfflineSale): number => {
    // Only rentals have caution fees
    if (sale.transactionType !== 'rentals') return 0;
    
    if (!sale.items || sale.items.length === 0) return 0;
    
    // Sum caution fees from rental items
    return sale.items.reduce((sum, item) => {
      return sum + (item.cautionFee || 0);
    }, 0);
  };

  const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = filteredTransactions.length;
  const totalOfflineSales = filteredSales.reduce((sum: number, s) => sum + s.total, 0);
  const totalOfflineSalesCount = filteredSales.length;
  const totalOfflineVAT = filteredSales.reduce((sum: number, s) => sum + (s.vat || 0), 0);

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

  // Calculate totals for transactions
  const totalTransactionSales = filteredTransactions
    .filter(t => t.transactionType === 'sales')
    .reduce((sum: number, t) => sum + (t.amount || 0), 0);
  
  const totalTransactionRentals = filteredTransactions
    .filter(t => t.transactionType === 'rentals')
    .reduce((sum: number, t) => sum + (t.amount || 0), 0);
  
  const totalTransactionVAT = filteredTransactions.reduce((sum: number, t) => sum + (t.vat || 0), 0);

  // Calculate REVENUE (minus VAT) for online sales and rentals
  const onlineSalesRevenue = filteredTransactions
    .filter(t => t.transactionType === 'sales')
    .reduce((sum: number, t) => sum + ((t.amount || 0) - (t.vat || 0)), 0);
  
  const onlineRentalsRevenue = filteredTransactions
    .filter(t => t.transactionType === 'rentals')
    .reduce((sum: number, t) => sum + ((t.amount || 0) - (t.vat || 0)), 0);

  // Calculate totals for offline sales
  const offlineSalesOnly = filteredSales.filter(s => s.transactionType === 'sales');
  const offlineRentalsOnly = filteredSales.filter(s => s.transactionType === 'rentals');
  const totalOfflineSalesAmount = offlineSalesOnly.reduce((sum: number, s) => sum + (s.total || 0), 0);
  const totalOfflineRentalsAmount = offlineRentalsOnly.reduce((sum: number, s) => sum + (s.total || 0), 0);
  const totalOfflineVATAmount = filteredSales.reduce((sum: number, s) => sum + (s.vat || 0), 0);
  
  // Calculate Offline Revenue (Sales + Rentals + VAT)
  const offlineRevenue = totalOfflineSalesAmount + totalOfflineRentalsAmount + totalOfflineVATAmount;

  return (
    <div className="space-y-6">
      {/* Orders Tab Content - Only shown when not in offlineTab mode */}
      {!offlineTab && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Sales Card */}
            <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Total Online Sales</p>
                <ArrowDownLeft className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                ₦{totalTransactionSales.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-2">From {filteredTransactions.filter(t => t.transactionType === 'sales').length} transactions</p>
            </div>

            {/* Total Rentals Card */}
            <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Total Online Rentals</p>
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">
                ₦{totalTransactionRentals.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-2">From {filteredTransactions.filter(t => t.transactionType === 'rentals').length} transactions</p>
            </div>

            {/* Online VAT Card */}
            <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Total Online VAT</p>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-orange-600">
                ₦{totalTransactionVAT.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-2">7.5% VAT on all transactions</p>
            </div>

            {/* Online Revenue Card (Sales + Rentals + VAT) */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Online Revenue</p>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600">
                ₦{(onlineSalesRevenue + onlineRentalsRevenue + totalTransactionVAT).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-2">Sales + Rentals + VAT</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
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
                <option value="cancelled">Cancelled</option>                <option value="sales">Sales</option>
                <option value="rentals">Rentals</option>              </select>

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
                      <th className="text-center px-6 py-4 font-semibold text-gray-900 text-sm">Type</th>
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
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            transaction.transactionType === 'rentals'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.transactionType === 'rentals' ? '🎪 Rental' : '🛒 Sale'}
                          </span>
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
              <strong>📊 Transaction History:</strong> This page shows all incoming and outgoing transactions including orders, payments, and other financial activities.
            </p>
          </div>
        </div>
      )}

      {/* Offline Sales Tab - Only shown when in offlineTab mode */}
      {offlineTab && (
        <div className="space-y-6">
          {/* Add Sale Button */}
          {/* Summary Cards for Offline Sales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Total Offline Sales */}
            <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Total Offline Sales</p>
                <ArrowDownLeft className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                ₦{totalOfflineSalesAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">From {offlineSalesOnly.length} sales transactions</p>
            </div>

            {/* Total Offline Rentals */}
            <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Total Offline Rentals</p>
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ₦{totalOfflineRentalsAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">From {offlineRentalsOnly.length} rental transactions</p>
            </div>

            {/* Offline VAT Card */}
            <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Offline VAT</p>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">
                ₦{totalOfflineVATAmount
                  .toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">7.5% VAT on all offline transactions</p>
            </div>

            {/* Offline Revenue Card (Sales + Rentals + VAT) */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Offline Revenue</p>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ₦{offlineRevenue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Sales + Rentals + VAT</p>
            </div>
          </div>

          {/* Filters for Offline Sales */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Filter & Search</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order #, customer name, email..."
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
                <option value="cancelled">Cancelled</option>                <option value="sales">Sales</option>
                <option value="rentals">Rentals</option>              </select>

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
                <span>Showing {filteredSales.length} of {offlineSales.length}</span>
              </div>

              {/* Add Button - Polished */}
              <button
                onClick={() => setShowAddSaleForm(true)}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-lime-500 to-emerald-500 text-white rounded-lg hover:from-lime-600 hover:to-emerald-600 transition font-semibold shadow-md hover:shadow-lg active:shadow-sm whitespace-nowrap"
              >
                <Plus className="h-5 w-5" />
                <span>Add Sale</span>
              </button>
            </div>
          </div>

          {/* Offline Sales Table */}
          {filteredSales.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">Date</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">Order #</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">Customer</th>
                      <th className="text-center px-6 py-4 font-semibold text-gray-900 text-sm">Type</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-900 text-sm">Amount</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-900 text-sm">Output VAT</th>
                      <th className="text-center px-6 py-4 font-semibold text-gray-900 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale: OfflineSale, index: number) => (
                      <tr
                        key={sale._id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(sale.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 text-sm">
                            {sale.orderNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{sale.firstName} {sale.lastName}</p>
                            <p className="text-gray-500 text-xs">{sale.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            sale.items?.[0]?.mode === 'rent' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {sale.items?.[0]?.mode === 'rent' ? '🎪 Rental' : '🛒 Sale'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-gray-900">
                            ₦{sale.subtotal.toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-orange-600">
                            ₦{(sale.vat || 0).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              sale.status
                            )}`}
                          >
                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
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
              <p className="text-gray-600 font-medium">No offline sales found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "No offline sales and rentals have been recorded yet"}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <p className="text-sm text-orange-800">
              <strong>💸 Offline Sales & Rentals (Output VAT):</strong> These are offline sales and rental transactions that create Output VAT for your business. The VAT shown here is collected from your customers and must be paid to the government.
            </p>
          </div>

          {/* Delete Error Message */}
          {deleteError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-semibold">❌ Error Deleting Order</p>
              <p className="text-red-600 text-sm mt-1">{deleteError}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Offline Sale Form Modal */}
      {showAddSaleForm && (
        <AddOfflineSaleForm
          onClose={() => setShowAddSaleForm(false)}
          onSuccess={() => {
            console.log("✅ Offline sale created, refreshing list...");
            setShowAddSaleForm(false);
            // Refresh the offline sales data
            fetchOfflineSales();
          }}
        />
      )}
    </div>
  );
}

interface AddOfflineSaleFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

function AddOfflineSaleForm({ onClose, onSuccess }: AddOfflineSaleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    amount: "",
    paymentMethod: "cash",
    type: "sale",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.firstName.trim()) throw new Error("First name is required");
      if (!formData.lastName.trim()) throw new Error("Last name is required");
      if (!formData.email.trim()) throw new Error("Email is required");
      if (!formData.amount || parseFloat(formData.amount) <= 0) throw new Error("Amount must be greater than 0");

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone || undefined,
        subtotal: parseFloat(formData.amount),
        itemDescription: formData.type === "rental" ? "Offline Rental" : "Offline Sale",
        type: formData.type, // Pass the type to the API
        paymentMethod: formData.paymentMethod,
        status: "completed",
      };

      console.log("📤 Sending offline sale data:", payload);

      const response = await fetch("/api/admin/offline-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("API Error:", data);
        throw new Error(data.error || "Failed to save offline sale");
      }

      const result = await response.json();
      console.log("✅ Offline sale created successfully:", result);

      setSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        amount: "",
        paymentMethod: "cash",
        type: "sale",
      });

      if (onSuccess) {
        console.log("📋 Calling onSuccess callback...");
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      console.error("❌ Error creating offline sale:", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseFloat(formData.amount) || 0;
  const vat = Math.round(amountNum * 0.075 * 100) / 100;
  const total = amountNum + vat;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-lime-600 to-green-600 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Record Offline Sale/Rental</h2>
            <p className="text-lime-100 text-sm mt-1">Add a new offline sales or rental transaction</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-lime-700 rounded-lg transition text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 font-semibold">✅ Offline sale recorded successfully!</p>
              <p className="text-green-600 text-sm mt-1">The sale will be included in your Output VAT calculations automatically.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-semibold">❌ Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Horizontal Layout - Customer Info Row */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              👤 Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 xxx xxxx xxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Horizontal Layout - Transaction Details Row */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              💰 Transaction Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Ex VAT) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">₦</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition"
                  disabled={loading}
                >
                  <option value="sale">Sale</option>
                  <option value="rental">Rental</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition"
                  disabled={loading}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="card">💳 Card</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="check">✓ Check</option>
                  <option value="other">❓ Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VAT (7.5%)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 font-medium">₦</span>
                  <input
                    type="text"
                    value={vat.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-orange-50 text-gray-600 font-medium"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-xl p-6 border border-lime-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Subtotal (Ex VAT)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{amountNum.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Output VAT (7.5%)</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₦{vat.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-lime-600">
                <p className="text-sm text-gray-600 mb-1 font-medium">Total Amount (Inc VAT)</p>
                <p className="text-3xl font-bold text-lime-600">
                  ₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-lime-600 to-green-600 text-white rounded-lg hover:from-lime-700 hover:to-green-700 font-semibold transition flex items-center justify-center gap-2 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  ✓ Save Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
