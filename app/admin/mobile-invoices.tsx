"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Download, Eye, Filter } from "lucide-react";
import { AutomaticInvoiceGenerator } from "./invoices/AutomaticInvoiceGenerator";
import { ManualInvoiceGenerator } from "./invoices/ManualInvoiceGenerator";
import { SavedInvoices } from "./invoices/SavedInvoices";

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
  const [activeTab, setActiveTab] = useState<"automatic" | "manual" | "saved">("automatic");

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
      console.error(err);
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
      console.error(err);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200 px-3 overflow-x-auto flex gap-1 py-2">
        <button
          onClick={() => setActiveTab("automatic")}
          className={`px-4 py-2 font-semibold text-sm transition whitespace-nowrap rounded-t-lg ${
            activeTab === "automatic"
              ? "border-b-2 border-lime-600 text-lime-600 bg-lime-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Automatic
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-4 py-2 font-semibold text-sm transition whitespace-nowrap rounded-t-lg ${
            activeTab === "manual"
              ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`px-4 py-2 font-semibold text-sm transition whitespace-nowrap rounded-t-lg ${
            activeTab === "saved"
              ? "border-b-2 border-purple-600 text-purple-600 bg-purple-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Saved (DB)
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        {activeTab === "automatic" && <AutomaticInvoiceGenerator />}
        {activeTab === "manual" && <ManualInvoiceGenerator />}
        {activeTab === "saved" && <SavedInvoices />}
      </div>
    </div>
  );
}
