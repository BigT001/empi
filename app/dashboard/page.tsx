"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useBuyer } from "../context/BuyerContext";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { formatDate } from "@/lib/utils";
import { Download, Printer, ShoppingBag, Check, Truck, MapPin, Eye, FileText, X, Calendar, Package, DollarSign, MessageCircle, Share2, ArrowLeft, LogOut, ChevronRight, Edit3, Save } from "lucide-react";


export default function BuyerDashboardPage() {
  const { buyer, isHydrated, logout, updateProfile } = useBuyer();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<"invoices" | "profile">("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Logout function
  const handleLogout = () => {
    console.log("🔐 Logging out user...");
    logout();
    localStorage.removeItem("buyerInvoices");
    localStorage.removeItem("empi_shipping_option");
    localStorage.removeItem("empi_pending_payment");
    localStorage.removeItem("empi_cart");
    router.push("/auth");
  };

  // Initialize edit form with buyer data
  useEffect(() => {
    if (buyer && isEditingProfile) {
      setEditFormData({
        fullName: buyer.fullName || "",
        phone: buyer.phone || "",
        address: buyer.address || "",
        city: buyer.city || "",
        state: buyer.state || "",
        postalCode: buyer.postalCode || "",
      });
    }
  }, [buyer, isEditingProfile]);

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!buyer) return;
    
    setIsSaving(true);
    try {
      // Update buyer profile in context
      updateProfile({
        ...buyer,
        ...editFormData,
      });

      // Also update in the API
      await fetch(`/api/buyers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: buyer.id,
          ...editFormData,
        }),
      });

      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isHydrated && !buyer) {
      router.push("/auth");
    }
  }, [buyer, isHydrated, router]);

  useEffect(() => {
    if (buyer?.id) {
      setInvoices(getBuyerInvoices(buyer.id));
    }
  }, [buyer?.id]);

  // Fetch invoices from MongoDB
  useEffect(() => {
    if (buyer?.id) {
      const fetchInvoices = async () => {
        try {
          // Fetch only this user's invoices by passing their buyerId
          const response = await fetch(`/api/invoices?type=automatic&buyerId=${buyer.id}`);
          const data = await response.json();
          
          if (Array.isArray(data)) {
            const convertedInvoices = data.map((inv: any) => {
              // Ensure invoiceDate is valid
              let invoiceDate = inv.invoiceDate;
              if (invoiceDate) {
                // If it's a string (ISO), keep it
                if (typeof invoiceDate === 'string') {
                  // Validate it's a valid ISO date
                  const testDate = new Date(invoiceDate);
                  if (isNaN(testDate.getTime())) {
                    invoiceDate = new Date().toISOString();
                  }
                } else {
                  // If it's anything else, convert to ISO
                  invoiceDate = new Date(invoiceDate).toISOString();
                }
              } else {
                invoiceDate = new Date().toISOString();
              }

              return {
                invoiceNumber: inv.invoiceNumber,
                orderNumber: inv.orderNumber,
                customerName: inv.customerName,
                customerEmail: inv.customerEmail,
                customerPhone: inv.customerPhone,
                subtotal: inv.subtotal || 0,
                shippingCost: inv.shippingCost || 0,
                taxAmount: inv.taxAmount || 0,
                totalAmount: inv.totalAmount || 0,
                items: inv.items || [],
                invoiceDate: invoiceDate,
                currencySymbol: inv.currencySymbol || '₦',
                shippingMethod: 'empi',
              };
            });
            setInvoices(convertedInvoices);
          }
        } catch (error) {
          console.error("Error fetching invoices:", error);
        }
      };
      fetchInvoices();
    }
  }, [buyer?.id]);

  const handleDownloadInvoice = async (invoice: StoredInvoice) => {
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const html = generateProfessionalInvoiceHTML(invoice);
      const element = document.createElement('div');
      element.innerHTML = html;
      
      const opt = {
        margin: 5,
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { 
          orientation: 'portrait' as const, 
          unit: 'mm' as const, 
          format: 'a4' as const,
          compress: true
        },
        pagebreak: { mode: 'avoid-all' as const, before: '.page-break' }
      };
      
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Fallback to HTML download
      const html = generateProfessionalInvoiceHTML(invoice);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoice.invoiceNumber}.html`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePrintInvoice = (invoice: StoredInvoice) => {
    const html = generateProfessionalInvoiceHTML(invoice);
    const printWindow = window.open("", "", "");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Add slight delay to ensure content loads before printing
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (!isHydrated) return null;
  if (!buyer) return null;

  const totalSpent = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-between">
          <Header />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Welcome Header with Logo */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-black text-gray-900">
                Welcome back, {buyer.fullName}! 👋
              </h1>
              <p className="text-gray-600 text-base">Your invoice management dashboard</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Modern Pills */}
        <div className="flex gap-4 mb-12">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-6 py-3 font-bold transition rounded-full flex items-center gap-2 ${
              activeTab === "invoices"
                ? "bg-gradient-to-r from-lime-600 to-green-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <FileText className="h-5 w-5" />
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 font-bold transition rounded-full flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-gradient-to-r from-lime-600 to-green-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <MapPin className="h-5 w-5" />
            Profile
          </button>
        </div>

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="space-y-8">
            {/* Premium Header Section */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -ml-48 -mb-48"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-blue-200 font-bold uppercase text-sm tracking-wider">📋 Invoice Management</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mt-2">View, manage and download all your purchase invoices</p>
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
                {/* Premium Invoice Table */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-slate-200">
                          <th className="px-8 py-4 text-left font-black text-slate-900 uppercase text-xs tracking-wider">Invoice #</th>
                          <th className="px-8 py-4 text-left font-black text-slate-900 uppercase text-xs tracking-wider">Date</th>
                          <th className="px-8 py-4 text-center font-black text-slate-900 uppercase text-xs tracking-wider">Items</th>
                          <th className="px-8 py-4 text-right font-black text-slate-900 uppercase text-xs tracking-wider">Amount</th>
                          <th className="px-8 py-4 text-center font-black text-slate-900 uppercase text-xs tracking-wider">Status</th>
                          <th className="px-8 py-4 text-center font-black text-slate-900 uppercase text-xs tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice, index) => (
                          <tr
                            key={invoice.invoiceNumber}
                            className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-lime-50 hover:to-green-50 transition group"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-700">#{index + 1}</span>
                                </div>
                                <span className="font-black text-gray-900 group-hover:text-lime-700 transition">{invoice.invoiceNumber}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-gray-600 font-medium">{formatDate(invoice.invoiceDate)}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 text-sm">
                                {invoice.items.length}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <span className="font-black text-lg text-green-600">₦{invoice.totalAmount?.toLocaleString("en-NG", { maximumFractionDigits: 0 }) || "0"}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                <Check className="h-4 w-4" />
                                PAID
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <button
                                onClick={() => setSelectedInvoice(invoice)}
                                className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg group-hover:scale-105"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 rounded-3xl shadow-lg p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-lime-100 text-sm font-bold uppercase tracking-wider mb-2">Account Owner</p>
                  <h2 className="text-4xl md:text-5xl font-black mb-2">{buyer?.fullName}</h2>
                  <p className="text-lime-100 text-lg">{buyer?.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 bg-white hover:bg-lime-50 text-lime-600 px-6 py-3 rounded-xl font-bold transition shadow-lg"
                    >
                      <Edit3 className="h-5 w-5" />
                      Edit Profile
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-white hover:bg-red-600 font-bold transition-all duration-200 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-0.5"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Contact Information</h3>
              
              {isEditingProfile ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={editFormData.state}
                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={editFormData.postalCode}
                        onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex items-center justify-center gap-2 flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-8 py-3 rounded-xl font-bold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <p className="text-sm font-bold text-gray-600 uppercase mb-2">📞 Phone</p>
                    <p className="text-xl font-bold text-gray-900">{buyer?.phone || "Not provided"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <p className="text-sm font-bold text-gray-600 uppercase mb-2">✉️ Email</p>
                    <p className="text-lg font-bold text-gray-900 break-all">{buyer?.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 md:col-span-2">
                    <p className="text-sm font-bold text-gray-600 uppercase mb-2">📍 Address</p>
                    <p className="text-lg font-bold text-gray-900">{buyer?.address || "Not provided"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <p className="text-sm font-bold text-gray-600 uppercase mb-2">🏙️ City</p>
                    <p className="text-lg font-bold text-gray-900">{buyer?.city || "Not provided"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <p className="text-sm font-bold text-gray-600 uppercase mb-2">🗺️ State</p>
                    <p className="text-lg font-bold text-gray-900">{buyer?.state || "Not provided"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <p className="text-sm font-bold text-gray-600 uppercase mb-2">📮 Postal Code</p>
                    <p className="text-lg font-bold text-gray-900">{buyer?.postalCode || "Not provided"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* INVOICE MODAL - CLEAN & PROFESSIONAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-gray-200">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-lime-600 via-green-600 to-emerald-600 text-white p-8 sticky top-0 z-10 flex items-center justify-between rounded-t-3xl shadow-lg">
              <div className="flex items-center gap-4">
                <img 
                  src="/logo/EMPI-2k24-LOGO-1.PNG" 
                  alt="EMPI Logo" 
                  className="h-14 w-auto object-contain"
                />
                <div>
                  <p className="text-lime-100 text-sm font-bold uppercase tracking-wider">Order Details</p>
                  <p className="text-white mt-1 text-base font-semibold">Order #{selectedInvoice.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-full transition hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-8 space-y-6">
              {/* INFO CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-2 tracking-wider">📅 Date</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(selectedInvoice.invoiceDate)}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-sm hover:shadow-md transition">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-2 tracking-wider">📦 Items</p>
                  <p className="text-lg font-bold text-gray-900">{selectedInvoice.items.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-green-200 shadow-sm hover:shadow-md transition">
                  <p className="text-xs font-bold text-green-600 uppercase mb-2 tracking-wider">✅ Status</p>
                  <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                    <Check className="h-5 w-5" /> Paid
                  </p>
                </div>
                <div className="bg-gradient-to-br from-lime-100 to-green-100 rounded-2xl p-5 border border-lime-300 shadow-sm">
                  <p className="text-xs font-bold text-lime-700 uppercase mb-2 tracking-wider">💰 Total</p>
                  <p className="text-xl font-black text-lime-700">{selectedInvoice.currencySymbol}{selectedInvoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              {/* CUSTOMER INFO */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm">👤</div>
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200 shadow-sm hover:shadow-md transition">
                    <p className="text-xs font-bold text-purple-700 uppercase mb-2 tracking-wider">Name</p>
                    <p className="text-base font-bold text-gray-900">{selectedInvoice.customerName}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-2 tracking-wider">Email</p>
                    <p className="text-sm font-semibold text-gray-900 break-all">{selectedInvoice.customerEmail}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200 shadow-sm hover:shadow-md transition">
                    <p className="text-xs font-bold text-green-700 uppercase mb-2 tracking-wider">Phone</p>
                    <p className="text-base font-bold text-gray-900">{selectedInvoice.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center text-white text-sm">📋</div>
                  Order Items
                </h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                        <th className="text-left px-6 py-4 font-black text-sm">Product</th>
                        <th className="text-center px-6 py-4 font-black text-sm">Qty</th>
                        <th className="text-right px-6 py-4 font-black text-sm">Price</th>
                        <th className="text-right px-6 py-4 font-black text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={`${selectedInvoice.invoiceNumber}-item-${idx}`} className="border-t border-gray-200 hover:bg-gradient-to-r hover:from-lime-50 hover:to-green-50 transition">
                          <td className="px-6 py-4 text-gray-900 font-semibold">{item.name}</td>
                          <td className="text-center px-6 py-4 text-gray-900 font-bold">{item.quantity}</td>
                          <td className="text-right px-6 py-4 text-gray-900 font-semibold">{selectedInvoice.currencySymbol}{(item.price).toLocaleString("en-NG", { maximumFractionDigits: 2 })}</td>
                          <td className="text-right px-6 py-4 font-black text-lime-600">{selectedInvoice.currencySymbol}{(item.quantity * item.price).toLocaleString("en-NG", { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="max-w-sm ml-auto">
                <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl p-6 border border-lime-300 shadow-md space-y-4">
                  <h4 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider">💰 Price Breakdown</h4>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-lime-200">
                    <span className="text-gray-700 font-semibold">Subtotal</span>
                    <span className="font-bold text-gray-900">{selectedInvoice.currencySymbol}{selectedInvoice.subtotal.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</span>
                  </div>
                  
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-lime-200">
                      <span className="text-gray-700 font-semibold">Tax</span>
                      <span className="font-bold text-gray-900">{selectedInvoice.currencySymbol}{selectedInvoice.taxAmount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  {selectedInvoice.shippingCost && selectedInvoice.shippingCost > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-lime-200">
                      <span className="text-gray-700 font-semibold">Shipping</span>
                      <span className="font-bold text-gray-900">{selectedInvoice.currencySymbol}{selectedInvoice.shippingCost.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-lime-300 flex justify-between items-center bg-white rounded-xl p-3">
                    <span className="font-black text-gray-900">TOTAL</span>
                    <span className="text-3xl font-black bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">{selectedInvoice.currencySymbol}{selectedInvoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    const message = `Invoice #${selectedInvoice.invoiceNumber}\nOrder #${selectedInvoice.orderNumber}\nTotal: ${selectedInvoice.currencySymbol}${selectedInvoice.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}\n\nView your invoice for details.`;
                    const encodedMessage = encodeURIComponent(message);
                    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold transition flex-1 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <Printer className="h-5 w-5" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-6 py-3 rounded-xl font-bold transition flex-1 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <X className="h-5 w-5" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
