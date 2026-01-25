"use client";

import { useState, useEffect } from "react";
import { getAdminInvoices, deleteAdminInvoice, clearAdminInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { Trash2, Eye, Download, Printer } from "lucide-react";

export function AutomaticInvoiceGenerator() {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    setIsLoading(true);
    try {
      setInvoices(getAdminInvoices());
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handlePrintInvoice = (invoice: StoredInvoice) => {
    // Use the professional invoice HTML template for printing
    const professionalHtml = generateProfessionalInvoiceHTML(invoice);
    const printWindow = window.open("", "", "width=1200,height=800");
    if (!printWindow) return;
    printWindow.document.write(professionalHtml);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleDownloadInvoice = (invoice: StoredInvoice) => {
    // Generate the professional invoice HTML
    const professionalHtml = generateProfessionalInvoiceHTML(invoice);
    const blob = new Blob([professionalHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${invoice.invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Auto-Generated Invoices</h2>
          <p className="text-sm text-gray-600 mt-1">Invoices automatically created from customer orders</p>
        </div>
        <button
          onClick={handleClearAll}
          disabled={invoices.length === 0}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
        >
          Clear All
        </button>
      </div>

      {/* Stats */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 font-semibold">Total Revenue</p>
            <p className="text-xl md:text-2xl font-bold text-lime-600">
              {invoices[0]?.currencySymbol || "₦"}
              {invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 font-semibold">Total Orders</p>
            <p className="text-xl md:text-2xl font-bold text-blue-600">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 font-semibold">Avg Order Value</p>
            <p className="text-xl md:text-2xl font-bold text-purple-600">
              {invoices[0]?.currencySymbol || "₦"}
              {(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* Invoices List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">No auto-generated invoices yet</p>
          <p className="text-sm text-gray-500">Invoices will appear here as customers place orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.invoiceNumber} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Invoice #</p>
                  <p className="font-bold text-gray-900">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Customer</p>
                  <p className="font-medium text-gray-900">{invoice.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Date</p>
                  <p className="text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Items</p>
                  <p className="font-medium text-gray-900">{invoice.items.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-semibold">Total</p>
                  <p className="text-lg font-bold text-lime-600">{invoice.currencySymbol}{invoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedInvoice(invoice)}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-semibold text-sm transition"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => handlePrintInvoice(invoice)}
                  className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-2 rounded-lg font-semibold text-sm transition"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  onClick={() => handleDownloadInvoice(invoice)}
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-lg font-semibold text-sm transition"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}
                  className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg font-semibold text-sm transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Customer Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedInvoice.customerName}</p>
                  <p><strong>Email:</strong> {selectedInvoice.customerEmail}</p>
                  <p><strong>Phone:</strong> {selectedInvoice.customerPhone}</p>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3">Invoice Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}</p>
                  <p><strong>Order #:</strong> {selectedInvoice.orderNumber}</p>
                  <p><strong>Date:</strong> {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <span className="text-green-600 font-semibold">PAID</span></p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{selectedInvoice.currencySymbol}{item.price.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">{selectedInvoice.currencySymbol}{(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-lime-50 rounded-lg p-4 border border-lime-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{selectedInvoice.currencySymbol}{(selectedInvoice.subtotal || selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t-2 border-lime-300 pt-2 text-base">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-lime-600">{selectedInvoice.currencySymbol}{selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
