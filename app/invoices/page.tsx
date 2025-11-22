"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { Download, Printer, ArrowLeft, Check, Truck, MapPin } from "lucide-react";

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
              <div key={invoice.invoiceNumber} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition">
                {/* Receipt Header */}
                <div className="bg-gradient-to-r from-lime-600 to-lime-700 text-white p-4 sm:p-6 md:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold">Invoice</h3>
                      <p className="text-xs md:text-sm text-lime-100 mt-1">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg">
                      <Check className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-xs md:text-sm font-semibold">PAID</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-lime-100">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>

                {/* Receipt Body */}
                <div className="p-4 sm:p-6 md:p-8 space-y-6">
                  {/* Shipping Method Section */}
                  {invoice.shippingMethod && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {invoice.shippingMethod === "empi" ? (
                          <Truck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-900 mb-1">DELIVERY METHOD</p>
                          <p className="text-sm md:text-base font-bold text-blue-900">
                            {invoice.shippingMethod === "empi" ? "EMPI Delivery" : "Self Pickup"}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            {invoice.shippingMethod === "empi" 
                              ? "Est. Delivery: 2-5 business days" 
                              : "Ready within 24 hours"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items Section */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-3 uppercase">Items Ordered</p>
                    <div className="space-y-2 pb-4 border-b border-gray-200">
                      {invoice.items.map((item) => (
                        <div key={`${item.id}-${item.mode}`} className="flex justify-between items-start text-xs md:text-sm">
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {invoice.currencySymbol}{(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-900">{invoice.currencySymbol}{invoice.subtotal?.toFixed(2) || invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    {invoice.shippingCost !== undefined && (
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-600">
                          Shipping ({invoice.shippingMethod === "empi" ? "EMPI" : "Pickup"})
                        </span>
                        <span className="font-semibold text-gray-900">
                          {invoice.shippingCost === 0 ? "FREE" : `${invoice.currencySymbol}${invoice.shippingCost.toFixed(2)}`}
                        </span>
                      </div>
                    )}
                    {invoice.taxAmount && (
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-semibold text-gray-900">{invoice.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t-2 border-gray-300 flex justify-between text-sm md:text-base font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-lime-600">{invoice.currencySymbol}{invoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {invoice.customerEmail && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Customer Info</p>
                      <p className="text-xs md:text-sm text-gray-600">Email: {invoice.customerEmail}</p>
                      {invoice.customerPhone && (
                        <p className="text-xs md:text-sm text-gray-600 mt-1">Phone: {invoice.customerPhone}</p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handlePrintInvoice(invoice)}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Printer className="h-4 w-4" />
                      Print Receipt
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
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
