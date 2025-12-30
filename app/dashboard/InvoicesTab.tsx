'use client';

import { StoredInvoice } from '@/lib/invoiceStorage';
import { Download, Eye, Share2, Check, FileText } from 'lucide-react';
import Link from 'next/link';

interface InvoicesTabProps {
  invoices: StoredInvoice[];
  onSelectInvoice: (invoice: StoredInvoice) => void;
}

interface InvoiceWithDate extends StoredInvoice {
  invoiceDate: string;
  items: Array<any>;
}

export function InvoicesTab({ invoices, onSelectInvoice }: InvoicesTabProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const generateProfessionalInvoiceHTML = (invoice: InvoiceWithDate) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { display: flex; justify-content: space-between; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; }
          .total { text-align: right; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>${invoice.invoiceNumber}</p>
        </div>
        <div class="invoice-details">
          <div><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</div>
          <div><strong>Amount:</strong> ₦${invoice.totalAmount?.toLocaleString('en-NG', { maximumFractionDigits: 0 }) || '0'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any) => `<tr><td>${item.name}</td><td>₦${item.amount?.toLocaleString() || '0'}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="total">Total: ₦${invoice.totalAmount?.toLocaleString('en-NG', { maximumFractionDigits: 0 }) || '0'}</div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-8">
      {/* Premium Header Section */}
      <div className="bg-gradient-to-r from-lime-600 via-green-600 to-lime-700 rounded-3xl shadow-2xl p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full -ml-48 -mb-48"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-lime-100 font-bold uppercase text-sm tracking-wider">
                📋 Invoice Management
              </p>
            </div>
          </div>
          <p className="text-slate-300 text-lg mt-2">
            View, manage and download all your purchase invoices
          </p>
        </div>
      </div>

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
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {invoices.map((invoice: InvoiceWithDate, index) => (
              <div
                key={invoice.invoiceNumber}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-700">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-gray-900 truncate">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(invoice.invoiceDate)}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0">
                    <Check className="h-3 w-3" />
                    PAID
                  </span>
                </div>

                <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-lg p-3 mb-4 border border-lime-100">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Total Amount</p>
                  <p className="font-black text-xl text-green-600">
                    ₦{invoice.totalAmount?.toLocaleString('en-NG', { maximumFractionDigits: 0 }) || '0'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onSelectInvoice(invoice)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold text-xs transition"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                  <button
                    onClick={() => {
                      const html = generateProfessionalInvoiceHTML(invoice);
                      const blob = new Blob([html], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Invoice-${invoice.invoiceNumber}.html`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-semibold text-xs transition"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    onClick={() => {
                      const text = `Check out my invoice: ${invoice.invoiceNumber} from EMPI - Amount: ₦${invoice.totalAmount?.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
                      const encodedMessage = encodeURIComponent(text);
                      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-semibold text-xs transition"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Card Grid View */}
          <div className="hidden md:block">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invoices.map((invoice: InvoiceWithDate, index) => (
                <div
                  key={invoice.invoiceNumber}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg hover:border-lime-300 transition-all"
                >
                  {/* Card Header */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-base">{invoice.invoiceNumber}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                        <Check className="h-3 w-3" />
                        PAID
                      </span>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Date</p>
                      <p className="text-gray-900 text-sm">{formatDate(invoice.invoiceDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 font-semibold">Items</p>
                      <p className="text-gray-900 text-sm">{invoice.items.length}</p>
                    </div>
                  </div>

                  {/* Total Amount - Highlighted */}
                  <div className="bg-gradient-to-r from-lime-50 to-lime-100 rounded-lg p-3 mb-3 border border-lime-200">
                    <p className="text-xs text-lime-700 font-semibold mb-1">Amount</p>
                    <p className="text-xl font-bold text-lime-600">
                      ₦{invoice.totalAmount?.toLocaleString('en-NG', { maximumFractionDigits: 0 }) || '0'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectInvoice(invoice)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded text-xs font-semibold transition flex items-center justify-center gap-1"
                      title="View invoice"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        const html = generateProfessionalInvoiceHTML(invoice);
                        const blob = new Blob([html], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Invoice-${invoice.invoiceNumber}.html`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-2 rounded text-xs font-semibold transition flex items-center justify-center gap-1"
                      title="Download invoice"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
