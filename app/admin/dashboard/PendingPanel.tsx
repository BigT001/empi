"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, AlertCircle, Check, X, Search, RefreshCw, ShoppingBag, Layers } from "lucide-react";
import { ConfirmPaymentModal } from "./components/PendingPanel/ConfirmPaymentModal";
import { OrdersTable, PendingOrderData } from "./components/OrdersTable";
import { InvoiceModal } from "@/app/components/InvoiceModal";
import { StoredInvoice } from "@/lib/invoiceStorage";

interface ProductWithImage {
  name: string;
  imageUrl?: string;
  sellPrice?: number;
}

interface PendingPanelProps {
  searchQuery?: string;
}

export function PendingPanel({ searchQuery: propSearchQuery = "" }: PendingPanelProps) {
  const [pending, setPending] = useState<PendingOrderData[]>([]);
  const [approved, setApproved] = useState<PendingOrderData[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'regular' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState(propSearchQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<string, ProductWithImage>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<Record<string, 'pending' | 'paid' | 'approved'>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);

  // Synchronize local search query if prop changes
  useEffect(() => {
    if (propSearchQuery) setSearchQuery(propSearchQuery);
  }, [propSearchQuery]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Detect payment status by checking invoices
  const detectPaymentStatus = async (orders: PendingOrderData[]) => {
    try {
      const statusMap: Record<string, 'pending' | 'paid' | 'approved'> = {};
      const invoicesRes = await fetch('/api/invoices?limit=500');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData.invoices || []);
        const invoicesByReference = new Map();
        invoices.forEach((inv: any) => {
          if (inv.orderNumber || inv.customOrderId) {
            invoicesByReference.set(inv.orderNumber, inv.status || 'paid');
          }
        });

        orders.forEach((order: any) => {
          if (!order.items || order.items.length > 0) {
            if (order.paymentVerified) {
              statusMap[order._id] = 'paid';
            } else {
              const invStatus = invoicesByReference.get(order.orderNumber);
              statusMap[order._id] = invStatus === 'paid' ? 'paid' : 'pending';
            }
          } else {
            const hasInvoice = invoicesByReference.has(order.orderNumber);
            statusMap[order._id] = hasInvoice ? 'paid' : 'pending';
          }
        });
      }
      setPaymentStatus(prev => ({ ...prev, ...statusMap }));
    } catch (err) {
      console.error('[PendingPanel] Error detecting payment status:', err);
    }
  };

  // Fetch product images
  const fetchProductImages = async (orders: PendingOrderData[]) => {
    try {
      const productIds = new Set<string>();
      orders.forEach(order => {
        order.items?.forEach(item => {
          if (item.productId) productIds.add(item.productId);
        });
      });

      if (productIds.size === 0) return;

      const newImages: Record<string, ProductWithImage> = {};
      for (const id of Array.from(productIds)) {
        if (!productImages[id]) {
          try {
            const res = await fetch(`/api/products/${id}`);
            if (res.ok) {
              const data = await res.json();
              const product = data.product || data;
              newImages[id] = {
                name: product.name,
                imageUrl: product.imageUrl || product.images?.[0],
                sellPrice: product.sellPrice,
              };
            }
          } catch {
            // Ignore individual fetch errors
          }
        }
      }
      if (Object.keys(newImages).length > 0) {
        setProductImages(prev => ({ ...prev, ...newImages }));
      }
    } catch (err) {
      console.error('[PendingPanel] Error fetching product images:', err);
    }
  };

  // Load orders from database
  const fetchOrders = async (isSilent = false) => {
    try {
      if (!isSilent && pending.length === 0 && approved.length === 0) {
        setLoading(true);
      }
      setError(null);
      const res = await fetch('/api/orders/unified?limit=200');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      const ordersList = Array.isArray(data) ? data : (data.orders || []);

      const pendingList: PendingOrderData[] = [];
      const approvedList: PendingOrderData[] = [];

      ordersList.forEach((o: any) => {
        const st = (o.status || '').toString().toLowerCase();
        if (st === 'cancelled' || st === 'deleted') return;
        if (st === 'approved' || st === 'confirmed' || st === 'completed' || st === 'shipped') {
          approvedList.push(o);
        } else {
          pendingList.push(o);
        }
      });

      setPending(pendingList);
      setApproved(approvedList);
      fetchProductImages([...pendingList, ...approvedList]);
      detectPaymentStatus([...pendingList, ...approvedList]);
    } catch (err: any) {
      console.error('[PendingPanel] Error fetching orders:', err);
      if (!isSilent) {
        setError(err.message || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);
  }, []);

  // Socket listener for order updates
  useEffect(() => {
    const handleOrderUpdate = () => {
      fetchOrders(true);
    };
    window.addEventListener('ordersUpdated', handleOrderUpdate);
    return () => window.removeEventListener('ordersUpdated', handleOrderUpdate);
  }, []);

  // Polling loop (every 10s if active)
  useEffect(() => {
    if (!isPollingActive) return;
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isPollingActive]);

  // Approve payment API action
  const approvePayment = async (orderId: string) => {
    try {
      setApprovingOrderId(orderId);
      const adminRes = await fetch('/api/admin/me');
      if (!adminRes.ok) throw new Error('Not authenticated');
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

      showToast('Order approved successfully!', 'success');
      fetchOrders();
    } catch (err: any) {
      console.error('[PendingPanel] Error approving payment:', err);
      showToast(err.message || 'Failed to approve payment', 'error');
    } finally {
      setApprovingOrderId(null);
    }
  };

  // Delete order API action
  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/unified/${orderId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete order');
      }
      setPending(prev => prev.filter(o => o._id !== orderId));
      setApproved(prev => prev.filter(o => o._id !== orderId));
      showToast('Order deleted successfully!', 'success');
    } catch (err: any) {
      console.error('[PendingPanel] Error deleting order:', err);
      showToast(err.message || 'Failed to delete order', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open invoice modal
  const handleViewInvoice = async (order: PendingOrderData) => {
    try {
      const res = await fetch(`/api/invoices?orderNumber=${order.orderNumber}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.invoices || []);
        if (list.length > 0) {
          setSelectedInvoice(list[0]);
          return;
        }
      }
      // Create transient invoice object for rendering
      const transientInvoice: StoredInvoice = {
        id: `INV-${order.orderNumber}`,
        invoiceNumber: `INV-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        invoiceDate: new Date(order.createdAt).toISOString().split('T')[0],
        customerName: `${order.firstName || ''} ${order.lastName || ''}`.trim() || order.fullName || 'Customer',
        customerEmail: order.email,
        customerPhone: order.phone || '',
        items: (order.items || []).map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          mode: i.mode
        })),
        subtotal: order.subtotal || order.total,
        bulkDiscountAmount: order.discountAmount || 0,
        subtotalAfterDiscount: order.subtotalAfterDiscount || (order.subtotal || order.total) - (order.discountAmount || 0),
        shippingCost: 0,
        taxRate: (order.vat !== undefined && order.vat > 0) ? 7.5 : 0,
        taxAmount: order.vat || 0,
        cautionFee: order.cautionFee || 0,
        totalAmount: order.total,
        paymentStatus: (paymentStatus[order._id] === 'paid' || order.status === 'approved') ? 'completed' : 'pending',
        paymentMethod: order.paymentMethod || 'online',
        createdAt: order.createdAt,
        updatedAt: order.createdAt
      };
      setSelectedInvoice(transientInvoice);
    } catch (err) {
      console.error("Error loading invoice:", err);
      showToast("Could not load invoice", "error");
    }
  };

  // Unified list calculation
  const allOrders = useMemo(() => {
    return [...pending, ...approved];
  }, [pending, approved]);

  const filteredOrders = useMemo(() => {
    let list = allOrders;

    // Status filter
    if (statusFilter === 'pending') {
      list = pending;
    } else if (statusFilter === 'approved') {
      list = approved;
    }

    // Type filter
    if (typeFilter === 'custom') {
      list = list.filter(o => o.isCustomOrder || !o.items || o.items.length === 0);
    } else if (typeFilter === 'regular') {
      list = list.filter(o => !o.isCustomOrder && o.items && o.items.length > 0);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.firstName?.toLowerCase().includes(q) ||
        o.lastName?.toLowerCase().includes(q) ||
        o.fullName?.toLowerCase().includes(q) ||
        o.phone?.includes(q)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'oldest':
        return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'amount':
        return [...list].sort((a, b) => b.total - a.total);
      case 'newest':
      default:
        return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [allOrders, pending, approved, statusFilter, typeFilter, searchQuery, sortBy]);

  const formatCurrency = (amount: number) => `₦${Number(amount || 0).toLocaleString()}`;

  // Statistics calculation
  const totalValue = allOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingValue = pending.reduce((sum, o) => sum + o.total, 0);
  const approvedValue = approved.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Controls & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Orders Card */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]'
              : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-blue-100' : 'text-gray-500'}`}>
              All Orders ({allOrders.length})
            </span>
            <div className={`p-2 rounded-xl ${statusFilter === 'all' ? 'bg-blue-500/40 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2">{formatCurrency(totalValue)}</p>
        </div>

        {/* Pending Orders Card */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-[1.01]'
              : 'bg-white text-gray-900 border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'pending' ? 'text-amber-100' : 'text-gray-500'}`}>
              Pending ({pending.length})
            </span>
            <div className={`p-2 rounded-xl ${statusFilter === 'pending' ? 'bg-amber-400/40 text-white' : 'bg-amber-50 text-amber-600'}`}>
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2">{formatCurrency(pendingValue)}</p>
        </div>

        {/* Approved Orders Card */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.01]'
              : 'bg-white text-gray-900 border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'approved' ? 'text-emerald-100' : 'text-gray-500'}`}>
              Approved ({approved.length})
            </span>
            <div className={`p-2 rounded-xl ${statusFilter === 'approved' ? 'bg-emerald-500/40 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
              <Check className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2">{formatCurrency(approvedValue)}</p>
        </div>
      </div>

      {/* Filter Toolbar & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, customer name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500 transition"
          />
        </div>

        {/* Type & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Pills */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              All ({allOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Pending ({pending.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'approved' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Approved ({approved.length})
            </button>
          </div>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            <option value="all">All Order Types</option>
            <option value="regular">Store Items</option>
            <option value="custom">Custom Orders</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount">Highest Amount</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchOrders()}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
            title="Refresh Orders"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-red-900 text-sm">Failed to load orders</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Orders Table or Skeleton / Empty state */}
        {loading && allOrders.length === 0 ? (
          <OrdersTable
            orders={[]}
            paymentStatusMap={paymentStatus}
            approvingOrderId={approvingOrderId}
            productImages={productImages}
            loading={true}
            onApprove={approvePayment}
            onDelete={deleteOrder}
            onOpenConfirmModal={(orderId) => setConfirmModalOpen(orderId)}
            onViewInvoice={handleViewInvoice}
            formatCurrency={formatCurrency}
          />
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-lime-100 text-lime-700 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-gray-900">No orders found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery ? `No orders matched search "${searchQuery}".` : 'No orders in this category at the moment.'}
            </p>
          </div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            paymentStatusMap={paymentStatus}
            approvingOrderId={approvingOrderId}
            productImages={productImages}
            loading={false}
            onApprove={approvePayment}
            onDelete={deleteOrder}
            onOpenConfirmModal={(orderId) => setConfirmModalOpen(orderId)}
            onViewInvoice={handleViewInvoice}
            formatCurrency={formatCurrency}
          />
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmPaymentModal
        isOpen={!!confirmModalOpen}
        orderNumber={allOrders.find(o => o._id === confirmModalOpen)?.orderNumber || ''}
        isPaid={confirmModalOpen ? (paymentStatus[confirmModalOpen] === 'paid' || Boolean(allOrders.find(o => o._id === confirmModalOpen)?.paymentVerified)) : false}
        total={allOrders.find(o => o._id === confirmModalOpen)?.total || 0}
        onClose={() => setConfirmModalOpen(null)}
        onApprove={() => {
          if (confirmModalOpen) {
            approvePayment(confirmModalOpen);
            setConfirmModalOpen(null);
          }
        }}
        formatCurrency={formatCurrency}
        paymentMethod={allOrders.find(o => o._id === confirmModalOpen)?.paymentMethod}
        paymentProofUrl={allOrders.find(o => o._id === confirmModalOpen)?.paymentProofUrl}
      />

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl text-white font-bold text-xs shadow-xl flex items-center gap-2 z-[99999] ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
