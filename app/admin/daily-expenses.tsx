"use client";

import { useState, useEffect } from "react";
import { TrendingDown, Filter, Search, Trash2, Loader, Plus } from "lucide-react";

interface DailyExpenseProps {
  onAddExpenseClick?: () => void;
}

interface DailyExpense {
  _id: string;
  description: string;
  category: string;
  vendorName: string;
  amount: number;
  vat: number;
  isVATApplicable: boolean; // New: Track VAT applicability
  status: string;
  date: string;
  receiptNumber: string;
  notes?: string;
}

export default function DailyExpenses({ onAddExpenseClick }: DailyExpenseProps) {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/offline-expenses");
      
      if (!response.ok) throw new Error("Failed to fetch expenses");
      
      const data = await response.json();
      console.log("📥 [Daily Expenses] Raw API response:", JSON.stringify(data, null, 2));
      
      const expenseList = data.data || [];
      console.log(`📊 Loaded ${expenseList.length} daily expenses`);
      console.log("📋 Expense list:", expenseList);
      
      setExpenses(expenseList);
      
      // Apply filters
      filterAndSort(expenseList, searchTerm, categoryFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort expenses
  const filterAndSort = (
    expenseList: DailyExpense[],
    search: string,
    category: string
  ) => {
    let filtered = [...expenseList];

    if (search.trim()) {
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(search.toLowerCase()) ||
          expense.vendorName.toLowerCase().includes(search.toLowerCase()) ||
          expense.receiptNumber.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== "all") {
      filtered = filtered.filter((expense) => expense.category === category);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredExpenses(filtered);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterAndSort(expenses, value, categoryFilter);
  };

  // Handle category filter
  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    filterAndSort(expenses, searchTerm, value);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/offline-expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete expense");

      setExpenses(expenses.filter((e) => e._id !== id));
      filterAndSort(
        expenses.filter((e) => e._id !== id),
        searchTerm,
        categoryFilter
      );
      console.log("✅ Expense deleted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  // Load expenses on mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVAT = filteredExpenses.reduce((sum, e) => sum + (e.isVATApplicable ? e.vat : 0), 0);
  const totalExpensesWithVAT = totalAmount + totalVAT; // Total Expenses = Amount + VAT
  const vatExemptCount = filteredExpenses.filter(e => !e.isVATApplicable).length;

  const categories = ["supplies", "utilities", "maintenance", "transportation", "other"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-lime-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-700 font-medium">Error: {error}</p>
        <button
          onClick={() => fetchExpenses()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Total Expenses</p>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            ₦{totalExpensesWithVAT.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Input VAT</p>
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            ₦{totalVAT.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            7.5% from {filteredExpenses.filter(e => e.isVATApplicable).length} applicable expenses
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">VAT-Exempt</p>
            <TrendingDown className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {vatExemptCount}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Expenses with no VAT
          </p>
        </div>

      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by description, vendor, or receipt..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {onAddExpenseClick && (
            <button
              onClick={onAddExpenseClick}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Receipt #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    VAT Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    VAT Amount
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {expense.receiptNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {expense.vendorName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right">
                      ₦{expense.amount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {expense.isVATApplicable ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          ✅ Applicable
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          ❌ No VAT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-orange-600">
                      ₦{expense.vat.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">
                      {new Date(expense.date).toLocaleDateString("en-NG")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(expense._id)}
                        disabled={deletingId === expense._id}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete expense"
                      >
                        {deletingId === expense._id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No expenses found</p>
          <p className="text-sm text-gray-500 mt-1">
            {searchTerm || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first daily expense to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
