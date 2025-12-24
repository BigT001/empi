"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Search, Calendar, Package, User, Mail, DollarSign, AlertCircle, Eye, ChevronRight, TrendingUp, Download, Trash2, MessageSquare } from "lucide-react";
import Image from "next/image";
import { ChatModal } from "@/app/components/ChatModal";

interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  mode?: string;
  imageUrl?: string;
}

interface ApprovedOrderData {
  _id: string;
  orderNumber: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  buyerName?: string;
  email: string;
  phone?: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  paymentReference?: string;
}

interface ApprovedOrdersPanelProps {
  searchQuery?: string;
}

export function ApprovedOrdersPanel({ searchQuery = "" }: ApprovedOrdersPanelProps) {
  const [approved, setApproved] = useState<ApprovedOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApprovedOrderData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/orders?limit=500');
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        const ordersList = Array.isArray(data) ? data : (data.orders || []);
        // Filter for approved/confirmed/completed orders only
        const approvedList = ordersList.filter((o: any) => 
          o.status === 'confirmed' || o.status === 'completed' || o.status === 'approved'
        ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (mounted) setApproved(approvedList);
      } catch (err: any) {
        console.error('[ApprovedOrdersPanel] Error loading approved orders:', err);
        if (mounted) setError(err.message || 'Failed to load approved orders');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter approved orders
  const filteredApproved = useMemo(() => {
    if (!searchQuery) return approved;
    return approved.filter(o =>
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [approved, searchQuery]);

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

  const getCustomerName = (order: ApprovedOrderData) => {
    if (order.fullName) return order.fullName;
    if (order.firstName && order.lastName) return `${order.firstName} ${order.lastName}`;
    if (order.buyerName) return order.buyerName;
    return 'Customer';
  };

  const totalApprovedAmount = approved.reduce((sum, o) => sum + o.total, 0);

  const deleteAllApprovedOrders = async () => {
    if (!window.confirm(`Are you sure you want to delete all ${approved.length} approved orders? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      let deletedCount = 0;
      let failedCount = 0;

      for (const order of approved) {
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

      setApproved([]);
      const message = failedCount > 0 
        ? `Deleted ${deletedCount} orders, ${failedCount} failed`
        : `All ${deletedCount} approved orders deleted successfully!`;
      showToast(message, failedCount > 0 ? 'error' : 'success');
    } catch (err: any) {
      console.error('[ApprovedOrdersPanel] Error deleting all approved orders:', err);
      showToast(err.message || 'Failed to delete approved orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Content */}
        <div className="p-6">
          {/* Error State */}
          {error && !loading && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error loading approved orders</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="space-y-3">
                <div className="h-8 w-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
                <p className="text-gray-600 text-sm">Loading approved orders...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && approved.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">No approved orders</p>
                <p className="text-gray-600 text-sm mt-1">Confirmed orders will appear here once customers complete payment</p>
              </div>
            </div>
          )}

          {/* Approved Orders Cards Grid */}
          {!loading && !error && approved.length > 0 && (
            <>
              {/* Filter Results Info and Delete All Button */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  {filteredApproved.length} of {approved.length} orders
                </p>
                <button
                  onClick={deleteAllApprovedOrders}
                  disabled={approved.length === 0 || loading}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </button>
              </div>

              {filteredApproved.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 font-semibold">No approved orders found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredApproved.map((order) => {
                    const daysOld = getDaysOld(order.createdAt);

                    return (
                      <div
                        key={order._id}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 overflow-hidden shadow-md hover:shadow-xl hover:border-green-300 transition-all flex flex-col"
                      >
                        {/* Header - Customer Info */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
                          <h3 className="font-bold text-lg">{getCustomerName(order)}</h3>
                          <p className="text-sm text-green-100 truncate">{order.email}</p>
                          {order.phone && <p className="text-sm text-green-100">{order.phone}</p>}
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col">
                          {/* Product Images Gallery */}
                          {order.items && order.items.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-semibold text-gray-600 uppercase">Product Images</p>
                              </div>
                              <div className="overflow-x-auto pb-2">
                                <div className="flex gap-2 min-w-min">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={`${order._id}-item-${idx}`}
                                      className="relative aspect-square bg-gray-100 rounded border border-green-300 overflow-hidden flex-shrink-0 w-20 h-20"
                                    >
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
                                      {item.quantity > 1 && (
                                        <div className="absolute bottom-0 right-0 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-tl">
                                          ×{item.quantity}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 text-center">← Scroll to see more items →</p>
                            </div>
                          )}

                          {/* Stats - 3 column grid */}
                          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-green-200">
                            <div className="bg-green-50 rounded-lg p-2 text-center border border-green-300">
                              <p className="text-2xl font-bold text-green-700">{order.items?.length || '—'}</p>
                              <p className="text-xs text-green-600 font-medium">Items</p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-300">
                              <p className="text-lg font-bold text-emerald-700">
                                ₦{order.total < 1000000 ? (order.total / 1000).toFixed(0) + 'K' : (order.total / 1000000).toFixed(1) + 'M'}
                              </p>
                              <p className="text-xs text-emerald-600 font-medium">Confirmed</p>
                            </div>
                            <div className="bg-teal-50 rounded-lg p-2 text-center border border-teal-300">
                              <p className="text-xs font-bold text-teal-700">{formatDate(order.createdAt)}</p>
                              <p className="text-xs text-teal-600 font-medium">{daysOld === 0 ? 'Today' : daysOld === 1 ? '1 day' : `${daysOld} days`}</p>
                            </div>
                          </div>

                          {/* Order Details */}
                          <div className="pt-3 border-t border-green-200">
                            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Order Info</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Order: {order.orderNumber}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Status: Confirmed</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex gap-2 pt-4 border-t border-green-200 mt-auto">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setChatModalOpen(true);
                              }}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="h-4 w-4" />
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
        </div>
      </div>

      {/* Chat Modal */}
      {chatModalOpen && selectedOrder && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedOrder(null);
          }}
          order={{
            _id: selectedOrder._id,
            orderNumber: selectedOrder.orderNumber,
            fullName: getCustomerName(selectedOrder),
            email: selectedOrder.email,
            phone: (selectedOrder.phone as string) || '',
            items: selectedOrder.items,
            quantity: selectedOrder.items?.length || 1,
          }}
          userEmail="logistics@empi.com"
          userName="Logistics Team"
          isAdmin={true}
          isLogisticsTeam={true}
          adminName="Logistics Team"
          orderStatus="confirmed"
          onMessageSent={() => {
            console.log('[ApprovedOrdersPanel] Message sent by logistics team');
          }}
        />
      )}
    </div>
  );
}
