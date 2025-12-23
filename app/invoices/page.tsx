"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { useBuyer } from "../context/BuyerContext";
import { Download, Printer, ArrowLeft, Check, Truck, MapPin } from "lucide-react";

export default function MyInvoicesPage() {
  const { buyer } = useBuyer();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
    fetchInvoices();
  }, [buyer?.id]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch from database first
      let fetchUrl = '';
      
      if (buyer?.id) {
        // Logged-in user - fetch by buyerId
        fetchUrl = `/api/invoices?buyerId=${buyer.id}`;
      } else if (typeof window !== 'undefined' && localStorage.getItem('guest_email')) {
        // Guest user - fetch by email
        const guestEmail = localStorage.getItem('guest_email');
        if (guestEmail) {
          fetchUrl = `/api/invoices?email=${encodeURIComponent(guestEmail)}`;
        }
      }

      if (fetchUrl) {
        console.log('📥 Fetching invoices from database:', fetchUrl);
        const response = await fetch(fetchUrl);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Invoices fetched from database:', data.length);
          setInvoices(Array.isArray(data) ? data : []);
          return;
        }
      }
      
      // Fallback to localStorage
      console.log('⚠️ Falling back to localStorage invoices');
      setInvoices(getBuyerInvoices(buyer?.id));
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      // Fallback to localStorage on error
      setInvoices(getBuyerInvoices(buyer?.id));
    } finally {
      setIsLoading(false);
    }
  };

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

      <main className="flex-1 w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8">
            <Link href="/cart" className="inline-flex items-center gap-2 text-lime-600 hover:text-lime-700 font-medium text-xs sm:text-sm md:text-base">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              Back
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 md:mt-4">My Invoices</h1>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading your invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
              <div className="text-gray-600 mb-4">No invoices yet. Your purchase invoices will appear here.</div>
              <Link href="/" className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition text-xs sm:text-sm md:text-base">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invoices.map((invoice) => (
                <div key={invoice.invoiceNumber} className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg hover:border-lime-300 transition-all">
                  {/* Card Header */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-base">{invoice.invoiceNumber}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-lime-100 text-lime-700 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                        <Check className="h-3 w-3" />
                        Paid
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{invoice.customerEmail?.split('@')[0] || 'Customer'}</p>
                    <p className="text-xs text-gray-600 truncate">{invoice.customerEmail || 'No email'}</p>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Date</p>
                      <p className="text-gray-900 text-sm">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
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
                      {invoice.currencySymbol}{invoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePrintInvoice(invoice)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded text-xs font-semibold transition flex items-center justify-center gap-1"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-2 rounded text-xs font-semibold transition flex items-center justify-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
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
