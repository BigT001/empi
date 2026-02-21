"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { InvoiceModal } from "../components/InvoiceModal";
// ChatModal removed
import { useBuyer } from "../context/BuyerContext";
import { useCurrency } from "../context/CurrencyContext";
import { getBuyerInvoices, StoredInvoice } from "@/lib/invoiceStorage";
import { ShoppingBag } from "lucide-react";
import { OrdersTab } from "./OrdersTab";
import { InvoicesTab } from "./InvoicesTab";
import { ProfileTab } from "./ProfileTab";
import { useTheme } from "../context/ThemeContext";

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
  status: "pending" | "paid" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  notes?: string;
  quotedPrice?: number;
  quoteItems?: Array<{ itemName: string; quantity: number; unitPrice: number }>;
  productId?: string;
  deadlineDate?: string;
  timerStartedAt?: string;
  timerDurationDays?: number;
  // Pricing fields from admin quote (sent directly by admin)
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAfterDiscount?: number;
  vat?: number;
  total?: number;
  createdAt: string;
  updatedAt: string;
}

interface RegularOrder {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  items: Array<{
    productId: string;
    product?: any;
    name: string;
    quantity: number;
    price: number;
    mode: 'buy' | 'rent';
    selectedSize?: string;
    imageUrl?: string;
  }>;
  status: string;
  subtotal: number;
  // CRITICAL: Add discount fields for regular orders
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAfterDiscount?: number;
  vat: number;
  total: number;
  shippingType: string;
  shippingCost: number;
  pricing?: {
    subtotal?: number;
    discount?: number;
    discountPercentage?: number;
    subtotalAfterDiscount?: number;
    tax?: number;
    total?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function BuyerDashboardPage() {
  const { buyer, isHydrated, logout, updateProfile } = useBuyer();
  const { currency, setCurrency } = useCurrency();
  const { theme } = useTheme();
  const [category, setCategory] = useState("adults");
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [regularOrders, setRegularOrders] = useState<RegularOrder[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "analytics">("orders");
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState<{ orderId: string; index: number } | null>(null);
  const [messageCountPerOrder, setMessageCountPerOrder] = useState<Record<string, { total: number; unread: number }>>({});
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

  // Check if first visit
  useEffect(() => {
    if (buyer && isHydrated) {
      const dashboardVisitKey = `dashboard_visited_${buyer.id}`;
      // Removed localStorage - always start with isFirstVisit check from server
      setIsFirstVisit(buyer ? false : true);
    }
  }, [buyer, isHydrated]);

  // Handle invoice modal scroll locking
  useEffect(() => {
    if (selectedInvoice) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
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
      }

      return () => {
        htmlElement.style.overflow = originalHtmlOverflow;
        bodyElement.style.overflow = originalBodyOverflow;
        htmlElement.style.paddingRight = originalHtmlPaddingRight;
        bodyElement.style.paddingRight = originalBodyPaddingRight;
      };
    }
  }, [selectedInvoice]);

  // Fetch message counts
  const fetchMessageCounts = async (orders: CustomOrder[]) => {
    try {
      if (!orders || orders.length === 0) {
        setMessageCountPerOrder({});
        return;
      }

      const orderIds = orders.map(o => o._id).join(',');
      const response = await fetch(`/api/messages/count?orderIds=${orderIds}`);
      const data = await response.json();

      if (data.counts && typeof data.counts === 'object') {
        setMessageCountPerOrder(data.counts);
      }
    } catch (error) {
      console.error('Error fetching message counts:', error);
    }
  };

  // Fetch custom orders
  const fetchCustomOrders = async () => {
    try {
      if (!buyer?.id && !buyer?.email) {
        return;
      }

      const queryParam = buyer?.id ? `buyerId=${buyer.id}` : `email=${buyer?.email}`;
      console.log('[Dashboard] 🔄 Fetching unified custom orders with:', queryParam);
      // Fetch from unified endpoint with orderType filter
      const response = await fetch(`/api/orders/unified?${queryParam}&orderType=custom`);
      const data = await response.json();

      if (data.orders && Array.isArray(data.orders)) {
        console.log('[Dashboard] ✅ Fetched', data.orders.length, 'custom orders');

        // Log details of each custom order
        data.orders.forEach((order: any) => {
          console.log(`[Dashboard] Custom Order: ${order.orderNumber}`, {
            requiredQuantity: order.requiredQuantity,
            designUrls: order.designUrls?.length || 0,
            quotedPrice: order.quotedPrice,
            quoteItemsCount: order.quoteItems?.length || 0,
            // CRITICAL: Log pricing/discount fields received from API
            pricing: {
              subtotal: order.subtotal,
              discountPercentage: order.discountPercentage,
              discountAmount: order.discountAmount,
              subtotalAfterDiscount: order.subtotalAfterDiscount,
              vat: order.vat,
              total: order.total,
            },
            description: order.description ? '✅' : '❌',
            firstName: order.firstName,
            email: order.email,
            city: order.city,
            status: order.status,
          });
        });

        setCustomOrders(data.orders);
        fetchMessageCounts(data.orders);
      }
    } catch (error) {
      console.error("[Dashboard] Error fetching custom orders:", error);
    }
  };

  // Fetch regular orders
  const fetchRegularOrders = async () => {
    try {
      if (!buyer?.id && !buyer?.email) {
        return;
      }

      const queryParam = buyer?.id ? `buyerId=${buyer.id}` : `email=${buyer?.email}`;
      console.log('[Dashboard] 🔄 Fetching unified regular orders with:', queryParam);
      // Fetch from unified endpoint with orderType filter
      const response = await fetch(`/api/orders/unified?${queryParam}&orderType=regular`);
      const data = await response.json();

      if (data.orders && Array.isArray(data.orders)) {
        console.log('[Dashboard] ✅ Fetched', data.orders.length, 'regular orders');

        // Log details of each regular order with pricing
        data.orders.forEach((order: any) => {
          console.log(`[Dashboard] Regular Order: ${order.orderNumber}`, {
            itemsCount: order.items?.length || 0,
            subtotal: order.subtotal,
            discountPercentage: order.discountPercentage,
            discountAmount: order.discountAmount,
            subtotalAfterDiscount: order.subtotalAfterDiscount,
            vat: order.vat,
            total: order.total,
            shippingCost: order.shippingCost,
            status: order.status,
          });
        });

        setRegularOrders(data.orders);
      }
    } catch (error) {
      console.error("[Dashboard] Error fetching regular orders:", error);
    }
  };

  // Initial load
  useEffect(() => {
    if (!buyer?.id && !buyer?.email) {
      return;
    }

    if (!isHydrated) {
      return;
    }

    const fetchAndProcess = async () => {
      try {
        const queryParam = buyer?.id ? `buyerId=${buyer.id}` : `email=${buyer?.email}`;

        // Fetch custom orders from unified endpoint
        const customResponse = await fetch(`/api/orders/unified?${queryParam}&orderType=custom`);
        const customData = await customResponse.json();

        if (customData.orders && Array.isArray(customData.orders)) {
          setCustomOrders(customData.orders);
          fetchMessageCounts(customData.orders);
        }

        // Fetch regular orders from unified endpoint
        const regularResponse = await fetch(`/api/orders/unified?${queryParam}&orderType=regular`);
        const regularData = await regularResponse.json();

        if (regularData.orders && Array.isArray(regularData.orders)) {
          setRegularOrders(regularData.orders);
        }

        const params = new URLSearchParams(window.location.search);
        const orderNumber = params.get("order");

        if (orderNumber) {
          setActiveTab("orders");

          // Check in custom orders first
          const matchingCustomOrder = customData.orders?.find((o: CustomOrder) => o.orderNumber === orderNumber);
          if (matchingCustomOrder) {
            setTimeout(() => {
              const orderElement = document.getElementById(`order-${matchingCustomOrder._id}`);
              if (orderElement) {
                orderElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
          }

          // Then check in regular orders
          const matchingRegularOrder = regularData.orders?.find((o: RegularOrder) => o.orderNumber === orderNumber);
          if (matchingRegularOrder) {
            setTimeout(() => {
              const orderElement = document.getElementById(`order-${matchingRegularOrder._id}`);
              if (orderElement) {
                orderElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching orders:', error);
      }
    };

    fetchAndProcess();
  }, [buyer?.email, isHydrated]);

  // Polling for updates - check every 3 seconds for live updates
  useEffect(() => {
    if (!buyer?.email) {
      console.log('[Dashboard] Skipping polling - no buyer email');
      return;
    }

    console.log('[Dashboard] 🔔 Starting polling for updates (every 3 seconds)');

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('[Dashboard] 👀 Page became visible - fetching updates');
        // Use unified fetch pattern to prevent duplicates
        try {
          const queryParam = buyer?.id ? `buyerId=${buyer.id}` : `email=${buyer?.email}`;

          const [customResponse, regularResponse] = await Promise.all([
            fetch(`/api/orders/unified?${queryParam}&orderType=custom`),
            fetch(`/api/orders/unified?${queryParam}&orderType=regular`)
          ]);

          const customData = await customResponse.json();
          const regularData = await regularResponse.json();

          if (customData.orders && Array.isArray(customData.orders)) {
            setCustomOrders(customData.orders);
          }

          if (regularData.orders && Array.isArray(regularData.orders)) {
            setRegularOrders(regularData.orders);
          }
        } catch (error) {
          console.error('[Dashboard] Error refreshing on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Poll every 3 seconds for faster updates
    const pollingInterval = setInterval(async () => {
      if (!document.hidden) {
        try {
          const queryParam = buyer?.id ? `buyerId=${buyer.id}` : `email=${buyer?.email}`;

          const [customResponse, regularResponse] = await Promise.all([
            fetch(`/api/orders/unified?${queryParam}&orderType=custom`),
            fetch(`/api/orders/unified?${queryParam}&orderType=regular`)
          ]);

          const customData = await customResponse.json();
          const regularData = await regularResponse.json();

          if (customData.orders && Array.isArray(customData.orders)) {
            // Deduplicate by _id to prevent showing same order twice
            const uniqueCustom = Array.from(new Map(customData.orders.map((o: CustomOrder) => [o._id, o])).values()) as CustomOrder[];
            setCustomOrders(uniqueCustom);
          }

          if (regularData.orders && Array.isArray(regularData.orders)) {
            // Deduplicate by _id to prevent showing same order twice
            const uniqueRegular = Array.from(new Map(regularData.orders.map((o: RegularOrder) => [o._id, o])).values()) as RegularOrder[];
            setRegularOrders(uniqueRegular);
          }
        } catch (error) {
          console.warn('[Dashboard] Warning during polling update:', error);
        }
      }
    }, 3000);

    return () => {
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [buyer?.email, buyer?.id]);

  // Fetch invoices
  useEffect(() => {
    if (!buyer?.email) return;

    const fetchInvoices = async () => {
      try {
        console.log('[Dashboard] ========== FETCHING INVOICES ==========');
        console.log('[Dashboard] buyer.email:', buyer.email);
        console.log('[Dashboard] buyer.id:', buyer.id || 'NOT SET (guest)');

        let fetchUrl = '';

        // Determine how to fetch invoices
        if (buyer.id) {
          // Logged-in user: fetch by buyerId
          fetchUrl = `/api/invoices?buyerId=${buyer.id}`;
          console.log('[Dashboard] Using logged-in user fetch:', fetchUrl);
        } else if (buyer.email) {
          // Guest user: fetch by email
          fetchUrl = `/api/invoices?email=${encodeURIComponent(buyer.email)}`;
          console.log('[Dashboard] Using guest fetch:', fetchUrl);
        }

        if (!fetchUrl) {
          console.log('[Dashboard] ❌ No way to identify buyer');
          setInvoices([]);
          return;
        }

        console.log('[Dashboard] 📡 Calling API:', fetchUrl);
        const response = await fetch(fetchUrl);

        if (!response.ok) {
          console.error('[Dashboard] ❌ API returned error:', response.status);
          setInvoices([]);
          return;
        }

        const data = await response.json();
        console.log('[Dashboard] ✅ Got response from API');
        console.log('[Dashboard] 📊 Number of invoices:', Array.isArray(data) ? data.length : 0);

        if (Array.isArray(data) && data.length > 0) {
          console.log('[Dashboard] First invoice details:');
          console.log('[Dashboard]   - invoiceNumber:', data[0].invoiceNumber);
          console.log('[Dashboard]   - buyerId:', data[0].buyerId);
          console.log('[Dashboard]   - customerEmail:', data[0].customerEmail);
          console.log('[Dashboard]   - totalAmount:', data[0].totalAmount);
        }

        // Convert API invoices to StoredInvoice format
        const convertedInvoices: StoredInvoice[] = (data || []).map((inv: any) => ({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          orderNumber: inv.orderNumber,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          customerName: inv.customerName,
          customerEmail: inv.customerEmail,
          customerPhone: inv.customerPhone,
          customerAddress: inv.customerAddress,
          customerCity: inv.customerCity,
          customerState: inv.customerState,
          customerPostalCode: inv.customerPostalCode,
          buyerId: inv.buyerId,
          items: inv.items || [],
          subtotal: inv.subtotal,
          shippingCost: inv.shippingCost,
          taxAmount: inv.taxAmount,
          totalAmount: inv.totalAmount,
          currency: inv.currency,
          currencySymbol: inv.currencySymbol,
          taxRate: inv.taxRate,
          type: inv.type,
          status: inv.status,
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
        }));

        console.log('[Dashboard] ✅✅✅ INVOICES SET:', convertedInvoices.length);
        setInvoices(convertedInvoices);
      } catch (error) {
        console.error('[Dashboard] ❌ Error fetching invoices:', error);
        // Fall back to localStorage
        console.log('[Dashboard] Falling back to localStorage');
        setInvoices(getBuyerInvoices(buyer.id));
      }
    };

    fetchInvoices();
  }, [buyer?.email]);

  // Load initial form data
  useEffect(() => {
    if (buyer) {
      setEditFormData({
        fullName: buyer.fullName || "",
        phone: buyer.phone || "",
        address: buyer.address || "",
        city: buyer.city || "",
        state: buyer.state || "",
        postalCode: buyer.postalCode || "",
      });
    }
  }, [buyer]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await updateProfile(editFormData);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!isHydrated) return null;
  if (!buyer) return null;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gradient-to-br from-white via-lime-50 to-green-50 text-gray-900'
      }`}>
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      {/* ChatModal removed, to be replaced */}

      <Navigation
        category={category}
        onCategoryChange={setCategory}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:py-8 w-full pt-20 sm:pt-24 md:pt-20 lg:pt-20">
        {/* Welcome Header */}
        <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-lg sm:text-3xl font-black text-gray-900 dark:text-white">
              {isFirstVisit ? "Welcome" : "Welcome back"}, {buyer.fullName}! 👋
            </h1>
          </div>
          <Link href="/" className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-bold transition shadow-md hover:shadow-lg whitespace-nowrap">
            <ShoppingBag className="h-5 w-5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <Link href="/" className="sm:hidden flex items-center justify-center gap-2 px-6 py-3 mb-6 rounded-xl bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white font-bold transition shadow-md hover:shadow-lg w-full">
          <ShoppingBag className="h-5 w-5" />
          <span>← 🛍️ Continue Shopping</span>
        </Link>

        {/* Tab Navigation */}
        <div className="mb-12 flex gap-2 sm:gap-4">
          {[
            { id: "orders", label: "Orders", count: customOrders.length + regularOrders.length, color: "text-lime-700 border-lime-300", badgeColor: "bg-lime-600 text-white" },
            { id: "profile", label: "Profile", count: null, color: "text-indigo-700 border-indigo-300", badgeColor: "bg-indigo-600 text-white" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as "orders" | "profile");
                // Removed localStorage - tab state is session-only
              }}
              className={`relative px-4 py-2.5 rounded-xl font-semibold transition-all border-2 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base ${activeTab === tab.id
                ? `${tab.color} border-current shadow-md`
                : `${tab.color} border-transparent hover:text-gray-700`
                }`}
            >
              {tab.count !== null && (
                <span className={`${tab.badgeColor} px-2 py-1 rounded-full text-xs font-bold`}>
                  {tab.count}
                </span>
              )}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <OrdersTab
            customOrders={customOrders}
            regularOrders={regularOrders}
            messageCountPerOrder={messageCountPerOrder}
            setChatModalOpen={setChatModalOpen}
            setImageModalOpen={setImageModalOpen}
          />
        )}

        {/* INVOICES TAB - HIDDEN */}
        {/* {activeTab === "invoices" && (
          <InvoicesTab
            invoices={invoices}
            onSelectInvoice={setSelectedInvoice}
          />
        )} */}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <ProfileTab
            buyer={buyer}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            isSaving={isSaving}
            onSave={handleSaveProfile}
            onLogout={handleLogout}
          />
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
            <div
              className="fixed inset-0 bg-black/40 z-50 flex flex-col items-center justify-center p-3 md:p-6"
              onClick={() => setImageModalOpen(null)}
            >
              <div
                className="relative w-full h-auto max-h-[90vh] flex flex-col items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setImageModalOpen(null)}
                  className="absolute top-0 right-0 z-20 bg-white hover:bg-gray-100 text-gray-900 rounded-full p-2 transition shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center group">
                  <img
                    src={currentImage}
                    alt={`Design ${imageModalOpen.index + 1}`}
                    className="w-full h-full object-contain max-w-full max-h-full"
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImageModalOpen({
                          orderId: imageModalOpen.orderId,
                          index: imageModalOpen.index === 0 ? images.length - 1 : imageModalOpen.index - 1
                        })}
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 md:p-3 rounded-lg transition shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
                      >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setImageModalOpen({
                          orderId: imageModalOpen.orderId,
                          index: imageModalOpen.index === images.length - 1 ? 0 : imageModalOpen.index + 1
                        })}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 md:p-3 rounded-lg transition shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
                      >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    {imageModalOpen.index + 1} / {images.length}
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="w-full flex gap-2 justify-center overflow-x-auto pb-2 mt-4 px-2">
                    {images.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setImageModalOpen({ orderId: imageModalOpen.orderId, index })}
                        className={`flex-shrink-0 rounded-lg overflow-hidden border-3 transition transform hover:scale-110 ${imageModalOpen.index === index
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
    </div>
  );
}
