"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { getAdminInvoices, deleteAdminInvoice, clearAdminInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { Trash2, Eye } from "lucide-react";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setInvoices(getAdminInvoices());
  }, []);

  const handleDeleteInvoice = (invoiceNumber: string) => {
    if (!confirm(`Delete invoice ${invoiceNumber}?`)) return;
    deleteAdminInvoice(invoiceNumber);
    setInvoices(invoices.filter(inv => inv.invoiceNumber !== invoiceNumber));
  };

  const handleClearAll = () => {
    if (!confirm("Clear all invoices? This cannot be undone.")) return;
    clearAdminInvoices();
    setInvoices([]);
  };

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      {/* No Header - Hidden */}

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Invoice Management</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Invoices: {invoices.length}</p>
          </div>
          <button
            onClick={handleClearAll}
            disabled={invoices.length === 0}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm"
          >
            Clear All
          </button>
        </div>

        {/* Invoice Stats */}
        {invoices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-600 font-semibold">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-lime-600">
                {invoices[0]?.currencySymbol || "₦"}
                {invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-600 font-semibold">Total Orders</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">{invoices.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-600 font-semibold">Avg. Order Value</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600">
                {invoices[0]?.currencySymbol || "₦"}
                {(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Invoice List */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <p className="text-gray-600 mb-4">No invoices yet. They will appear here when customers complete their first purchase.</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {invoices.map((invoice) => (
              <div key={invoice.invoiceNumber} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4 md:mb-6">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Invoice #</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Order #</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{invoice.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Customer</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">{invoice.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Date</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Total</p>
                    <p className="text-sm md:text-base font-bold text-lime-600">{invoice.currencySymbol}{invoice.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Items ({invoice.items.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {invoice.items.map((item) => (
                      <div key={`${item.id}-${item.mode}`} className="text-xs p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-gray-600">{item.quantity}x {invoice.currencySymbol}{item.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-4 pb-4 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-xs">
                    <p className="font-semibold text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900">{invoice.customerEmail}</p>
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-gray-600 mb-1">Phone</p>
                    <p className="text-gray-900">{invoice.customerPhone}</p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mb-4 pb-4 border-b border-gray-200 text-xs">
                  <p className="font-semibold text-gray-600 mb-2">Order Summary</p>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-gray-900">{invoice.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping ({invoice.shippingMethod}):</span>
                      <span className="font-semibold text-gray-900">{invoice.currencySymbol}{invoice.shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (7.5%):</span>
                      <span className="font-semibold text-gray-900">{invoice.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lime-600 pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>{invoice.currencySymbol}{invoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

