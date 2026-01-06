"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, AlertTriangle, Search, Calendar, AlertCircle, Check, X, DollarSign, Mail, Phone, Package, MessageCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { ChatModal } from "@/app/components/ChatModal";

interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  mode?: string;
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
      
      setPaymentStatus(statusMap);
      console.log('[PendingPanel] Payment status map:', statusMap);
    } catch (err) {
      console.error('[PendingPanel] Error detecting payment status:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/orders?limit=200');
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        const ordersList = Array.isArray(data) ? data : (data.orders || []);
        console.log('[PendingPanel] First order:', ordersList[0]);
        console.log('[PendingPanel] First item:', ordersList[0]?.items?.[0]);
        const pendingList = ordersList.filter((o: any) => 
          o.status === 'pending' || o.status === 'unpaid' || o.status === 'processing' || o.paymentStatus === 'pending'
        );
        if (mounted) {
          setPending(pendingList);
          // Fetch product images
          fetchProductImages(pendingList);
          // Detect payment status by checking for invoices
          detectPaymentStatus(pendingList);
        }
      } catch (err: any) {
        console.error('[PendingPanel] Error loading pending orders:', err);
        if (mounted) setError(err.message || 'Failed to load pending orders');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
          <>
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
                <button
                  onClick={deleteAllPendingOrders}
                  disabled={pending.length === 0 || loading}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {filteredPending.length} of {pending.length} orders
              </p>
            </div>

            {/* Cards Grid */}
            {filteredPending.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-semibold">No pending orders found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPending.map((order) => {
                  const daysOld = getDaysOld(order.createdAt);
                  
                  return (
                    <div
                      key={order._id}
                      className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-200 overflow-hidden shadow-md hover:shadow-xl hover:border-red-300 transition-all flex flex-col"
                    >
                      {/* Header - Customer Info */}
                      <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white">
                        <h3 className="font-bold text-lg">{order.firstName} {order.lastName}</h3>
                        <p className="text-sm text-red-100 truncate">{order.email}</p>
                        {order.phone && <p className="text-sm text-red-100">{order.phone}</p>}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-4 flex-1 flex flex-col">
                        {/* Product Items - Images & Names */}
                        {order.items && order.items.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-600 uppercase">Products Ordered</p>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div
                                  key={`${order._id}-item-${idx}`}
                                  className="flex gap-3 bg-white rounded-lg p-3 border border-red-200"
                                >
                                  {/* Product Image */}
                                  <div className="relative aspect-square bg-gray-100 rounded border border-red-300 overflow-hidden flex-shrink-0 w-16 h-16">
                                    {item.imageUrl ? (
                                      <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        unoptimized={true}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <span className="text-xs text-gray-600">No Image</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Product Details */}
                                  <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                    <div className="flex gap-2 items-center">
                                      <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                                      {item.mode && (
                                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                          item.mode === 'rent'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {item.mode === 'rent' ? '🔄 Rental' : '🛍️ Buy'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stats - 3 column grid */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-red-200">
                          <div className="bg-red-50 rounded-lg p-2 text-center border border-red-300">
                            <p className="text-2xl font-bold text-red-700">{order.items?.length || '—'}</p>
                            <p className="text-xs text-red-600 font-medium">Items</p>
                          </div>
                          <div className={`rounded-lg p-2 text-center border ${
                            paymentStatus[order._id] === 'paid'
                              ? 'bg-green-50 border-green-300'
                              : 'bg-yellow-50 border-yellow-300'
                          }`}>
                            <p className="text-lg font-bold text-yellow-700">
                              ₦{order.total < 1000000 ? (order.total / 1000).toFixed(0) + 'K' : (order.total / 1000000).toFixed(1) + 'M'}
                            </p>
                            <p className={`text-xs font-medium ${
                              paymentStatus[order._id] === 'paid'
                                ? 'text-green-600'
                                : 'text-yellow-600'
                            }`}>
                              {paymentStatus[order._id] === 'paid' ? 'PAID' : 'Awaiting'}
                            </p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-300">
                            <p className="text-xs font-bold text-orange-700">{formatDate(order.createdAt)}</p>
                            <p className="text-xs text-orange-600 font-medium">{daysOld === 0 ? 'Today' : daysOld === 1 ? '1 day' : `${daysOld} days`}</p>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="pt-3 border-t border-red-200">
                          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Order Info</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Order: {order.orderNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3.5 w-3.5" />
                              {paymentStatus[order._id] === 'paid' ? (
                                <span className="text-green-600 font-semibold flex items-center gap-1">
                                  <span>✅ Payment Received</span>
                                </span>
                              ) : (
                                <span className="text-yellow-600 font-semibold">Status: Awaiting Payment</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-red-200 mt-auto">
                          <button
                            onClick={() => setConfirmModalOpen(order._id)}
                            disabled={approvingOrderId === order._id}
                            className={`flex-1 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                              paymentStatus[order._id] === 'paid'
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            } disabled:from-gray-400 disabled:to-gray-400`}
                          >
                            {approvingOrderId === order._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                {paymentStatus[order._id] === 'paid' ? 'Confirming...' : 'Approving...'}
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setChatModalOpen(order._id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Confirmation Modal */}
        {confirmModalOpen && (() => {
          const order = pending.find(o => o._id === confirmModalOpen);
          const isPaid = paymentStatus[confirmModalOpen] === 'paid';
          
          return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm mx-4 p-6 space-y-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto ${
                  isPaid ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {isPaid ? (
                    <Check className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-center text-gray-900">
                  {isPaid ? 'Payment Confirmed' : 'Verify Payment'}
                </h2>
                
                <div className="space-y-3">
                  <p className="text-center text-gray-600">
                    Order <span className="font-semibold">{order?.orderNumber}</span>
                  </p>
                  
                  <div className={`border rounded-lg p-4 ${
                    isPaid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <p className={`text-sm font-semibold mb-2 ${
                      isPaid ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      Payment Status:
                    </p>
                    <p className={`text-lg font-bold ${
                      isPaid ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {isPaid ? '✅ Payment Received' : '⏳ Awaiting Payment'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Amount:</span> {formatCurrency(order?.total || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    {isPaid 
                      ? '✅ Payment has been verified. You can now approve this order.'
                      : '⚠️ No payment detected yet. Please ensure payment has been received before approving.'}
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setConfirmModalOpen(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    {isPaid ? 'Cancel' : 'Go Back'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirmModalOpen) {
                        approvePayment(confirmModalOpen);
                        setConfirmModalOpen(null);
                      }
                    }}
                    disabled={!isPaid}
                    className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition ${
                      isPaid
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isPaid ? 'Approve Order' : 'Waiting for Payment'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
