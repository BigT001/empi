"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useBuyer } from "../context/BuyerContext";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { formatDate } from "@/lib/utils";
import { Download, Printer, ShoppingBag, Check, Truck, MapPin, Eye, FileText, X, Calendar, Package, DollarSign, MessageCircle, Share2, ArrowLeft, LogOut, ChevronRight } from "lucide-react";


export default function BuyerDashboardPage() {
  const { buyer, isHydrated, logout } = useBuyer();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "invoices">("overview");
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const router = useRouter();

  // Logout function
  const handleLogout = () => {
    console.log("🔐 Logging out user...");
    // Call the logout function from context to clear buyer state and localStorage
    logout();
    // Additional cleanup
    localStorage.removeItem("buyerInvoices");
    localStorage.removeItem("empi_shipping_option");
    localStorage.removeItem("empi_pending_payment");
    localStorage.removeItem("empi_cart");
    // Redirect to auth page
    router.push("/auth");
  };

  useEffect(() => {
    if (isHydrated && !buyer) {
      router.push("/auth");
    }
  }, [buyer, isHydrated, router]);

  useEffect(() => {
    if (buyer?.id) {
      setInvoices(getBuyerInvoices(buyer.id));
    }
  }, [buyer?.id]);

  // Fetch invoices from MongoDB
  useEffect(() => {
    if (buyer?.id) {
      const fetchInvoices = async () => {
        try {
          // Fetch only this user's invoices by passing their buyerId
          const response = await fetch(`/api/invoices?type=automatic&buyerId=${buyer.id}`);
          const data = await response.json();
          
          if (Array.isArray(data)) {
            const convertedInvoices = data.map((inv: any) => {
              // Ensure invoiceDate is valid
              let invoiceDate = inv.invoiceDate;
              if (invoiceDate) {
                // If it's a string (ISO), keep it
                if (typeof invoiceDate === 'string') {
                  // Validate it's a valid ISO date
                  const testDate = new Date(invoiceDate);
                  if (isNaN(testDate.getTime())) {
                    invoiceDate = new Date().toISOString();
                  }
                } else {
                  // If it's anything else, convert to ISO
                  invoiceDate = new Date(invoiceDate).toISOString();
                }
              } else {
                invoiceDate = new Date().toISOString();
              }

              return {
                invoiceNumber: inv.invoiceNumber,
                orderNumber: inv.orderNumber,
                customerName: inv.customerName,
                customerEmail: inv.customerEmail,
                customerPhone: inv.customerPhone,
                subtotal: inv.subtotal || 0,
                shippingCost: inv.shippingCost || 0,
                taxAmount: inv.taxAmount || 0,
                totalAmount: inv.totalAmount || 0,
                items: inv.items || [],
                invoiceDate: invoiceDate,
                currencySymbol: inv.currencySymbol || '₦',
                shippingMethod: 'empi',
              };
            });
            setInvoices(convertedInvoices);
          }
        } catch (error) {
          console.error("Error fetching invoices:", error);
        }
      };
      fetchInvoices();
    }
  }, [buyer?.id]);

  const handleDownloadInvoice = (invoice: StoredInvoice) => {
    const html = generateProfessionalInvoiceHTML(invoice);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${invoice.invoiceNumber}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintInvoice = (invoice: StoredInvoice) => {
    const html = generateProfessionalInvoiceHTML(invoice);
    const printWindow = window.open("", "", "width=1000,height=600");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  if (!isHydrated) return null;
  if (!buyer) return null;

  const totalSpent = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-between">
          <Header />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Welcome Header with Logout */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
              Welcome back, {buyer.fullName}! 👋
            </h1>
            <p className="text-gray-600 text-lg">Your dashboard overview and order management</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold transition hover:-translate-y-1 bg-red-50 hover:bg-red-100 px-6 py-3 rounded-xl shadow-md hover:shadow-lg"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Tab Navigation - Modern Pills */}
        <div className="flex gap-4 mb-12">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-bold transition rounded-full flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-lime-600 to-green-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-6 py-3 font-bold transition rounded-full flex items-center gap-2 ${
              activeTab === "invoices"
                ? "bg-gradient-to-r from-lime-600 to-green-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <FileText className="h-5 w-5" />
            Invoices ({invoices.length})
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Profile Card - Enhanced */}
            <div className="bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 rounded-3xl shadow-lg border border-lime-200 p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-lime-300 opacity-5 rounded-full -mr-48 -mt-48"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-8 text-gray-900 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-lime-600 to-green-600 rounded-xl flex items-center justify-center text-white">
                    👤
                  </div>
                  Profile Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
                    <p className="text-xs text-gray-600 font-bold mb-2 uppercase tracking-wider">Full Name</p>
                    <p className="text-xl font-black text-gray-900">{buyer.fullName}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
                    <p className="text-xs text-gray-600 font-bold mb-2 uppercase tracking-wider">Email Address</p>
                    <p className="text-base font-bold text-gray-900 break-all">{buyer.email}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
                    <p className="text-xs text-gray-600 font-bold mb-2 uppercase tracking-wider">Phone Number</p>
                    <p className="text-xl font-black text-gray-900">{buyer.phone}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
                    <p className="text-xs text-gray-600 font-bold mb-2 uppercase tracking-wider">Account Status</p>
                    <p className="text-lg font-black text-green-600 flex items-center gap-2">
                      <Check className="h-5 w-5" /> Active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid - Stunning Cards */}
            <div>
              <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center text-white">
                  📊
                </div>
                Your Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Orders */}
                <div className="bg-gradient-to-br from-lime-500 to-green-600 rounded-2xl shadow-lg p-7 text-white hover:shadow-xl transition hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-lime-100 font-bold uppercase text-sm">Total Orders</p>
                    <ShoppingBag className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="text-5xl font-black">{invoices.length}</p>
                  <p className="text-lime-100 text-sm mt-2">purchases made</p>
                </div>

                {/* Total Spent */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-7 text-white hover:shadow-xl transition hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-blue-100 font-bold uppercase text-sm">Total Spent</p>
                    <DollarSign className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="text-5xl font-black">₦{invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}</p>
                  <p className="text-blue-100 text-sm mt-2">lifetime value</p>
                </div>

                {/* Avg Order Value */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-7 text-white hover:shadow-xl transition hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-purple-100 font-bold uppercase text-sm">Avg. Order</p>
                    <Package className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="text-4xl font-black">
                    ₦{invoices.length > 0 ? (invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length).toLocaleString("en-NG", { maximumFractionDigits: 0 }) : "0"}
                  </p>
                  <p className="text-purple-100 text-sm mt-2">per order</p>
                </div>

                {/* Last Order */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-7 text-white hover:shadow-xl transition hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-orange-100 font-bold uppercase text-sm">Last Order</p>
                    <Calendar className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="text-2xl font-black">
                    {invoices.length > 0
                      ? new Date(invoices[0].invoiceDate).toLocaleDateString("en-NG", { month: 'short', day: 'numeric', year: 'numeric' })
                      : "No orders"}
                  </p>
                  <p className="text-orange-100 text-sm mt-2">most recent</p>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            {invoices.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center text-white">
                      📦
                    </div>
                    Recent Orders
                  </h3>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className="text-white hover:opacity-90 font-bold flex items-center gap-2 bg-gradient-to-r from-lime-600 to-green-600 px-6 py-3 rounded-lg transition hover:shadow-lg"
                  >
                    View All <Eye className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {invoices.slice(0, 3).map((invoice, idx) => (
                    <div
                      key={invoice.invoiceNumber}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 group cursor-pointer hover:shadow-md transition"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setActiveTab("invoices");
                      }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-900">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm">#{invoice.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(invoice.invoiceDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-600 font-semibold">{invoice.items.length} items</p>
                          <p className="font-black text-gray-900">₦{invoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}</p>
                        </div>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="space-y-8">
            {invoices.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-6">You haven't made any purchases yet.</p>
                <Link
                  href="/"
                  className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Your Invoices</h2>
                  <p className="text-gray-600">Click on any invoice to view full details</p>
                </div>

                {/* Invoices Grid - 3 Columns - Clean Modern Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.invoiceNumber}
                      onClick={() => setSelectedInvoice(invoice)}
                      className="group bg-white rounded-3xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      {/* Clean Minimal Header */}
                      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Invoice #</p>
                            <p className="text-xl font-black">{invoice.invoiceNumber}</p>
                          </div>
                          <div className="inline-flex items-center gap-1 bg-lime-500 px-3 py-1 rounded-full">
                            <Check className="h-4 w-4 text-white" />
                            <span className="text-xs font-bold text-white">PAID</span>
                          </div>
                        </div>
                      </div>

                      {/* Clean Content */}
                      <div className="p-6 space-y-5">
                        {/* Order Number Row */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                          <span className="text-sm font-semibold text-gray-600">Order</span>
                          <span className="font-black text-gray-900">{invoice.orderNumber}</span>
                        </div>

                        {/* Date & Items - Simple Layout */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                          <span className="text-sm font-semibold text-gray-600">Date</span>
                          <span className="font-bold text-gray-900">{formatDate(invoice.invoiceDate)}</span>
                        </div>

                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                          <span className="text-sm font-semibold text-gray-600">Items</span>
                          <span className="font-black text-gray-900">{invoice.items.length}</span>
                        </div>

                        {/* Total Amount - Bold & Clean */}
                        <div className="pt-2">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total</p>
                          <p className="text-3xl font-black text-gray-900">{invoice.currencySymbol}{invoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* INVOICE MODAL - CLEAN & PROFESSIONAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-lime-600 to-green-600 text-white p-8 sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black">Invoice #{selectedInvoice.invoiceNumber}</h2>
                <p className="text-lime-100 mt-1">Order #{selectedInvoice.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-full transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-8 space-y-6">
              {/* INFO CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-1">Date</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(selectedInvoice.invoiceDate)}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                  <p className="text-xs font-bold text-purple-700 uppercase mb-1">Items</p>
                  <p className="text-lg font-bold text-gray-900">{selectedInvoice.items.length}</p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                  <p className="text-xs font-bold text-orange-700 uppercase mb-1">Status</p>
                  <p className="text-lg font-bold text-orange-600 flex items-center gap-1">
                    <Check className="h-5 w-5" /> Paid
                  </p>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Total</p>
                  <p className="text-xl font-black text-lime-600">{selectedInvoice.currencySymbol}{selectedInvoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              {/* CUSTOMER INFO */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-700 uppercase mb-2">Name</p>
                    <p className="text-base font-bold text-gray-900">{selectedInvoice.customerName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-700 uppercase mb-2">Email</p>
                    <p className="text-sm font-semibold text-gray-900 break-all">{selectedInvoice.customerEmail}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-700 uppercase mb-2">Phone</p>
                    <p className="text-base font-bold text-gray-900">{selectedInvoice.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4">Order Items</h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="text-left px-6 py-3 font-black text-sm">Product</th>
                        <th className="text-center px-6 py-3 font-black text-sm">Qty</th>
                        <th className="text-right px-6 py-3 font-black text-sm">Price</th>
                        <th className="text-right px-6 py-3 font-black text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={`${selectedInvoice.invoiceNumber}-item-${idx}`} className="border-t border-gray-200 hover:bg-lime-50">
                          <td className="px-6 py-3 text-gray-900 font-semibold">{item.name}</td>
                          <td className="text-center px-6 py-3 text-gray-900 font-bold">{item.quantity}</td>
                          <td className="text-right px-6 py-3 text-gray-900 font-semibold">{selectedInvoice.currencySymbol}{(item.price).toLocaleString("en-NG", { maximumFractionDigits: 2 })}</td>
                          <td className="text-right px-6 py-3 font-black text-lime-600">{selectedInvoice.currencySymbol}{(item.quantity * item.price).toLocaleString("en-NG", { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="max-w-sm ml-auto">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                    <span className="text-gray-700 font-semibold">Subtotal</span>
                    <span className="font-bold text-gray-900">{selectedInvoice.currencySymbol}{selectedInvoice.subtotal.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</span>
                  </div>
                  
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">Tax</span>
                      <span className="font-bold text-gray-900">{selectedInvoice.currencySymbol}{selectedInvoice.taxAmount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  {selectedInvoice.shippingCost && selectedInvoice.shippingCost > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">Shipping</span>
                      <span className="font-bold text-gray-900">{selectedInvoice.currencySymbol}{selectedInvoice.shippingCost.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-gray-300 flex justify-between items-center">
                    <span className="font-black text-gray-900">TOTAL</span>
                    <span className="text-2xl font-black text-lime-600">{selectedInvoice.currencySymbol}{selectedInvoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const message = `Invoice #${selectedInvoice.invoiceNumber}\nOrder #${selectedInvoice.orderNumber}\nTotal: ${selectedInvoice.currencySymbol}${selectedInvoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}\n\nView your invoice for details.`;
                    const encodedMessage = encodeURIComponent(message);
                    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1"
                >
                  <Printer className="h-5 w-5" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex items-center justify-center gap-2 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-xl font-bold transition flex-1"
                >
                  <X className="h-5 w-5" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
