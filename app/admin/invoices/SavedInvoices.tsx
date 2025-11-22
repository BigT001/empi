"use client";

import { useState, useEffect } from "react";
import { Trash2, Eye, Download, Printer, Filter } from "lucide-react";

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

export function SavedInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'automatic' | 'manual'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setInvoices(invoices.map(inv =>
          inv._id === invoiceId ? { ...inv, status: newStatus as any } : inv
        ));
      }
    } catch (err) {
      console.error("Error updating invoice:", err);
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open("", "", "width=900,height=700");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice { max-width: 900px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #22c55e; padding-bottom: 15px; }
            .header h1 { color: #22c55e; margin: 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-section h3 { margin: 0 0 10px 0; font-size: 12px; color: #666; font-weight: bold; }
            .info-section p { margin: 5px 0; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; }
            .items td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .totals { text-align: right; margin-bottom: 20px; }
            .totals p { margin: 5px 0; }
            .total-amount { font-size: 18px; font-weight: bold; color: #22c55e; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>EMPI - Invoice</h1>
              <p>Invoice #${invoice.invoiceNumber}</p>
            </div>

            <div class="info-grid">
              <div class="info-section">
                <h3>INVOICE TO:</h3>
                <p>${invoice.customerName}</p>
                <p>${invoice.customerEmail}</p>
                <p>${invoice.customerPhone}</p>
              </div>
              <div class="info-section">
                <h3>INVOICE DETAILS:</h3>
                <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ''}
                <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
              </div>
            </div>

            <table class="items">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${invoice.currencySymbol}${item.price.toFixed(2)}</td>
                    <td style="text-align: right;">${invoice.currencySymbol}${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <p><strong>Subtotal:</strong> ${invoice.currencySymbol}${invoice.subtotal.toFixed(2)}</p>
              <p><strong>Shipping:</strong> ${invoice.shippingCost === 0 ? 'FREE' : `${invoice.currencySymbol}${invoice.shippingCost.toFixed(2)}`}</p>
              <p><strong>Tax:</strong> ${invoice.currencySymbol}${invoice.taxAmount.toFixed(2)}</p>
              <p class="total-amount"><strong>Total:</strong> ${invoice.currencySymbol}${invoice.totalAmount.toFixed(2)}</p>
            </div>

            <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
              Thank you for your business! For inquiries, contact: support@empi.com
            </p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const html = `Invoice #${invoice.invoiceNumber} - ${invoice.customerName}`;
    const blob = new Blob([html], { type: "text/html" });
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
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center mb-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Invoice #</p>
                  <p className="font-bold text-gray-900">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Customer</p>
                  <p className="font-medium text-gray-900 line-clamp-1">{invoice.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Date</p>
                  <p className="text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Type</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${typeColors[invoice.type]}`}>
                    {invoice.type}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Status</p>
                  <select
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(invoice._id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${statusColors[invoice.status]}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-semibold">Total</p>
                  <p className="text-lg font-bold text-lime-600">
                    {invoice.currencySymbol}{invoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                  </p>
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
                  onClick={() => handleDeleteInvoice(invoice._id, invoice.invoiceNumber)}
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
                  <p><strong>Type:</strong> <span className={`px-2 py-1 rounded text-xs font-semibold ${typeColors[selectedInvoice.type]}`}>{selectedInvoice.type}</span></p>
                  <p><strong>Date:</strong> {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[selectedInvoice.status]}`}>{selectedInvoice.status}</span></p>
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
                          <td className="px-3 py-2 text-right">{selectedInvoice.currencySymbol}${(item.quantity * item.price).toFixed(2)}</td>
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
                  <span className="font-semibold">{selectedInvoice.currencySymbol}{selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-semibold">{selectedInvoice.shippingCost === 0 ? 'FREE' : `${selectedInvoice.currencySymbol}${selectedInvoice.shippingCost.toFixed(2)}`}</span>
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
