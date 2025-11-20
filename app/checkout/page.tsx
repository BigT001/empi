"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCart } from "../components/CartContext";
import { useBuyer } from "../context/BuyerContext";
import { AuthForm } from "../components/AuthForm";
import { ShoppingBag, Check, Lock, Download, Printer, ArrowLeft } from "lucide-react";
import { createInvoiceData, saveInvoice } from "@/lib/invoiceGenerator";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { getBuyerInvoices } from "@/lib/invoiceStorage";

export default function CheckoutPage() {
  const { items, clearCart, total } = useCart();
  const { buyer, register, loginByEmail } = useBuyer();
  const [processing, setProcessing] = useState(true);
  const [done, setDone] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);
  const [orderProcessed, setOrderProcessed] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authData, setAuthData] = useState({
    email: "",
    fullName: "",
    phone: "",
  });
  const [formData, setFormData] = useState({
    fullName: "Test Customer",
    email: "customer@example.com",
    phone: "+234 8012345678",
    address: "123 Main Street",
    city: "Lagos",
    state: "Lagos",
    postalCode: "100001",
    paymentMethod: "card",
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Reset order processing when items change
  useEffect(() => {
    if (items.length === 0) {
      setOrderProcessed(false);
      setDone(false);
      setProcessing(false);
      setInvoice(null);
    }
  }, [items.length]);

  // Show auth prompt only if user is NOT logged in, prompt not dismissed, and has items
  useEffect(() => {
    if (isHydrated && items.length > 0 && !orderProcessed) {
      if (buyer) {
        // User is logged in - mark as ready to process
        setShowAuthPrompt(false);
        setAuthDismissed(true);
      } else if (!authDismissed) {
        // User is not logged in AND hasn't dismissed prompt yet - show auth prompt
        setShowAuthPrompt(true);
        setProcessing(false);
      } else {
        // Prompt was already dismissed but user still not logged in - continue as guest
        setShowAuthPrompt(false);
      }
    }
  }, [isHydrated, items.length, buyer, authDismissed, orderProcessed]);

  // Auto-process order when buyer is logged in and we have items
  useEffect(() => {
    if (buyer && items.length > 0 && !done && !orderProcessed && !showAuthPrompt && isHydrated) {
      // Auto-process the order for logged-in users
      setOrderProcessed(true);
      processOrder(buyer.email, buyer.fullName, buyer.phone);
    }
  }, [buyer, items.length, done, orderProcessed, showAuthPrompt, isHydrated]);

  const shippingCost = 2500;
  const taxEstimate = total * 0.075;
  const totalAmount = total + shippingCost + taxEstimate;

  const handleRegisterAndCheckout = async () => {
    if (!authData.email || !authData.fullName || !authData.phone) {
      alert("Please fill in all required fields");
      return;
    }

    // Register the buyer
    const newBuyer = await register({
      email: authData.email,
      fullName: authData.fullName,
      phone: authData.phone,
      address: authData.email.includes("@") ? formData.address : "",
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
    });

    setAuthDismissed(true);
    setShowAuthPrompt(false);
    
    // Process order with registered buyer
    processOrder(authData.email, authData.fullName, authData.phone);
  };

  const handleContinueAsGuest = () => {
    setAuthDismissed(true);
    processOrder(formData.email, formData.fullName, formData.phone);
  };

  const processOrder = async (email: string, fullName: string, phone: string) => {
    setShowAuthPrompt(false);
    setProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create invoice with buyer ID if logged in
    const invoiceData = createInvoiceData({
      items,
      subtotal: total,
      shippingCost,
      taxAmount: taxEstimate,
      totalAmount,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: formData.address,
      customerCity: formData.city,
      customerState: formData.state,
      customerPostalCode: formData.postalCode,
      shippingPreference: "empi",
      paymentMethod: formData.paymentMethod,
      currency: "NGN",
      currencySymbol: "₦",
    });

    // Add buyer ID if logged in
    const invoiceWithBuyer = {
      ...invoiceData,
      buyerId: buyer?.id,
    };

    // Save invoice to localStorage with buyer ID
    saveInvoice(invoiceData, buyer?.id);
    setInvoice(invoiceWithBuyer);

    // Clear cart and show success
    clearCart();
    setProcessing(false);
    setDone(true);

    console.log("✅ Invoice generated:", invoiceData.invoiceNumber);
  };

  const handlePrintInvoice = () => {
    if (!invoice) return;
    const buyerInvoices = getBuyerInvoices();
    const storedInvoice = buyerInvoices.find(inv => inv.invoiceNumber === invoice.invoiceNumber);
    if (!storedInvoice) return;
    
    const htmlContent = generateProfessionalInvoiceHTML(storedInvoice);
    const printWindow = window.open("", "", "width=1000,height=600");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoice) return;
    // Get the stored invoice from buyer storage
    const buyerInvoices = getBuyerInvoices();
    const storedInvoice = buyerInvoices.find(inv => inv.invoiceNumber === invoice.invoiceNumber);
    if (!storedInvoice) return;
    
    const htmlContent = generateProfessionalInvoiceHTML(storedInvoice);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${storedInvoice.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isHydrated) return null; // Prevent hydration mismatch

  // Empty cart screen
  if (items.length === 0 && !done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
        <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-between">
            <Header />
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full text-center">
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-16">
            <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
              <div className="bg-gray-100 rounded-full p-2 sm:p-3 md:p-4">
                <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-4 md:mb-6 text-xs sm:text-sm md:text-base">Add items to proceed with checkout.</p>
            <Link href="/" className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition text-xs sm:text-sm md:text-base">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Processing state
  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900 flex flex-col">
        <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-between">
            <Header />
          </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 w-full">
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="bg-blue-100 rounded-full p-3 md:p-4 animate-pulse">
                <Lock className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 text-blue-600">Processing Your Order...</h1>
            <p className="text-gray-600 mb-6 md:mb-8 text-xs sm:text-sm">
              Your payment is being processed. Your invoice will be generated automatically.
            </p>
            <div className="flex justify-center gap-2 mb-6 md:mb-8">
              <div className="w-2 h-2 bg-lime-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
              <div className="w-2 h-2 bg-lime-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-lime-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Order confirmation with invoice
  if (done && invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 to-green-50 text-gray-900 flex flex-col">
        <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-between">
            <Header />
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 w-full">
          {/* Success Header */}
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 mb-6 md:mb-8 text-center">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="bg-green-100 rounded-full p-3 md:p-4">
                <Check className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 text-green-600">✓ Order Confirmed!</h1>
            <p className="text-gray-600 mb-2 text-sm md:text-base">Thank you for your purchase.</p>
            <p className="text-gray-600 mb-1 text-xs sm:text-sm">Invoice: <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span></p>
            <p className="text-gray-600 mb-6 md:mb-8 text-xs sm:text-sm">Order #: <span className="font-bold text-gray-900">{invoice.orderNumber}</span></p>
          </div>

          {/* Invoice Preview */}
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 md:mb-6">Invoice</h2>

            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b-2 border-lime-600">
              <div>
                <h3 className="text-lime-600 font-bold text-lg md:text-xl">EMPI</h3>
                <p className="text-xs text-gray-600 mt-2">{invoice.companyAddress}</p>
                <p className="text-xs text-gray-600">{invoice.companyCity}, {invoice.companyState}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600"><span className="font-bold">Invoice:</span> {invoice.invoiceNumber}</p>
                <p className="text-xs text-gray-600"><span className="font-bold">Date:</span> {invoice.invoiceDate}</p>
                <p className="text-xs text-gray-600"><span className="font-bold">Status:</span> <span className="text-green-600 font-bold">✓ PAID</span></p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-700 mb-3">BILL TO:</p>
                <p className="text-sm font-semibold">{invoice.customerName}</p>
                <p className="text-xs text-gray-600">{invoice.customerAddress}</p>
                <p className="text-xs text-gray-600">{invoice.customerCity}, {invoice.customerState}</p>
                <p className="text-xs text-gray-600 mt-2">{invoice.customerEmail}</p>
                <p className="text-xs text-gray-600">{invoice.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 mb-3">SHIPPING METHOD:</p>
                <p className="text-sm font-semibold">{invoice.shippingMethod}</p>
                <p className="text-xs text-gray-600 mt-2">Est. Delivery: 3-5 business days</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left px-2 py-2 text-xs font-bold">Product</th>
                    <th className="text-center px-2 py-2 text-xs font-bold w-16">Qty</th>
                    <th className="text-right px-2 py-2 text-xs font-bold">Price</th>
                    <th className="text-right px-2 py-2 text-xs font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any) => (
                    <tr key={`${item.id}-${item.mode}`} className="border-b border-gray-200">
                      <td className="px-2 py-3 text-xs">{item.name}</td>
                      <td className="px-2 py-3 text-center text-xs">{item.quantity}</td>
                      <td className="px-2 py-3 text-right text-xs">{invoice.currencySymbol}{item.price.toLocaleString()}</td>
                      <td className="px-2 py-3 text-right text-xs font-semibold">{invoice.currencySymbol}{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-full md:w-80">
                <div className="flex justify-between text-xs mb-2 text-gray-600">
                  <span>Subtotal:</span>
                  <span>{invoice.currencySymbol}{invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mb-2 text-gray-600">
                  <span>Shipping:</span>
                  <span>{invoice.currencySymbol}{invoice.shippingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mb-4 pb-4 border-b-2 border-gray-300 text-gray-600">
                  <span>Tax (7.5%):</span>
                  <span>{invoice.currencySymbol}{invoice.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-lime-600">
                  <span>Total Amount:</span>
                  <span>{invoice.currencySymbol}{invoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 border-t border-gray-200">
              <button
                onClick={handlePrintInvoice}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </button>
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
            <h3 className="font-bold text-blue-900 mb-2 text-sm md:text-base">What happens next?</h3>
            <ul className="text-xs md:text-sm text-blue-800 space-y-1">
              <li>✓ A confirmation email will be sent to {invoice.customerEmail}</li>
              <li>✓ Your invoice has been saved and can be printed or downloaded anytime</li>
              <li>✓ Items will be prepared and shipped within 24-48 hours</li>
              <li>✓ You'll receive a tracking number via email when shipped</li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block bg-lime-600 hover:bg-lime-700 text-white font-semibold px-6 py-3 rounded-lg transition text-sm md:text-base text-center"
            >
              Continue Shopping
            </Link>
            <Link
              href="/cart"
              className="inline-block border-2 border-lime-600 text-lime-600 hover:bg-lime-50 font-semibold px-6 py-3 rounded-lg transition text-sm md:text-base text-center"
            >
              View Cart
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Auth prompt modal
  if (showAuthPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
        <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
          <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-between">
            <Header />
          </div>
        </header>

        {/* Auth Modal Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AuthForm 
            onSuccessfulAuth={(buyer) => {
              setAuthDismissed(true);
              setShowAuthPrompt(false);
            }}
            onCancel={handleContinueAsGuest}
          />
        </div>
      </div>
    );
  }

  return null;
}

