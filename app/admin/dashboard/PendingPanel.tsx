"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Clock, AlertCircle, Check, X } from "lucide-react";
import { ChatModal } from "@/app/components/ChatModal";
import { OrderCard } from "./components/PendingPanel/OrderCard";
import { ConfirmPaymentModal } from "./components/PendingPanel/ConfirmPaymentModal";

interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  mode?: 'buy' | 'rent';
  imageUrl?: string; // Product image URL from order
}

interface PendingOrderData {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  total: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  items: OrderItem[];
  rentalSchedule?: { rentalDays?: number } | null;
  cautionFee?: number | null;
}

interface ProductWithImage {
  name: string;
  imageUrl?: string;
  sellPrice?: number;
}

interface PendingPanelProps {
  searchQuery?: string;
}

export function PendingPanel({ searchQuery = "" }: PendingPanelProps) {
  const [pending, setPending] = useState<PendingOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<string, ProductWithImage>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<Record<string, 'pending' | 'paid' | 'approved'>>({});
  const [fetchedCount, setFetchedCount] = useState<number>(0);
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const prevPendingKeyRef = useRef<string>('');
  const prevPaymentStatusRef = useRef<string>('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Function to detect if payment has been made by checking for associated invoice
  const detectPaymentStatus = async (orders: PendingOrderData[]) => {
    try {
      const statusMap: Record<string, 'pending' | 'paid' | 'approved'> = {};
      
      // Fetch all invoices to check which orders have been paid
      const invoicesRes = await fetch('/api/invoices?limit=500');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData.invoices || []);
        
        // Create a map of order references to invoice status
        const invoicesByReference = new Map();
        invoices.forEach((inv: any) => {
          if (inv.orderNumber || inv.customOrderId) {
            invoicesByReference.set(inv.orderNumber, inv.status || 'paid');
          }
        });
        
        console.log('[PendingPanel] Invoice map:', Array.from(invoicesByReference.entries()));
        
        // Check each order for payment
        orders.forEach(order => {
          if (invoicesByReference.has(order.orderNumber)) {
            statusMap[order._id] = 'paid'; // Invoice exists = payment was made
            console.log(`[PendingPanel] ✅ Order ${order.orderNumber} has invoice - marked as PAID`);
          } else {
            statusMap[order._id] = 'pending'; // No invoice = still pending
            console.log(`[PendingPanel] ⏳ Order ${order.orderNumber} has NO invoice - still PENDING`);
          }
        });
      }
      
      const serialized = JSON.stringify(statusMap);
      if (serialized !== prevPaymentStatusRef.current) {
        prevPaymentStatusRef.current = serialized;
        setPaymentStatus(statusMap);
        console.log('[PendingPanel] Payment status map (updated):', statusMap);
      } else {
        console.log('[PendingPanel] Payment status unchanged');
      }
    } catch (err) {
      console.error('[PendingPanel] Error detecting payment status:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let backoffMs = 0;

    const DEFAULT_POLL_MS = Number(process.env.NEXT_PUBLIC_ADMIN_POLL_INTERVAL) || 15000;
    const MAX_BACKOFF_MS = 60000;

    const fetchOrders = async ({ signal, showLoading }: { signal?: AbortSignal; showLoading?: boolean } = {}) => {
      try {
        if (!mounted) return;
        if (showLoading) {
          setLoading(true);
          setError(null);
        }

        // Fetch both regular orders and custom-orders to ensure admin sees everything
        const ordersFetch = fetch('/api/orders?limit=200&includeCustom=true', { signal, cache: 'no-store' });
        const customFetch = fetch('/api/custom-orders?limit=200', { signal, cache: 'no-store' });

        const [res, customRes] = await Promise.all([ordersFetch, customFetch]);
        if (!res.ok) throw new Error('Failed to load orders');
        if (!customRes.ok) console.warn('[PendingPanel] /api/custom-orders returned non-OK status', customRes.status);

        const data = await res.json();
        const ordersList = Array.isArray(data) ? data : (data.orders || []);

        let customList: any[] = [];
        try {
          const customData = await customRes.json();
          customList = Array.isArray(customData) ? customData : (customData.orders || []);
        } catch (e) {
          console.warn('[PendingPanel] Failed to parse /api/custom-orders response', e);
        }

        // Merge unique orders by _id or orderNumber (custom orders may use different ids)
        const allOrdersMap = new Map<string, any>();
        ordersList.forEach((o: any) => {
          allOrdersMap.set(o._id?.toString() || o.orderNumber, o);
        });
        customList.forEach((o: any) => {
          const key = o._id?.toString() || o.orderNumber || (`custom-${o.orderNumber}`);
          if (!allOrdersMap.has(key)) allOrdersMap.set(key, o);
        });
        const combinedOrders = Array.from(allOrdersMap.values());

        console.log('[PendingPanel] First order:', combinedOrders[0]);
        console.log('[PendingPanel] First item:', combinedOrders[0]?.items?.[0]);

        // Show all orders that are not final (exclude completed or cancelled)
        const pendingList = combinedOrders.filter((o: any) => {
          const status = (o.status || '').toString().toLowerCase();
          if (status === 'completed' || status === 'cancelled' || status === 'deleted') return false;
          return true;
        });

        console.log('[PendingPanel] fetched orders count:', combinedOrders.length, 'pendingList count:', pendingList.length);
        console.log('[PendingPanel] fetched orderNumbers:', combinedOrders.map(o => o.orderNumber).slice(0,50));
        if (mounted) {
          // Create a simple fingerprint of the pending list to avoid replacing state when nothing changed
          const newKey = pendingList.map(o => o._id || o.orderNumber).join(',');
          if (newKey !== prevPendingKeyRef.current) {
            prevPendingKeyRef.current = newKey;
            setPending(pendingList);
            setFetchedCount(combinedOrders.length);
            setLastFetchAt(Date.now());
            // Fetch product images
            fetchProductImages(pendingList);
            // Detect payment status by checking for invoices
            detectPaymentStatus(pendingList);
            console.log('[PendingPanel] pending state updated (changes detected)');
          } else {
            // No meaningful change — avoid updating UI state to prevent visible refresh/jank
            console.log('[PendingPanel] no change in pending orders — skipping state update');
          }
        }

        // reset backoff on success
        backoffMs = 0;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          console.log('[PendingPanel] fetch aborted');
        } else {
          console.error('[PendingPanel] Error loading pending orders:', err);
          // Only set a user-facing error when this fetch was explicitly requested (showLoading)
          if (mounted && showLoading) setError(err.message || 'Failed to load pending orders');
          // increase backoff
          backoffMs = backoffMs ? Math.min(backoffMs * 2, MAX_BACKOFF_MS) : 5000;
        }
      } finally {
        if (mounted && showLoading) setLoading(false);
      }
    };

    const controller = new AbortController();

    // initial fetch (show loading UI on first explicit load)
    fetchOrders({ signal: controller.signal, showLoading: true });

    // Polling loop
    if (isPollingActive) {
      intervalId = setInterval(() => {
        // if there is a backoff, wait for backoff duration instead
        if (backoffMs) {
          setTimeout(() => fetchOrders(), backoffMs);
        } else {
          fetchOrders();
        }
      }, DEFAULT_POLL_MS);
    }

    return () => {
      mounted = false;
      controller.abort();
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPollingActive]);

  const fetchProductImages = async (orders: PendingOrderData[]) => {
    // Extract images directly from order items instead of fetching from products API
    const images: Record<string, ProductWithImage> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId && item.imageUrl) {
          images[item.productId] = {
            name: item.name,
            imageUrl: item.imageUrl,
            sellPrice: item.price,
          };
        }
      });
    });

    setProductImages(images);
  };

  const approvePayment = async (orderId: string) => {
    try {
      setApprovingOrderId(orderId);
      // Resolve the current admin from the session so we send a valid ObjectId
      const adminRes = await fetch('/api/admin/me', { method: 'GET', cache: 'no-store' });
      if (!adminRes.ok) {
        const err = await adminRes.json().catch(() => ({ error: 'Not authenticated' }));
        throw new Error(err.error || 'Failed to resolve admin identity');
      }
      const adminData = await adminRes.json();
      const adminId = adminData._id || adminData.id;

      const res = await fetch('/api/admin/orders/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, adminId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to approve payment');
      }

      setPending(pending.filter(o => o._id !== orderId));
      showToast('Payment approved successfully!', 'success');
    } catch (err: any) {
      console.error('[PendingPanel] Error approving payment:', err);
      showToast(err.message || 'Failed to approve payment', 'error');
    } finally {
      setApprovingOrderId(null);
    }
  };

  const deleteAllPendingOrders = async () => {
    if (!window.confirm(`Are you sure you want to delete all ${pending.length} pending orders? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      let deletedCount = 0;
      let failedCount = 0;

      for (const order of pending) {
        try {
          const res = await fetch(`/api/orders/${order._id}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            deletedCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`Failed to delete order ${order._id}:`, err);
          failedCount++;
        }
      }

      setPending([]);
      const message = failedCount > 0 
        ? `Deleted ${deletedCount} orders, ${failedCount} failed`
        : `All ${deletedCount} pending orders deleted successfully!`;
      showToast(message, failedCount > 0 ? 'error' : 'success');
    } catch (err: any) {
      console.error('[PendingPanel] Error deleting all pending orders:', err);
      showToast(err.message || 'Failed to delete pending orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete order');
      }

      setPending(pending.filter(o => o._id !== orderId));
      showToast('Order deleted successfully!', 'success');
    } catch (err: any) {
      console.error('[PendingPanel] Error deleting order:', err);
      showToast(err.message || 'Failed to delete order', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort pending orders
  const filteredPending = useMemo(() => {
    let filtered = pending;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'amount':
        return filtered.sort((a, b) => b.total - a.total);
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [pending, searchQuery, sortBy]);

  const formatCurrency = (amount: number) => `₦${Number(amount || 0).toLocaleString()}`;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const getDaysOld = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      return days;
    } catch {
      return 0;
    }
  };

  const getUrgencyColor = (daysOld: number) => {
    if (daysOld > 7) return 'bg-red-100 text-red-700 border-red-300';
    if (daysOld > 3) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  };

  const totalPendingAmount = pending.reduce((sum, o) => sum + o.total, 0);

  const refreshNow = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/orders?limit=200&includeCustom=true');
      if (!res.ok) throw new Error('Failed to refresh orders');
      const data = await res.json();
      const ordersList = Array.isArray(data) ? data : (data.orders || []);
      const pendingList = ordersList.filter((o: any) => {
        const status = (o.status || '').toString().toLowerCase();
        if (status === 'completed' || status === 'cancelled' || status === 'deleted') return false;
        return true;
      });

      setPending(pendingList);
      setFetchedCount(ordersList.length);
      setLastFetchAt(Date.now());
      fetchProductImages(pendingList);
      detectPaymentStatus(pendingList);
    } catch (err: any) {
      console.error('[PendingPanel] Manual refresh failed:', err);
      setError(err.message || 'Failed to refresh orders');
    } finally {
      setLoading(false);
    }
  };

  const togglePolling = () => setIsPollingActive(prev => !prev);

  return (
    <div className="space-y-6">
      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Content */}
      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error loading pending orders</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-3">
              <div className="h-8 w-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 text-sm">Loading pending orders...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && pending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-semibold text-gray-900">All caught up!</p>
              <p className="text-gray-600 text-sm mt-1">No pending or unpaid orders at the moment</p>
            </div>
          </div>
        )}

        {/* Pending Orders Cards Grid */}
        {!loading && !error && pending.length > 0 && (
          <div>
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount">Highest Amount</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            {filteredPending.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-semibold">No pending orders found</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-6">
                {filteredPending.map((order) => (
                  <div key={order._id} className="break-inside-avoid mb-6">
                    <OrderCard
                      orderId={order._id}
                      firstName={order.firstName}
                      lastName={order.lastName}
                      email={order.email}
                      phone={order.phone}
                      items={order.items}
                      total={order.total}
                      orderNumber={order.orderNumber}
                      isPaid={paymentStatus[order._id] === 'paid'}
                      isApproving={approvingOrderId === order._id}
                      rentalDays={order.rentalSchedule?.rentalDays}
                      cautionFee={order.cautionFee || undefined}
                      onApprove={() => setConfirmModalOpen(order._id)}
                      onChat={() => setChatModalOpen(order._id)}
                      onDelete={deleteOrder}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmPaymentModal
          isOpen={!!confirmModalOpen}
          orderNumber={pending.find(o => o._id === confirmModalOpen)?.orderNumber || ''}
          isPaid={confirmModalOpen ? paymentStatus[confirmModalOpen] === 'paid' : false}
          total={pending.find(o => o._id === confirmModalOpen)?.total || 0}
          onClose={() => setConfirmModalOpen(null)}
          onApprove={() => {
            if (confirmModalOpen) {
              approvePayment(confirmModalOpen);
              setConfirmModalOpen(null);
            }
          }}
          formatCurrency={formatCurrency}
        />

        {/* Chat Modal */}
        {chatModalOpen && (
          <ChatModal
            isOpen={true}
            onClose={() => setChatModalOpen(null)}
            order={{
              _id: chatModalOpen,
              orderNumber: pending.find(o => o._id === chatModalOpen)?.orderNumber || 'Order',
              email: pending.find(o => o._id === chatModalOpen)?.email || '',
              phone: pending.find(o => o._id === chatModalOpen)?.phone || '',
              fullName: pending.find(o => o._id === chatModalOpen) ? `${pending.find(o => o._id === chatModalOpen)?.firstName} ${pending.find(o => o._id === chatModalOpen)?.lastName}` : 'Customer',
            }}
            userEmail="admin@empi.com"
            userName="Admin"
            isAdmin={true}
            paymentStatus={paymentStatus[chatModalOpen] || 'pending'}
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white font-semibold flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            {toast.message}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
