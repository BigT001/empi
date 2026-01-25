"use client";

import { useState, useEffect } from "react";
import { Trash2, Eye, Download, Printer, Filter } from "lucide-react";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: 'automatic' | 'manual';
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  totalAmount: number;
  currency: string;
  currencySymbol: string;
  invoiceDate: string;
  dueDate?: string;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
}

interface ConfirmDialog {
  isOpen: boolean;
  invoiceId?: string;
  currentStatus?: string;
  newStatus?: string;
  invoiceNumber?: string;
}

export function SavedInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'automatic' | 'manual'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({ isOpen: false });
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [filterType, filterStatus]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      let url = "/api/invoices?";
      if (filterType !== 'all') url += `type=${filterType}&`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;

      const response = await fetch(url);
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!confirm(`Delete invoice ${invoiceNumber}?`)) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setInvoices(invoices.filter(inv => inv._id !== invoiceId));
        console.log(`✅ Invoice deleted: ${invoiceNumber}`);
      } else {
        alert("Failed to delete invoice");
      }
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Error deleting invoice");
    }
  };

  const handleStatusChange = (invoiceId: string, invoiceNumber: string, currentStatus: string, newStatus: string) => {
    // If status hasn't changed, don't do anything
    if (currentStatus === newStatus) return;

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      invoiceId,
      currentStatus,
      newStatus,
      invoiceNumber,
    });
  };

  const confirmStatusChange = async () => {
    if (!confirmDialog.invoiceId || !confirmDialog.newStatus) return;

    setUpdatingInvoiceId(confirmDialog.invoiceId);
    try {
      const response = await fetch(`/api/invoices/${confirmDialog.invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirmDialog.newStatus }),
      });

      if (response.ok) {
        setInvoices(invoices.map(inv =>
          inv._id === confirmDialog.invoiceId ? { ...inv, status: confirmDialog.newStatus as any } : inv
        ));
        // Update selected invoice if it's open
        if (selectedInvoice && selectedInvoice._id === confirmDialog.invoiceId) {
          setSelectedInvoice({ ...selectedInvoice, status: confirmDialog.newStatus as any });
        }
        console.log(`✅ Invoice ${confirmDialog.invoiceNumber} status updated to ${confirmDialog.newStatus}`);
      } else {
        alert("Failed to update invoice status");
      }
    } catch (err) {
      console.error("Error updating invoice status:", err);
      alert("Error updating invoice status");
    } finally {
      setUpdatingInvoiceId(null);
      setConfirmDialog({ isOpen: false });
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    // Use the professional invoice HTML template for printing
    const professionalHtml = generateProfessionalInvoiceHTML(invoice as any);
    const printWindow = window.open("", "", "width=1200,height=800");
    if (!printWindow) return;
    
    printWindow.document.write(professionalHtml);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Generate the professional invoice HTML
    const professionalHtml = generateProfessionalInvoiceHTML(invoice as any);
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

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const typeColors = {
    automatic: 'bg-lime-50 text-lime-700',
    manual: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Invoices</h2>
          <p className="text-sm text-gray-600 mt-1">Database-stored invoices from all sources</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Invoice #, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Stats</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">No invoices found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or create a new invoice</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <div key={invoice._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg hover:border-lime-300 transition-all">
              {/* Card Header */}
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base">{invoice.invoiceNumber}</p>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${typeColors[invoice.type]}`}>
                    {invoice.type}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="font-semibold text-gray-900 text-sm mb-1">{invoice.customerName}</p>
                <p className="text-xs text-gray-600 truncate">{invoice.customerEmail}</p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Date</p>
                  <p className="text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-semibold">Items</p>
                  <p className="text-gray-900">{invoice.items.length}</p>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-gradient-to-r from-lime-50 to-lime-100 rounded-lg p-3 mb-3 border border-lime-200">
                <p className="text-xs text-lime-700 font-semibold mb-1">Amount</p>
                <p className="text-xl font-bold text-lime-600">
                  {invoice.currencySymbol}{invoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                </p>
              </div>

              {/* Status & Actions */}
              <div className="space-y-2">
                {invoice.type === 'manual' && (
                  <select
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(invoice._id, invoice.invoiceNumber, invoice.status, e.target.value)}
                    disabled={updatingInvoiceId === invoice._id}
                    className={`w-full px-2 py-2 rounded text-xs font-semibold border-0 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${statusColors[invoice.status]}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                )}
                {invoice.type === 'automatic' && (
                  <div className={`w-full px-2 py-2 rounded text-xs font-semibold text-center ${statusColors['paid']}`}>
                    Paid (Automatic)
                  </div>
                )}
                
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => setSelectedInvoice(invoice)}
                    className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded text-xs transition"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handlePrintInvoice(invoice)}
                    className="flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-600 p-2 rounded text-xs transition"
                    title="Print"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded text-xs transition"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(invoice._id, invoice.invoiceNumber)}
                    className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded text-xs transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal - Professional Design */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl my-4 max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0">
              <h3 className="text-lg font-bold text-gray-900">Invoice Preview</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Professional Invoice Embedded */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              <iframe
                srcDoc={generateProfessionalInvoiceHTML(selectedInvoice as any)}
                className="w-full h-full border-0 rounded-lg bg-white"
                title={`Invoice ${selectedInvoice.invoiceNumber}`}
                style={{ minHeight: "600px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Status Change */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
              <h3 className="text-lg font-bold">Confirm Status Change</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to change the status of invoice <span className="font-bold">{confirmDialog.invoiceNumber}</span>?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[confirmDialog.currentStatus as any] || 'bg-gray-100 text-gray-800'}`}>
                    {confirmDialog.currentStatus?.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-center mb-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-600">New Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[confirmDialog.newStatus as any] || 'bg-gray-100 text-gray-800'}`}>
                    {confirmDialog.newStatus?.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">This action will update the invoice status in the system.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={() => setConfirmDialog({ isOpen: false })}
                disabled={updatingInvoiceId !== null}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updatingInvoiceId !== null}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingInvoiceId ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
