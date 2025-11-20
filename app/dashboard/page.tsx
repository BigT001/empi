"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useBuyer } from "../context/BuyerContext";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { Download, Printer, ShoppingBag } from "lucide-react";

export default function BuyerDashboardPage() {
  const { buyer, isHydrated } = useBuyer();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
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
  }, [buyer]);

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

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, {buyer.fullName}! 👋</h1>
            <p className="text-gray-600">Here's your personalized shopping dashboard and order history</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-xl shadow-sm border border-lime-200 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Full Name</p>
              <p className="text-lg font-bold text-gray-900">{buyer.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Email Address</p>
              <p className="text-lg font-bold text-gray-900">{buyer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Phone Number</p>
              <p className="text-lg font-bold text-gray-900">{buyer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Member Since</p>
              <p className="text-lg font-bold text-gray-900">{new Date(buyer.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">📦 Total Orders</p>
            <p className="text-3xl font-bold text-lime-600">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">💰 Total Spent</p>
            <p className="text-3xl font-bold text-blue-600">₦{totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">📊 Avg. Order Value</p>
            <p className="text-3xl font-bold text-purple-600">
              ₦{invoices.length > 0 ? (totalSpent / invoices.length).toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">📅 Last Order</p>
            <p className="text-lg font-bold text-gray-900">
              {invoices.length > 0
                ? new Date(invoices[0].invoiceDate).toLocaleDateString()
                : "No orders yet"}
            </p>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-lime-600" />
            Your Orders
          </h2>

          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">You haven't made any purchases yet.</p>
              <Link
                href="/"
                className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.invoiceNumber}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition hover:border-lime-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Order #</p>
                      <p className="font-bold text-lg text-gray-900">{invoice.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Invoice #</p>
                      <p className="font-bold text-lg text-gray-900">{invoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Date</p>
                      <p className="font-bold text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Items</p>
                      <p className="font-bold text-gray-900">{invoice.items.length} item(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Amount</p>
                      <p className="font-bold text-lime-600 text-lg">₦{invoice.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Items:</p>
                    <div className="flex flex-wrap gap-2">
                      {invoice.items.map((item) => (
                        <span
                          key={`${item.id}-${item.mode}`}
                          className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200 transition"
                        >
                          {item.name} <span className="text-xs text-gray-600">x{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handlePrintInvoice(invoice)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                    >
                      <Printer className="h-4 w-4" />
                      Print Invoice
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
