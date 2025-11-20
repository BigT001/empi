"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { Download, Printer, ArrowLeft } from "lucide-react";

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setInvoices(getBuyerInvoices());
  }, []);

  const handlePrintInvoice = (invoice: StoredInvoice) => {
    const html = generateProfessionalInvoiceHTML(invoice);
    const printWindow = window.open("", "", "width=1000,height=600");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

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

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      {/* No Header - Hidden */}

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 font-medium text-xs sm:text-sm md:text-base">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 md:mt-4">My Invoices</h1>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <div className="text-gray-600 mb-4">No invoices yet. Your purchase invoices will appear here.</div>
            <Link href="/" className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition text-xs sm:text-sm md:text-base">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {invoices.map((invoice) => (
              <div key={invoice.invoiceNumber} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Invoice Number</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Date</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Total Amount</p>
                    <p className="text-sm md:text-base font-bold text-lime-600">{invoice.currencySymbol}{invoice.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-3">Items</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {invoice.items.map((item) => (
                      <div key={`${item.id}-${item.mode}`} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p>{item.quantity}x {invoice.currencySymbol}{item.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handlePrintInvoice(invoice)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download
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
