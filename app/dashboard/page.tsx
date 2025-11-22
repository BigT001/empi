"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useBuyer } from "../context/BuyerContext";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { Download, Printer, ShoppingBag, Check, Truck, MapPin, Eye, FileText } from "lucide-react";

export default function BuyerDashboardPage() {
  const { buyer, isHydrated } = useBuyer();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "invoices">("overview");
  const router = useRouter();

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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Welcome back, {buyer.fullName}! 👋</h1>
          <p className="text-gray-600 text-lg">Manage your profile, view orders, and download your invoices</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === "overview"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Dashboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === "invoices"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices ({invoices.length})
            </div>
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl shadow-md border border-lime-200 p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Full Name</p>
                  <p className="text-xl font-bold text-gray-900">{buyer.fullName}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Email Address</p>
                  <p className="text-lg font-bold text-gray-900 break-all">{buyer.email}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Phone Number</p>
                  <p className="text-xl font-bold text-gray-900">{buyer.phone}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Member Since</p>
                  <p className="text-xl font-bold text-gray-900">{new Date(buyer.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Account Status</p>
                  <p className="text-lg font-bold text-green-600 flex items-center gap-2">
                    <Check className="h-5 w-5" /> Active
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-2">Total Orders</p>
                    <p className="text-4xl font-bold text-lime-600">{invoices.length}</p>
                  </div>
                  <ShoppingBag className="h-12 w-12 text-lime-200" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-2">Total Spent</p>
                    <p className="text-4xl font-bold text-blue-600">₦{invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}</p>
                  </div>
                  <FileText className="h-12 w-12 text-blue-200" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-2">Avg. Order Value</p>
                    <p className="text-3xl font-bold text-purple-600">
                      ₦{invoices.length > 0 ? (invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length).toLocaleString("en-NG", { maximumFractionDigits: 0 }) : "0"}
                    </p>
                  </div>
                  <Printer className="h-12 w-12 text-purple-200" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-2">Last Order</p>
                    <p className="text-lg font-bold text-gray-900">
                      {invoices.length > 0
                        ? new Date(invoices[0].invoiceDate).toLocaleDateString()
                        : "No orders"}
                    </p>
                  </div>
                  <Download className="h-12 w-12 text-gray-200" />
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            {invoices.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className="text-lime-600 hover:text-lime-700 font-semibold flex items-center gap-2"
                  >
                    View All <Eye className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {invoices.slice(0, 3).map((invoice) => (
                    <div
                      key={invoice.invoiceNumber}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Order #{invoice.orderNumber}</p>
                        <p className="text-sm text-gray-600">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lime-600">₦{invoice.totalAmount.toLocaleString("en-NG")}</p>
                        <p className="text-xs text-gray-600">{invoice.items.length} item(s)</p>
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
          <div className="space-y-6">
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
              <div className="space-y-6">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.invoiceNumber}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Receipt Header */}
                    <div className="bg-gradient-to-r from-lime-600 to-lime-700 text-white p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">Invoice</h3>
                          <p className="text-lime-100">#{invoice.invoiceNumber}</p>
                          <p className="text-xs text-lime-100 mt-2">Order: #{invoice.orderNumber}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                          <Check className="h-5 w-5" />
                          <span className="font-semibold">PAID</span>
                        </div>
                      </div>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-6 space-y-6">
                      {/* Date and Shipping */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Invoice Date</p>
                          <p className="font-semibold text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                        </div>
                        {invoice.shippingMethod && (
                          <div>
                            <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Delivery Method</p>
                            <div className="flex items-center gap-2">
                              {invoice.shippingMethod === "empi" ? (
                                <Truck className="h-5 w-5 text-blue-600" />
                              ) : (
                                <MapPin className="h-5 w-5 text-blue-600" />
                              )}
                              <p className="font-semibold text-gray-900">
                                {invoice.shippingMethod === "empi" ? "EMPI Delivery" : "Self Pickup"}
                              </p>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Items</p>
                          <p className="font-semibold text-gray-900">{invoice.items.length} item(s)</p>
                        </div>
                      </div>

                      {/* Items Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-700 mb-3 uppercase">Items Ordered</p>
                        <div className="space-y-2">
                          {invoice.items.map((item) => (
                            <div key={`${item.id}-${item.mode}`} className="flex justify-between items-start text-sm">
                              <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                {invoice.currencySymbol}{(item.quantity * item.price).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Subtotal</span>
                          <span className="font-semibold text-gray-900">
                            {invoice.currencySymbol}{(invoice.totalAmount - (invoice.shippingCost || 0)).toFixed(2)}
                          </span>
                        </div>
                        {invoice.shippingCost !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              Shipping ({invoice.shippingMethod === "empi" ? "EMPI" : "Pickup"})
                            </span>
                            <span className="font-semibold text-gray-900">
                              {invoice.shippingCost === 0 ? "FREE" : `${invoice.currencySymbol}${invoice.shippingCost.toFixed(2)}`}
                            </span>
                          </div>
                        )}
                        <div className="pt-3 border-t-2 border-gray-300 flex justify-between text-base font-bold">
                          <span className="text-gray-900">Total Amount</span>
                          <span className="text-lime-600">{invoice.currencySymbol}{invoice.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      {(invoice.customerEmail || invoice.customerPhone) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-blue-900 mb-2 uppercase">Customer Information</p>
                          {invoice.customerEmail && (
                            <p className="text-sm text-blue-800">📧 Email: {invoice.customerEmail}</p>
                          )}
                          {invoice.customerPhone && (
                            <p className="text-sm text-blue-800 mt-1">📱 Phone: {invoice.customerPhone}</p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handlePrintInvoice(invoice)}
                          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex-1 sm:flex-none"
                        >
                          <Printer className="h-5 w-5" />
                          Print Receipt
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition flex-1 sm:flex-none"
                        >
                          <Download className="h-5 w-5" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
