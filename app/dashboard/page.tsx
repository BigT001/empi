"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { InvoiceModal } from "../components/InvoiceModal";
import { useBuyer } from "../context/BuyerContext";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { formatDate } from "@/lib/utils";
import { Download, ShoppingBag, Check, Truck, MapPin, Eye, FileText, Calendar, Package, DollarSign, MessageCircle, Share2, ArrowLeft, LogOut, ChevronRight, Edit3, Save } from "lucide-react";


export default function BuyerDashboardPage() {
  const { buyer, isHydrated, logout, updateProfile } = useBuyer();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<"invoices" | "profile">("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
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

  useEffect(() => {
    if (selectedInvoice) {
      // Calculate actual scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      // Prevent scroll on html element
      const originalOverflow = document.documentElement.style.overflow;
      const originalPaddingRight = document.documentElement.style.paddingRight;
      
      document.documentElement.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        document.documentElement.style.overflow = originalOverflow;
        document.documentElement.style.paddingRight = originalPaddingRight;
      };
    }
  }, [selectedInvoice]);

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
                cautionFee: inv.cautionFee,
                subtotalWithCaution: inv.subtotalWithCaution,
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
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />

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
                  <div className="relative overflow-x-auto group">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 md:hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mr-4">→ Scroll right</span>
                    </div>
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
                                onClick={() => setShareMenuOpen(shareMenuOpen === invoice.invoiceNumber ? null : invoice.invoiceNumber)}
                                className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg"
                                title="Share invoice"
                              >
                                <Share2 className="h-4 w-4" />
                                Share
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

        {/* SHARE MENU MODAL */}
        {shareMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setShareMenuOpen(null)}
            ></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] w-56">
              <div className="p-3 space-y-1">
                {invoices.find(inv => inv.invoiceNumber === shareMenuOpen) && (() => {
                  const invoice = invoices.find(inv => inv.invoiceNumber === shareMenuOpen)!;
                  return <>
                    {/* View Invoice */}
                    <button
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShareMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-left text-gray-700 font-semibold"
                    >
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span>View</span>
                    </button>
                    {/* WhatsApp */}
                    <button
                      onClick={() => {
                        const text = `Check out my invoice: ${invoice.invoiceNumber} from EMPI - Amount: ₦${invoice.totalAmount?.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
                        const encodedMessage = encodeURIComponent(text);
                        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                        window.open(whatsappUrl, "_blank");
                        setShareMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-left text-gray-700 font-semibold"
                    >
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span>WhatsApp</span>
                    </button>
                    {/* Download */}
                    <button
                      onClick={() => {
                        const html = generateProfessionalInvoiceHTML(invoice);
                        const blob = new Blob([html], { type: "text/html" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `Invoice-${invoice.invoiceNumber}.html`;
                        link.click();
                        URL.revokeObjectURL(url);
                        setShareMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-left text-gray-700 font-semibold"
                    >
                      <Download className="h-5 w-5 text-green-600" />
                      <span>Download</span>
                    </button>
                  </>;
                })()}
              </div>
            </div>
          </>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6 md:space-y-8">
            {/* ACCOUNT OWNER CARD */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
                <div className="flex-1">
                  <p className="text-slate-300 text-xs md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2">👤 Account Owner</p>
                  <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black mb-1 md:mb-2 leading-tight break-words">{buyer?.fullName}</h2>
                  <p className="text-slate-300 text-xs sm:text-sm md:text-base font-semibold break-all">{buyer?.email}</p>
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="flex flex-row items-center gap-2 md:gap-3 lg:gap-4 w-full lg:w-auto lg:flex-col xl:flex-row">
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center justify-center gap-1 md:gap-2 bg-white hover:bg-slate-100 text-slate-900 px-3 md:px-5 py-2 md:py-2.5 lg:py-3 rounded-lg md:rounded-xl font-bold transition shadow-lg hover:shadow-xl text-xs md:text-sm lg:text-base flex-1 lg:flex-none lg:whitespace-nowrap"
                    >
                      <Edit3 className="h-3 md:h-4 lg:h-5 w-3 md:w-4 lg:w-5" />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1 md:gap-2 text-white bg-red-600 hover:bg-red-700 font-bold transition-all duration-200 px-3 md:px-5 py-2 md:py-2.5 lg:py-3 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-xs md:text-sm lg:text-base flex-1 lg:flex-none lg:whitespace-nowrap"
                  >
                    <LogOut className="h-3 md:h-4 lg:h-5 w-3 md:w-4 lg:w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CONTACT INFORMATION CARD */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg border border-gray-200 p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-6">Contact Information</h3>
              
              {isEditingProfile ? (
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={editFormData.state}
                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={editFormData.postalCode}
                        onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                        className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-600 font-semibold text-sm md:text-base"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold transition disabled:opacity-50 text-sm md:text-base"
                    >
                      <Save className="h-4 md:h-5 w-4 md:w-5" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex items-center justify-center gap-2 flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold transition text-sm md:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-indigo-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
                    <p className="text-xs md:text-sm font-bold text-indigo-700 uppercase mb-2 md:mb-3 tracking-wider">📞 Phone</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 break-all line-clamp-2">{buyer?.phone || "—"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-violet-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
                    <p className="text-xs md:text-sm font-bold text-violet-700 uppercase mb-2 md:mb-3 tracking-wider">✉️ Email</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 break-all line-clamp-2">{buyer?.email}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-emerald-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105 sm:col-span-2 lg:col-span-2">
                    <p className="text-xs md:text-sm font-bold text-emerald-700 uppercase mb-2 md:mb-3 tracking-wider">📍 Address</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-2">{buyer?.address || "—"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-amber-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
                    <p className="text-xs md:text-sm font-bold text-amber-700 uppercase mb-2 md:mb-3 tracking-wider">🏙️ City</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">{buyer?.city || "—"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-rose-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
                    <p className="text-xs md:text-sm font-bold text-rose-700 uppercase mb-2 md:mb-3 tracking-wider">🗺️ State</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">{buyer?.state || "—"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl md:rounded-2xl p-4 md:p-5 border border-sky-200 shadow-sm hover:shadow-md transition duration-200 hover:scale-105">
                    <p className="text-xs md:text-sm font-bold text-sky-700 uppercase mb-2 md:mb-3 tracking-wider">📮 Postal</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">{buyer?.postalCode || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
