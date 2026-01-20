"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Clock, AlertCircle, Check, X } from "lucide-react";
// ChatModal removed
import { OrderCard } from "./components/PendingPanel/OrderCard";
import { CustomOrderCard } from "./components/CustomOrderCard";
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
  items?: OrderItem[];
  rentalSchedule?: { rentalDays?: number } | null;
  cautionFee?: number | null;
  // Custom order fields
  isCustomOrder?: boolean;
  description?: string;
  designUrls?: string[];
  quotedPrice?: number;
  quantity?: number;
  requiredQuantity?: number;
  fullName?: string;
  paymentVerified?: boolean;
  paymentProofUrl?: string;
  quoteItems?: Array<{ itemName: string; quantity: number; unitPrice: number }>;
  // Discount fields
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAfterDiscount?: number;
  vat?: number;
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
  const [approved, setApproved] = useState<PendingOrderData[]>([]);
  const [inProgress, setInProgress] = useState<PendingOrderData[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'in-progress'>('pending');
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
        orders.forEach((order: any) => {
          // For REGULAR orders: Check paymentVerified flag (payment made before order creation)
          if (order.orderType === 'regular') {
            if (order.paymentVerified) {
              statusMap[order._id] = 'paid';
              console.log(`[PendingPanel] ✅ Regular Order ${order.orderNumber} - paymentVerified=true - marked as PAID`);
            } else {
              statusMap[order._id] = 'pending';
              console.log(`[PendingPanel] ⏳ Regular Order ${order.orderNumber} - paymentVerified=false - marked as PENDING`);
            }
          } 
          // For CUSTOM orders: Check invoices (payment happens after quote)
          else if (order.orderType === 'custom') {
            if (invoicesByReference.has(order.orderNumber)) {
              statusMap[order._id] = 'paid';
              console.log(`[PendingPanel] ✅ Custom Order ${order.orderNumber} has invoice - marked as PAID`);
            } else {
              statusMap[order._id] = 'pending';
              console.log(`[PendingPanel] ⏳ Custom Order ${order.orderNumber} has NO invoice - still PENDING`);
            }
          }
          // Fallback: check invoices
          else {
            if (invoicesByReference.has(order.orderNumber)) {
              statusMap[order._id] = 'paid';
            } else {
              statusMap[order._id] = 'pending';
            }
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

        // Fetch from unified endpoint instead of separate endpoints
        console.log('[PendingPanel] 🔄 Fetching orders from /api/orders/unified?limit=200');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const unifiedFetch = fetch('/api/orders/unified?limit=200', { 
          signal: signal || controller.signal, 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const res = await unifiedFetch;
        clearTimeout(timeoutId);
        
        console.log('[PendingPanel] API response status:', res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('[PendingPanel] API error response:', errorText);
          throw new Error(`API error ${res.status}: ${errorText || res.statusText}`);
        }

        let data;
        try {
          const rawText = await res.text();
          if (!rawText) {
            throw new Error('Empty response from API');
          }
          data = JSON.parse(rawText);
          console.log('[PendingPanel] ✅ Parsed API response:', { 
            success: data.success, 
            total: data.total, 
            ordersCount: Array.isArray(data.orders) ? data.orders.length : 'not array',
            keys: Object.keys(data).slice(0, 10)
          });
        } catch (parseErr) {
          console.error('[PendingPanel] Failed to parse JSON response:', parseErr);
          throw new Error(`Failed to parse API response: ${parseErr instanceof Error ? parseErr.message : 'Unknown error'}`);
        }

        // Handle response - could be array or object with orders property
        let ordersList: any[] = [];
        if (Array.isArray(data)) {
          ordersList = data;
          console.log('[PendingPanel] Response was array with', ordersList.length, 'orders');
        } else if (data && typeof data === 'object' && Array.isArray(data.orders)) {
          ordersList = data.orders;
          console.log('[PendingPanel] Response had orders property with', ordersList.length, 'orders');
        } else if (data && typeof data === 'object') {
          // Single order response
          ordersList = [data];
          console.log('[PendingPanel] Response was single order');
        } else {
          console.warn('[PendingPanel] Unexpected response format:', typeof data);
          ordersList = [];
        }

        console.log('[PendingPanel] Orders list extracted, count:', ordersList.length);

        // No need to merge - unified endpoint returns all orders
        const customList: any[] = [];

        // All orders are now in one list from unified endpoint
        let combinedOrders: any[] = [];
        try {
          const allOrdersMap = new Map<string, any>();
          ordersList.forEach((o: any) => {
            if (o && o._id) {
              allOrdersMap.set(o._id.toString(), { ...o, isCustomOrder: false });
            } else if (o && o.orderNumber) {
              allOrdersMap.set(o.orderNumber, { ...o, isCustomOrder: false });
            }
          });
          customList.forEach((o: any) => {
            const key = o._id?.toString() || o.orderNumber || (`custom-${o.orderNumber}`);
            if (!allOrdersMap.has(key)) allOrdersMap.set(key, { ...o, isCustomOrder: true });
          });
          combinedOrders = Array.from(allOrdersMap.values());
          console.log('[PendingPanel] Combined orders:', combinedOrders.length);
        } catch (mapErr) {
          console.error('[PendingPanel] Error processing orders map:', mapErr);
          combinedOrders = [...ordersList, ...customList];
        }

        if (combinedOrders.length === 0) {
          console.log('[PendingPanel] ℹ️ No orders found, setting empty state');
          if (mounted) {
            setPending([]);
            setApproved([]);
            setInProgress([]);
            setFetchedCount(0);
            setLastFetchAt(Date.now());
          }
          backoffMs = 0;
          return;
        }

        console.log('[PendingPanel] First order:', combinedOrders[0]);
        console.log('[PendingPanel] First item:', combinedOrders[0]?.items?.[0]);

        // Separate pending and approved orders
        // PENDING: Only orders NOT yet paid/approved
        let pendingList: any[] = [];
        let approvedList: any[] = [];
        let inProgressList: any[] = [];
        
        try {
          pendingList = combinedOrders.filter((o: any) => {
            try {
              const status = (o.status || '').toString().toLowerCase();
              // Exclude orders that have moved to approved or beyond
              if (status === 'completed' || status === 'cancelled' || status === 'deleted' || status === 'approved' || status === 'in_production' || status === 'ready_for_delivery' || status === 'delivered' || status === 'rejected' || status === 'shipped') return false;
              return true;
            } catch {
              return true; // Include if status check fails
            }
          });

          // Approved list: ONLY orders with status === 'approved'
          // NOTE: We filter by current status ONLY, ignoring persisted IDs
          // This ensures orders move out of approved once status changes
          approvedList = combinedOrders.filter((o: any) => {
            try {
              const status = (o.status || '').toString().toLowerCase();
              // CRITICAL: Do NOT include shipped orders in approved list
              if (status === 'shipped' || status === 'completed' || status === 'delivered' || status === 'rejected' || status === 'cancelled' || status === 'deleted') return false;
              return status === 'approved';
            } catch {
              return false; // Exclude if status check fails
            }
          });

          // In-Progress list: Removed - orders go directly from approved to ready_for_delivery
          inProgressList = [];
          
          console.log('[PendingPanel] Filtering complete - pending:', pendingList.length, 'approved:', approvedList.length);
        } catch (filterErr) {
          console.error('[PendingPanel] Error filtering orders:', filterErr);
          // Fallback: assume all are pending if filtering fails
          pendingList = combinedOrders;
          approvedList = [];
          inProgressList = [];
        }
        
        const allApprovedList = approvedList;
        
        console.log('[PendingPanel] Approved list (current status only):', allApprovedList.length);
        console.log('[PendingPanel] In-progress list:', inProgressList.length);

        console.log('[PendingPanel] fetched orders count:', combinedOrders.length, 'pendingList count:', pendingList.length, 'approvedList count:', allApprovedList.length, 'inProgressList count:', inProgressList.length);
        console.log('[PendingPanel] fetched orderNumbers:', combinedOrders.map(o => o.orderNumber).slice(0,50));
        if (mounted) {
          // Create a simple fingerprint of both pending and approved lists to detect any changes
          const newPendingKey = pendingList.map(o => o._id || o.orderNumber).join(',');
          const newApprovedKey = allApprovedList.map(o => o._id || o.orderNumber).join(',');
          const newInProgressKey = inProgressList.map(o => o._id || o.orderNumber).join(',');
          const newKey = `${newPendingKey}|${newApprovedKey}|${newInProgressKey}`;
          
          if (newKey !== prevPendingKeyRef.current) {
            prevPendingKeyRef.current = newKey;
            setPending(pendingList);
            setApproved(allApprovedList);
            setInProgress(inProgressList);
            setFetchedCount(combinedOrders.length);
            setLastFetchAt(Date.now());
            // Fetch product images
            fetchProductImages(pendingList);
            // Detect payment status by checking for invoices
            detectPaymentStatus(pendingList);
            console.log('[PendingPanel] state updated (changes detected), pending count:', pendingList.length, 'approved count:', allApprovedList.length, 'inProgress count:', inProgressList.length);
          } else {
            // No meaningful change — avoid updating UI state to prevent visible refresh/jank
            console.log('[PendingPanel] no change in orders — skipping state update');
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

  // Listen for orders updated event from logistics or other pages
  useEffect(() => {
    const handleOrdersUpdated = (event: any) => {
      const { orderId, action, timestamp, message } = event.detail;
      console.log(`[PendingPanel] 📢 Received ordersUpdated event:`, { orderId, action, timestamp, message });

      if (action === 'approved') {
        console.log(`[PendingPanel] ✅ APPROVED EVENT - Moving order ${orderId} from pending to approved`);
        
        // Remove the order from pending list
        setPending(prevPending => {
          const filtered = prevPending.filter(o => o._id !== orderId);
          if (filtered.length !== prevPending.length) {
            console.log(`[PendingPanel] ✅ Removed approved order ${orderId} from PENDING list (was ${prevPending.length}, now ${filtered.length})`);
          }
          return filtered;
        });

        // Add to approved list by finding the order and adding it
        setApproved(prevApproved => {
          // Check if order already exists in approved list
          const orderExists = prevApproved.some(o => o._id === orderId);
          if (!orderExists) {
            // We need to fetch the updated order data
            // For now, trigger a full refresh to ensure we have the latest data
            console.log(`[PendingPanel] 📥 Order ${orderId} not in approved list yet, triggering refresh...`);
            // The polling will pick this up automatically within the next interval
          }
          return prevApproved;
        });

        console.log(`[PendingPanel] ✅ Order ${orderId} has been approved and moved from pending to approved`);
      } else if (action === 'shipped') {
        console.log(`[PendingPanel] 🚨 SHIPPING EVENT - Removing order ${orderId} from all tabs`);
        
        // Remove the order from approved list
        setPending(prevPending => {
          const filtered = prevPending.filter(o => o._id !== orderId);
          if (filtered.length !== prevPending.length) {
            console.log(`[PendingPanel] ✅ Removed shipped order ${orderId} from PENDING list (was ${prevPending.length}, now ${filtered.length})`);
          }
          return filtered;
        });

        // Remove from approved list
        setApproved(prevApproved => {
          const filtered = prevApproved.filter(o => o._id !== orderId);
          if (filtered.length !== prevApproved.length) {
            console.log(`[PendingPanel] ✅ Removed shipped order ${orderId} from APPROVED list (was ${prevApproved.length}, now ${filtered.length})`);
          }
          return filtered;
        });

        // Remove from in-progress list
        setInProgress(prevInProgress => {
          const filtered = prevInProgress.filter(o => o._id !== orderId);
          if (filtered.length !== prevInProgress.length) {
            console.log(`[PendingPanel] ✅ Removed shipped order ${orderId} from IN_PROGRESS list`);
          }
          return filtered;
        });

        console.log(`[PendingPanel] ✅ Order ${orderId} has been shipped and removed from all pending lists`);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ordersUpdated', handleOrdersUpdated);
      console.log('[PendingPanel] ✅ Event listener registered for ordersUpdated');
      return () => {
        window.removeEventListener('ordersUpdated', handleOrdersUpdated);
        console.log('[PendingPanel] ❌ Event listener removed');
      };
    }
  }, []);

  const fetchProductImages = async (orders: PendingOrderData[]) => {
    // Extract images directly from order items instead of fetching from products API
    const images: Record<string, ProductWithImage> = {};
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.productId && item.imageUrl) {
            images[item.productId] = {
              name: item.name,
              imageUrl: item.imageUrl,
              sellPrice: item.price,
            };
          }
        });
      }
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

      // Let the polling logic handle moving the order to approved
      // Just show success message
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
          const res = await fetch(`/api/orders/unified/${order._id}`, {
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
      console.log('[PendingPanel] 🗑️ Attempting to delete order:', orderId);
      
      // Delete from database
      const res = await fetch(`/api/orders/unified/${orderId}`, {
        method: 'DELETE',
      });

      console.log('[PendingPanel] Delete response status:', res.status);

      // If 404, order already deleted - that's fine, just remove from UI
      if (res.status === 404) {
        console.log(`[PendingPanel] ℹ️ Order ${orderId} not found in database (already deleted)`);
      } else if (!res.ok) {
        const error = await res.json();
        console.error('[PendingPanel] Delete error response:', error);
        throw new Error(error.message || error.error || `Failed to delete order (${res.status})`);
      }

      console.log('[PendingPanel] ✅ Order deleted successfully');

      // Remove from ALL lists (pending, approved, inProgress)
      setPending(pending.filter(o => o._id !== orderId));
      setApproved(approved.filter(o => o._id !== orderId));
      setInProgress(inProgress.filter(o => o._id !== orderId));
      
      // Database handles order deletion - sessionStorage removed for reliability
      console.log('[PendingPanel] Order deleted from database with status cleanup');

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
      const res = await fetch('/api/orders/unified?limit=200');
      if (!res.ok) throw new Error('Failed to refresh orders');
      const data = await res.json();
      const ordersList = Array.isArray(data) ? data : (data.orders || []);
      const pendingList = ordersList.filter((o: any) => {
        const status = (o.status || '').toString().toLowerCase();
        if (status === 'delivered' || status === 'cancelled' || status === 'deleted') return false;
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
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
              activeTab === 'pending'
                ? 'text-red-600 border-b-2 border-red-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
              activeTab === 'approved'
                ? 'text-green-600 border-b-2 border-green-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Check className="h-4 w-4 inline mr-2" />
            Approved ({approved.length})
          </button>

          {/* In Progress tab removed - orders go directly from approved to ready_for_delivery */}
        </div>
      </div>

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
        {loading && pending.length === 0 && approved.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-3">
              <div className="h-8 w-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 text-sm">Loading pending orders...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && activeTab === 'pending' && pending.length === 0 && (
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

        {/* Empty State - Approved */}
        {!loading && !error && activeTab === 'approved' && approved.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900">No approved orders</p>
              <p className="text-gray-600 text-sm mt-1">Approved orders will appear here</p>
            </div>
          </div>
        )}

        {/* Orders Cards Grid */}
        {!error && (pending.length > 0 || approved.length > 0 || inProgress.length > 0) && ((activeTab === 'pending' && pending.length > 0) || (activeTab === 'approved' && approved.length > 0) || (activeTab === 'in-progress' && inProgress.length > 0)) && (
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
            {(activeTab === 'pending' ? filteredPending : approved).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-semibold">No orders found</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-6">
                {(activeTab === 'pending' ? filteredPending : approved).map((order) => {
                  const isCustom = !order.items || order.items.length === 0;
                  
                  return (
                    <div key={order._id} className="break-inside-avoid mb-6">
                      {isCustom ? (
                        <CustomOrderCard
                          orderId={order._id}
                          orderNumber={order.orderNumber}
                          fullName={order.fullName || `${order.firstName} ${order.lastName}`.trim()}
                          email={order.email}
                          phone={order.phone || ''}
                          quantity={order.requiredQuantity || order.quantity || 1}
                          description={order.description || ''}
                          designUrls={order.designUrls || []}
                          status={order.status as any || 'pending'}
                          quotedPrice={order.quotedPrice}
                          quoteItems={order.quoteItems}
                          paymentVerified={order.paymentVerified || false}
                          paymentProofUrl={order.paymentProofUrl}
                        />
                      ) : (
                        <OrderCard
                          orderId={order._id}
                          firstName={order.firstName || order.fullName?.split(' ')[0] || ''}
                          lastName={order.lastName || order.fullName?.split(' ').slice(1).join(' ') || ''}
                          email={order.email}
                          phone={order.phone}
                          items={order.items}
                          total={order.total}
                          orderNumber={order.orderNumber}
                          isPaid={paymentStatus[order._id] === 'paid' || paymentStatus[order._id] === 'approved'}
                          isApproving={approvingOrderId === order._id}
                          rentalDays={order.rentalSchedule?.rentalDays}
                          cautionFee={order.cautionFee || undefined}
                          onApprove={activeTab === 'pending' ? () => setConfirmModalOpen(order._id) : () => {}}
                          onChat={() => setChatModalOpen(order._id)}
                          onDelete={deleteOrder}
                          formatCurrency={formatCurrency}
                          description={order.description}
                          designUrls={order.designUrls}
                          quantity={order.quantity}
                          quotedPrice={order.quotedPrice}
                          isApproved={activeTab === 'approved' || activeTab === 'in-progress'}
                          subtotal={order.subtotal}
                          discountPercentage={order.discountPercentage}
                          discountAmount={order.discountAmount}
                          subtotalAfterDiscount={order.subtotalAfterDiscount}
                          vat={order.vat}
                        />
                      )}
                    </div>
                  );
                })}
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

        {/* Chat Modal - removed, to be replaced */}

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
