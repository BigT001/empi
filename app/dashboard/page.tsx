"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "../components/Footer";
import { InvoiceModal } from "../components/InvoiceModal";
import { ChatModal } from "../components/ChatModal";
import { CountdownTimer } from "../components/CountdownTimer";
import { useBuyer } from "../context/BuyerContext";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";
import { formatDate } from "@/lib/utils";
import { calculateMainCardTotal, generateQuantityUpdateData, generateQuantityUpdateMessageContent } from "@/lib/priceCalculations";
import { Download, ShoppingBag, Check, Truck, MapPin, Eye, FileText, Calendar, Package, DollarSign, MessageCircle, Share2, ArrowLeft, LogOut, ChevronRight, Edit3, Save, Palette, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface CustomOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state?: string;
  description: string;
  designUrl?: string;
  designUrls?: string[];
  quantity?: number;
  deliveryDate?: string;
  proposedDeliveryDate?: string;
  buyerAgreedToDate?: boolean;
  status: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  notes?: string;
  quotedPrice?: number;
  productId?: string;
  // Timer fields
  deadlineDate?: string;
  timerStartedAt?: string;
  timerDurationDays?: number;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  items?: Array<{ name: string; quantity: number; imageUrl?: string }>;
  productName?: string;
  quantity?: number;
  total: number;
  shippingType: "self" | "empi" | "standard";
  deliveryOption?: string;
  status: "pending" | "in-progress" | "ready" | "completed" | "cancelled" | "rejected" | "archived";
  createdAt: string;
  updatedAt: string;
}

export default function BuyerDashboardPage() {
  const { buyer, isHydrated, logout, updateProfile } = useBuyer();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [activeTab, setActiveTab] = useState<"invoices" | "orders" | "custom-orders" | "profile">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buyerDashboardActiveTab');
      return (saved as "invoices" | "orders" | "custom-orders" | "profile") || "invoices";
    }
    return "invoices";
  });
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [customOrderImageIndexes, setCustomOrderImageIndexes] = useState<Record<string, number>>({});
  const [expandedCustomOrder, setExpandedCustomOrder] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState<{ orderId: string; index: number } | null>(null);
  const [messageCountPerOrder, setMessageCountPerOrder] = useState<Record<string, { total: number; unread: number }>>({});
  const [pendingQuantityChange, setPendingQuantityChange] = useState<Record<string, number>>({});
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

  // Check if this is the user's first visit to the dashboard
  useEffect(() => {
    if (buyer && isHydrated) {
      const dashboardVisitKey = `dashboard_visited_${buyer.id}`;
      const hasVisited = localStorage.getItem(dashboardVisitKey);
      
      if (!hasVisited) {
        // First visit - mark it as visited
        setIsFirstVisit(true);
        localStorage.setItem(dashboardVisitKey, 'true');
      } else {
        // Subsequent visits
        setIsFirstVisit(false);
      }
    }
  }, [buyer, isHydrated]);

  useEffect(() => {
    if (selectedInvoice) {
      // Calculate actual scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      // Prevent scroll on body and html
      const htmlElement = document.documentElement;
      const bodyElement = document.body;
      
      const originalHtmlOverflow = htmlElement.style.overflow;
      const originalBodyOverflow = bodyElement.style.overflow;
      const originalHtmlPaddingRight = htmlElement.style.paddingRight;
      const originalBodyPaddingRight = bodyElement.style.paddingRight;
      
      htmlElement.style.overflow = 'hidden';
      bodyElement.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        htmlElement.style.paddingRight = `${scrollbarWidth}px`;
        bodyElement.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        htmlElement.style.overflow = originalHtmlOverflow;
        bodyElement.style.overflow = originalBodyOverflow;
        htmlElement.style.paddingRight = originalHtmlPaddingRight;
        bodyElement.style.paddingRight = originalBodyPaddingRight;
      };
    }
  }, [selectedInvoice]);

  // Scroll listener for header hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setHeaderVisible(false);
      } else {
        // Scrolling up - show header
        setHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('buyerDashboardActiveTab', activeTab);
  }, [activeTab]);

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
                bulkDiscountPercentage: inv.bulkDiscountPercentage,
                bulkDiscountAmount: inv.bulkDiscountAmount,
                subtotalAfterDiscount: inv.subtotalAfterDiscount,
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

  // Fetch custom orders for this customer
  // Function to fetch message counts for all orders
  const fetchMessageCounts = async (orders: CustomOrder[]) => {
    console.log('[Dashboard] Fetching message counts for', orders.length, 'orders');
    const messageCounts: Record<string, { total: number; unread: number }> = {};
    for (const order of orders) {
      try {
        const messagesResponse = await fetch(`/api/messages?orderId=${order._id}`);
        const messagesData = await messagesResponse.json();
        if (messagesData.messages && Array.isArray(messagesData.messages)) {
          const adminMessages = messagesData.messages.filter((msg: any) => msg.senderType === 'admin');
          const unreadAdminMessages = adminMessages.filter((msg: any) => !msg.isRead);
          messageCounts[order._id] = {
            total: adminMessages.length,
            unread: unreadAdminMessages.length
          };
          console.log(`[Dashboard] Order ${order._id}: ${unreadAdminMessages.length} unread messages`);
        }
      } catch (error) {
        console.error(`Error fetching messages for order ${order._id}:`, error);
        messageCounts[order._id] = { total: 0, unread: 0 };
      }
    }
    setMessageCountPerOrder(messageCounts);
  };

  // Poll ONLY message counts (without re-fetching orders)
  const pollMessageCounts = async () => {
    if (customOrders.length === 0) return;
    console.log('[Dashboard] Polling message counts and order data...');
    // Refresh order data to pick up any updates to quotedPrice from admin quotes
    await fetchCustomOrders();
  };

  // Fetch custom orders (full refresh - only on initial load)
  const fetchCustomOrders = async () => {
    try {
      if (!buyer?.email) return;
      
      console.log('[Dashboard] Fetching custom orders for:', buyer.email);
      const response = await fetch(`/api/custom-orders?email=${encodeURIComponent(buyer.email)}`);
      const data = await response.json();
      
      if (data.orders && Array.isArray(data.orders)) {
        // Filter to only show orders from this customer
        const customerOrders = data.orders.filter((order: CustomOrder) => order.email === buyer.email);
        console.log('[Dashboard] Got', customerOrders.length, 'orders, fetching message counts...');
        setCustomOrders(customerOrders);

        // Fetch message counts for each order
        fetchMessageCounts(customerOrders);
      }
    } catch (error) {
      console.error("[Dashboard] Error fetching custom orders:", error);
    }
  };

  // Initial load
  useEffect(() => {
    if (buyer?.email) {
      console.log('[Dashboard] Initial load - fetching custom orders and regular orders');
      const fetchAndProcess = async () => {
        // Fetch custom orders
        const customResponse = await fetch(`/api/custom-orders?email=${encodeURIComponent(buyer.email)}`);
        const customData = await customResponse.json();
        
        if (customData.orders && Array.isArray(customData.orders)) {
          const customerOrders = customData.orders.filter((order: CustomOrder) => order.email === buyer.email);
          setCustomOrders(customerOrders);
          fetchMessageCounts(customerOrders);

          // Check if there's an order query parameter (e.g., from email link)
          const params = new URLSearchParams(window.location.search);
          const orderNumber = params.get("order");
          
          if (orderNumber) {
            // Only navigate and scroll if there's a specific order in the URL
            setActiveTab("custom-orders");
            
            const matchingOrder = customerOrders.find((o: CustomOrder) => o.orderNumber === orderNumber);
            if (matchingOrder) {
              // Delay scroll to ensure DOM is updated
              setTimeout(() => {
                const orderElement = document.getElementById(`order-${matchingOrder._id}`);
                if (orderElement) {
                  orderElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 300);
            }
          }
          // If no order in URL, stay at top - don't auto-scroll
        }

        // Fetch regular orders
        const ordersResponse = await fetch(`/api/orders?email=${encodeURIComponent(buyer.email)}`);
        const ordersData = await ordersResponse.json();
        if (ordersData.orders && Array.isArray(ordersData.orders)) {
          setOrders(ordersData.orders);
        }

        // Check for delivery modal trigger from URL
        const params = new URLSearchParams(window.location.search);
        if (params.get("tab") === "orders") {
          setActiveTab("orders");
        }
      };
      
      fetchAndProcess();
    }
  }, [buyer?.email]);

  // Fetch regular orders
  const fetchOrders = async () => {
    try {
      if (!buyer?.email) return;
      
      console.log('[Dashboard] Fetching regular orders for:', buyer.email);
      const response = await fetch(`/api/orders?email=${encodeURIComponent(buyer.email)}`);
      const data = await response.json();
      
      if (data.orders && Array.isArray(data.orders)) {
        console.log('[Dashboard] Got', data.orders.length, 'regular orders');
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("[Dashboard] Error fetching regular orders:", error);
    }
  };

  // Polling for real-time message updates
  useEffect(() => {
    if (!buyer?.email) return;
    
    console.log('[Dashboard] Setting up message polling');
    
    // Handle page visibility - stop polling when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Dashboard] Tab hidden - pausing polling');
      } else {
        console.log('[Dashboard] Tab visible - resuming polling');
        // Only poll for message counts, don't refetch orders (to avoid scroll jump)
        pollMessageCounts();
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const pollingInterval = setInterval(() => {
      // Only poll when tab is visible
      if (!document.hidden) {
        console.log('[Dashboard] Polling for message updates...');
        pollMessageCounts();
      }
    }, 3000); // Poll every 3 seconds when tab is visible

    return () => {
      console.log('[Dashboard] Cleaning up polling interval');
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [buyer?.email]);

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
    <div className="min-h-screen bg-gradient-to-br from-white via-lime-50 to-green-50 text-gray-900 flex flex-col">
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:py-8 w-full mt-20 md:mt-32">
        {/* Welcome Header with Logo */}
        <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-lg sm:text-3xl font-black text-gray-900">
              {isFirstVisit ? "Welcome" : "Welcome back"}, {buyer.fullName}! 👋
            </h1>
          </div>
          <Link href="/" className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-bold transition shadow-md hover:shadow-lg whitespace-nowrap">
            <ShoppingBag className="h-5 w-5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Tab Navigation - Modern Design with Badges */}
        <div className="mb-12 bg-white rounded-2xl p-2 shadow-md flex gap-2 overflow-x-auto max-w-full">
          {[
            { id: "orders", label: "Orders", count: orders.length, color: "bg-green-50 text-green-700 border-green-300", badgeColor: "bg-green-100" },
            { id: "custom-orders", label: "Custom Orders", count: customOrders.length, color: "bg-lime-50 text-lime-700 border-lime-300", badgeColor: "bg-lime-100" },
            { id: "invoices", label: "Invoices", count: invoices.length, color: "bg-blue-50 text-blue-700 border-blue-300", badgeColor: "bg-blue-100" },
            { id: "profile", label: "Profile", count: null, color: "bg-indigo-50 text-indigo-700 border-indigo-300", badgeColor: "bg-indigo-100" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "invoices" | "orders" | "custom-orders" | "profile")}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all border-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? `${tab.color} border-current shadow-md scale-105`
                  : `${tab.color} border-transparent hover:shadow-md`
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`${tab.badgeColor} px-2 py-0.5 rounded-full text-xs font-bold ml-1`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="space-y-8">
            {/* Premium Header Section */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 rounded-3xl shadow-2xl p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full -ml-48 -mb-48"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-green-100 font-bold uppercase text-sm tracking-wider">📦 Orders</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mt-2">Track your product orders and delivery status</p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-6">You haven't placed any product orders yet.</p>
                <Link
                  href="/"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden hover:shadow-md hover:border-green-300 transition">
                    {/* Header - Status and Buyer Info */}
                    <div className={`p-3 text-white rounded-t-lg ${
                      order.status === 'completed' ? 'bg-green-600' :
                      order.status === 'ready' ? 'bg-blue-600' :
                      order.status === 'in-progress' ? 'bg-purple-600' :
                      order.status === 'pending' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    }`}>
                      <p className="text-xxxs font-bold uppercase tracking-wider opacity-90">{order.status === 'completed' ? '✓ COMPLETED' : order.status.toUpperCase()} ORDER</p>
                      <h3 className="text-xs font-black mt-1">{order.firstName} {order.lastName}</h3>
                      <p className="text-xxxs opacity-90 truncate">{order.email}</p>
                    </div>

                    {/* What They Ordered */}
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-1">Order</p>
                      <p className="text-xs font-bold text-green-700 line-clamp-2">{order.items?.[0]?.name || 'Product'}</p>
                    </div>

                    {/* Product Images */}
                    {order.items && order.items.length > 0 && (
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-2">Images</p>
                        <div className="flex gap-2 flex-wrap">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="w-14 h-14 bg-gray-200 rounded border border-gray-300 flex items-center justify-center overflow-hidden hover:border-green-400 transition cursor-pointer"
                              onClick={() => setImageModalOpen({ orderId: order._id, index: idx })}
                            >
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity and Price */}
                    <div className="p-3 grid grid-cols-2 gap-2 border-b border-gray-100">
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-0.5">Qty</p>
                        <p className="text-lg font-black text-green-700">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 1}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-0.5">Total</p>
                        <p className="text-lg font-black text-green-700 line-clamp-1">₦{(order.total || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-3 flex gap-2">
                      <button
                        onClick={() => setChatModalOpen(order._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition text-xs"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="space-y-8">
            {/* Premium Header Section */}
            <div className="bg-gradient-to-r from-lime-600 via-green-600 to-lime-700 rounded-3xl shadow-2xl p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full -ml-48 -mb-48"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-lime-100 font-bold uppercase text-sm tracking-wider">📋 Invoice Management</p>
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
                          <tr className="bg-gradient-to-r from-lime-50 via-green-50 to-lime-50 border-b-2 border-lime-200">
                            <th className="px-8 py-4 text-left font-black text-lime-900 uppercase text-xs tracking-wider">Invoice #</th>
                            <th className="px-8 py-4 text-left font-black text-lime-900 uppercase text-xs tracking-wider">Date</th>
                            <th className="px-8 py-4 text-center font-black text-lime-900 uppercase text-xs tracking-wider">Items</th>
                            <th className="px-8 py-4 text-right font-black text-lime-900 uppercase text-xs tracking-wider">Amount</th>
                            <th className="px-8 py-4 text-center font-black text-lime-900 uppercase text-xs tracking-wider">Status</th>
                            <th className="px-8 py-4 text-center font-black text-lime-900 uppercase text-xs tracking-wider">Action</th>
                          </tr>
                        </thead>
                      <tbody>
                        {invoices.map((invoice, index) => (
                          <tr
                            key={invoice.invoiceNumber}
                            className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-lime-50/60 hover:to-green-50/60 transition group"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-700">#{index + 1}</span>
                                </div>
                                <span className="font-black text-gray-900 group-hover:text-lime-600 transition">{invoice.invoiceNumber}</span>
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

        {/* CUSTOM ORDERS TAB */}
        {activeTab === "custom-orders" && (
          <div className="space-y-8">


            {customOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
                <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-6">You haven't placed any custom orders yet.</p>
                <Link
                  href="/custom-costumes"
                  className="inline-block bg-lime-600 hover:bg-lime-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                  Order a Custom Costume
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {customOrders.map((order) => {
                  const messageCount = messageCountPerOrder[order._id] || { total: 0, unread: 0 };
                  
                  return (
                    <div key={order._id} className="bg-white rounded-lg shadow-sm border border-lime-200 overflow-hidden hover:shadow-md hover:border-lime-300 transition">
                      {/* Header - Status and Buyer Info */}
                      <div className={`p-3 text-white rounded-t-lg ${
                        order.status === 'completed' ? 'bg-lime-600' :
                        order.status === 'ready' ? 'bg-blue-600' :
                        order.status === 'in-progress' ? 'bg-purple-600' :
                        order.status === 'approved' ? 'bg-green-600' :
                        order.status === 'pending' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}>
                        <p className="text-xxxs font-bold uppercase tracking-wider opacity-90">{order.status === 'completed' ? '✓ COMPLETED' : order.status.toUpperCase()} CUSTOM ORDER</p>
                        <h3 className="text-xs font-black mt-1">{order.fullName}</h3>
                        <p className="text-xxxs opacity-90 truncate">{order.email}</p>
                      </div>

                      {/* What They Ordered */}
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-1">Order</p>
                        <p className="text-xs font-bold text-lime-700 line-clamp-2">{order.description || 'Custom Order'}</p>
                      </div>

                      {/* Design Images */}
                      {order.designUrls && order.designUrls.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                          <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-2">Design Images</p>
                          <div className="flex gap-2 flex-wrap">
                            {order.designUrls.slice(0, 3).map((url, idx) => (
                              <div
                                key={idx}
                                className="w-14 h-14 bg-gray-200 rounded border border-gray-300 flex items-center justify-center overflow-hidden hover:border-lime-400 transition cursor-pointer"
                                onClick={() => setImageModalOpen({ orderId: order._id, index: idx })}
                              >
                                <img src={url} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quantity and Price */}
                      <div className="p-3 grid grid-cols-2 gap-2 border-b border-gray-100">
                        <div className="bg-gray-50 p-2 rounded border border-gray-100">
                          <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-0.5">Qty</p>
                          <p className="text-lg font-black text-lime-700">{order.quantity || 1}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-100">
                          <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-0.5">Quote</p>
                          <p className="text-lg font-black text-lime-700 line-clamp-1">₦{order.quotedPrice ? Math.round(calculateMainCardTotal(order)).toLocaleString() : 'Pending'}</p>
                        </div>
                      </div>

                      {/* Status Details */}
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-xxxs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Details</p>
                        <div className="space-y-1 text-xxxs">
                          <p><span className={`inline-block px-1.5 py-0.5 rounded text-xxxs font-bold ${
                            order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            order.status === "approved" ? "bg-green-100 text-green-700" :
                            order.status === "in-progress" ? "bg-purple-100 text-purple-700" :
                            order.status === "ready" ? "bg-blue-100 text-blue-700" :
                            order.status === "completed" ? "bg-gray-100 text-gray-700" :
                            "bg-red-100 text-red-700"
                          }`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
                          {order.buyerAgreedToDate && order.proposedDeliveryDate && (
                            <p className="text-gray-600">📆 Delivery: {new Date(order.proposedDeliveryDate).toLocaleDateString()}</p>
                          )}
                          {messageCount.total > 0 && (
                            <p className="text-lime-600 font-semibold">💬 {messageCount.total} messages</p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-3 flex gap-2">
                        <button
                          onClick={() => setChatModalOpen(order._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded font-bold transition text-xs relative"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Chat
                          {messageCount.unread > 0 && (
                            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xxxs font-bold">
                              {messageCount.unread > 9 ? '9+' : messageCount.unread}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6 md:space-y-8">
            {/* ACCOUNT OWNER CARD */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
                <div className="flex-1">
                  <p className="text-blue-100 text-xs md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2">👤 Account Owner</p>
                  <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black mb-1 md:mb-2 leading-tight break-words">{buyer?.fullName}</h2>
                  <p className="text-blue-100 text-xs sm:text-sm md:text-base font-semibold break-all">{buyer?.email}</p>
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
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg border-2 border-lime-100 bg-gradient-to-br from-white to-lime-50/20 p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-black bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent mb-6\">Contact Information</h3>
              
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

      {/* Image Modal */}
      {imageModalOpen && customOrders && (() => {
        const order = customOrders.find(o => o._id === imageModalOpen.orderId);
        if (!order) return null;
        
        const images = (order.designUrls && order.designUrls.length > 0) 
          ? order.designUrls 
          : order.designUrl ? [order.designUrl] : [];
        
        const currentImage = images[imageModalOpen.index];

        return (
          <>
            {/* Backdrop - Simple transparent overlay */}
            <div
              className="fixed inset-0 bg-black/40 z-50 flex flex-col items-center justify-center p-3 md:p-6"
              onClick={() => setImageModalOpen(null)}
            >
              {/* Modal Container - Prevents close on internal clicks */}
              <div
                className="relative w-full h-auto max-h-[90vh] flex flex-col items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setImageModalOpen(null)}
                  className="absolute top-0 right-0 z-20 bg-white hover:bg-gray-100 text-gray-900 rounded-full p-2 transition shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image Container with Navigation Arrows */}
                <div className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center group">
                  {/* Main Image */}
                  <img
                    src={currentImage}
                    alt={`Design ${imageModalOpen.index + 1}`}
                    className="w-full h-full object-contain max-w-full max-h-full"
                  />

                  {/* Left Arrow */}
                  {images.length > 1 && (
                    <button
                      onClick={() => setImageModalOpen({
                        orderId: imageModalOpen.orderId,
                        index: imageModalOpen.index === 0 ? images.length - 1 : imageModalOpen.index - 1
                      })}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 md:p-3 rounded-lg transition shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
                      title="Previous image"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Right Arrow */}
                  {images.length > 1 && (
                    <button
                      onClick={() => setImageModalOpen({
                        orderId: imageModalOpen.orderId,
                        index: imageModalOpen.index === images.length - 1 ? 0 : imageModalOpen.index + 1
                      })}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 md:p-3 rounded-lg transition shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
                      title="Next image"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Image Counter */}
                  <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    {imageModalOpen.index + 1} / {images.length}
                  </div>
                </div>

                {/* Thumbnail Strip - Bottom */}
                {images.length > 1 && (
                  <div className="w-full flex gap-2 justify-center overflow-x-auto pb-2 mt-4 px-2">
                    {images.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setImageModalOpen({ orderId: imageModalOpen.orderId, index })}
                        className={`flex-shrink-0 rounded-lg overflow-hidden border-3 transition transform hover:scale-110 ${
                          imageModalOpen.index === index
                            ? "border-lime-400 ring-2 ring-lime-400"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-16 w-16 md:h-20 md:w-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* Chat Modal */}
      {chatModalOpen && buyer && (
        <ChatModal
          isOpen={!!chatModalOpen}
          onClose={async () => {
            setChatModalOpen(null);
            // Mark messages as read and refresh data when modal closes
            const customOrder = customOrders.find(o => o._id === chatModalOpen);
            if (customOrder) {
              try {
                // Immediately clear the count for this order
                setMessageCountPerOrder(prev => ({
                  ...prev,
                  [customOrder._id]: { ...prev[customOrder._id], unread: 0 }
                }));
                // Mark all unread messages as read
                await fetch(`/api/messages?orderId=${customOrder._id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' }
                });
                console.log(`[Dashboard] ✅ Marked messages as read for order ${customOrder._id}`);
                
                // Refetch custom orders to get updated delivery date after buyer agreement
                setTimeout(() => {
                  fetchCustomOrders();
                }, 100);
              } catch (err) {
                console.error('Error marking messages as read:', err);
              }
            }
          }}
          onMessageSent={() => {
            // Refresh message counts when message is sent
            const customOrder = customOrders.find(o => o._id === chatModalOpen);
            if (customOrder) {
              fetchMessageCounts([customOrder]);
            }
          }}
          order={customOrders.find(o => o._id === chatModalOpen) || (orders.find(o => o._id === chatModalOpen) as any)}
          userEmail={buyer.email}
          userName={buyer.fullName}
          isAdmin={false}
          adminName="Empi Costumes"
        />
      )}

      <Footer />
    </div>
  );
}
