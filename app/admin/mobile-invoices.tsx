"use client";

import { useEffect, useState } from "react";
import { Download, Eye, Filter } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: "paid" | "pending" | "overdue";
  createdAt: string;
  dueDate: string;
}

export default function MobileInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/invoices");
      if (!response.ok) throw new Error("Failed to fetch invoices");

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading invoices";
      setError(message);
      Sentry.captureException(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices =
    filterStatus === "all" ? invoices : invoices.filter((inv) => inv.status === filterStatus);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatNaira = (value: number) => {
    return `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "overdue":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return "✅";
      case "pending":
        return "⏳";
      case "overdue":
        return "⚠️";
      default:
        return "📄";
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`);
      if (!response.ok) throw new Error("Failed to download invoice");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download invoice");
      Sentry.captureException(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-lime-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600 font-semibold">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">❌ {error}</p>
          <button
            onClick={loadInvoices}
            className="px-6 py-2 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">📑 Invoices ({invoices.length})</h1>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-12 z-20 bg-white border-b border-gray-200 px-4 overflow-x-auto flex gap-2 py-3">
        {(["all", "paid", "pending", "overdue"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition whitespace-nowrap ${
              filterStatus === status
                ? "bg-lime-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            {status === "all"
              ? ` (${invoices.length})`
              : ` (${invoices.filter((inv) => inv.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      <div className="px-4 py-4 space-y-3">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice._id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">
                      Invoice #{invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(invoice.createdAt)}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {getStatusIcon(invoice.status)} {invoice.status.toUpperCase()}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                    Customer
                  </p>
                  <p className="font-semibold text-gray-900">{invoice.customerName}</p>
                  <p className="text-xs text-gray-600">{invoice.customerEmail}</p>
                </div>

                {/* Amount */}
                <div className="bg-lime-50 p-3 rounded-lg mb-3 border border-lime-200">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                    Total Amount
                  </p>
                  <p className="text-2xl font-black text-lime-600">{formatNaira(invoice.totalAmount)}</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div>
                    <p className="text-gray-600 font-semibold mb-1">Created</p>
                    <p className="text-gray-900 font-bold">{formatDate(invoice.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold mb-1">Due Date</p>
                    <p className="text-gray-900 font-bold">{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInvoice(invoice);
                    }}
                    className="flex-1 py-2 px-3 bg-lime-50 hover:bg-lime-100 text-lime-600 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadInvoice(invoice._id);
                    }}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
            <p className="text-gray-500 font-semibold">📭 No invoices</p>
            <p className="text-xs text-gray-400 mt-2">Invoices will appear here once orders are processed</p>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="font-bold text-lg">Invoice Details</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Invoice Header */}
              <div className="border-b border-gray-200 pb-4">
                <p className="text-2xl font-black text-gray-900 mb-1">
                  Invoice #{selectedInvoice.invoiceNumber}
                </p>
                <p className="text-sm text-gray-600">{formatDate(selectedInvoice.createdAt)}</p>
              </div>

              {/* Status */}
              <div
                className={`px-4 py-3 rounded-xl font-bold text-center border ${getStatusColor(
                  selectedInvoice.status
                )}`}
              >
                {getStatusIcon(selectedInvoice.status)} {selectedInvoice.status.toUpperCase()}
              </div>

              {/* Customer */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Bill To
                </p>
                <p className="font-bold text-gray-900 text-lg">{selectedInvoice.customerName}</p>
                <p className="text-sm text-gray-600">{selectedInvoice.customerEmail}</p>
              </div>

              {/* Amount */}
              <div className="bg-lime-50 p-4 rounded-xl border border-lime-200">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Total Amount Due
                </p>
                <p className="text-4xl font-black text-lime-600">{formatNaira(selectedInvoice.totalAmount)}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Issue Date
                  </p>
                  <p className="font-bold text-gray-900">{formatDate(selectedInvoice.createdAt)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Due Date
                  </p>
                  <p className="font-bold text-gray-900">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    downloadInvoice(selectedInvoice._id);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 py-4 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
