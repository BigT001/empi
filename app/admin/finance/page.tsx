"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";

// Mobile components
const MobileFinancePage = dynamic(() => import("../mobile-finance"), { ssr: false });
import MobileAdminLayout from "../mobile-layout";

export default function FinancePage() {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show mobile view on small screens
  if (isMobile) {
    return (
      <MobileAdminLayout>
        <MobileFinancePage />
      </MobileAdminLayout>
    );
  }

  const financialData = [
    { label: "Total Revenue", value: "$12,450.50", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Sales", value: "156", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Rental Income", value: "$3,240.75", icon: TrendingUp, color: "text-lime-600", bg: "bg-lime-50" },
    { label: "Pending Payouts", value: "$2,100.00", icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const recentTransactions = [
    { id: 1, type: "Sale", product: "Classic Vampire Cape", amount: "$49.00", date: "Nov 14, 2024", status: "Completed" },
    { id: 2, type: "Rental", product: "Witch Hat Deluxe", amount: "$6.99", date: "Nov 14, 2024", status: "Active" },
    { id: 3, type: "Sale", product: "Medieval Knight Armor", amount: "$199.00", date: "Nov 13, 2024", status: "Completed" },
    { id: 4, type: "Rental", product: "Fairy Costume Set", amount: "$11.99", date: "Nov 13, 2024", status: "Completed" },
    { id: 5, type: "Sale", product: "Pirate Captain Outfit", amount: "$79.00", date: "Nov 12, 2024", status: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
              <p className="text-sm text-gray-600">Track your revenue and transactions</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 mx-auto max-w-7xl px-6 py-12 w-full">
          {/* Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {financialData.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`${item.bg} rounded-2xl p-6 border border-gray-200 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">{item.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{item.value}</p>
                    </div>
                    <Icon className={`h-12 w-12 ${item.color} opacity-20`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts & Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Overview</h2>
              <div className="h-64 bg-gradient-to-br from-lime-50 to-gray-50 rounded-xl flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  📊 Chart visualization coming soon
                  <br />
                  <span className="text-sm">Integration with chart library required</span>
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h2>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">$79.50</p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-lime-600 mt-1">3.2%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Count</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">124</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.type === "Sale"
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{transaction.product}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{transaction.amount}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{transaction.date}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.status === "Completed"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
    </div>
  );
}
