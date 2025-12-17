"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Search, Calendar, Package, User, Mail, DollarSign, AlertCircle, Eye, ChevronRight, TrendingUp } from "lucide-react";

interface ApprovedOrderData {
  _id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  total: number;
  status: string;
  createdAt: string;
  items: any[];
  paymentReference?: string;
}

export function ApprovedOrdersPanel() {
  const [approved, setApproved] = useState<ApprovedOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ApprovedOrderData | null>(null);

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

  const totalApprovedAmount = approved.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Total Revenue</p>
              <p className="text-3xl font-black text-green-900 mt-2">{formatCurrency(totalApprovedAmount)}</p>
              <p className="text-xs text-green-600 mt-2">From {approved.length} confirmed orders</p>
            </div>
            <div className="bg-green-600 text-white p-3 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Orders Count Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Confirmed</p>
              <p className="text-3xl font-black text-blue-900 mt-2">{approved.length}</p>
              <p className="text-xs text-blue-600 mt-2">Ready for fulfillment</p>
            </div>
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Average Order Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Avg Value</p>
              <p className="text-3xl font-black text-purple-900 mt-2">
                {formatCurrency(approved.length > 0 ? totalApprovedAmount / approved.length : 0)}
              </p>
              <p className="text-xs text-purple-600 mt-2">Per order</p>
            </div>
            <div className="bg-purple-600 text-white p-3 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-200">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="space-y-3">
                <div className="h-8 w-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
                <p className="text-gray-600 text-sm">Loading approved orders...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Error loading approved orders</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && approved.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-900 text-lg">No approved orders</p>
                <p className="text-gray-600 text-sm mt-1">Confirmed orders will appear here once customers complete payment</p>
              </div>
            </div>
          )}

          {/* Orders List */}
          {!loading && !error && approved.length > 0 && (
            <>
              {filteredApproved.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <p className="text-gray-500 text-sm">No orders match your search</p>
                </div>
              ) : (
                <div>
                  {filteredApproved.map((order, index) => (
                    <div
                      key={order._id}
                      className="p-5 hover:bg-gray-50 transition cursor-pointer group"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="font-bold text-gray-900 font-mono text-sm">
                              {order.orderNumber || order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {order.firstName} {order.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{order.email}</p>
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              <Package className="h-3 w-3" />
                              {order.items?.length || 0} items
                            </span>
                          </div>
                        </div>

                        {/* Right: Amount & Action */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-black text-green-600 mb-1">
                            {formatCurrency(order.total)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          >
                            View <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Info */}
              {filteredApproved.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 text-xs text-gray-600">
                  Showing {filteredApproved.length} of {approved.length} approved orders
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto md:max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold">Order Details</h3>
                <p className="text-green-100 text-sm mt-1">{selectedOrder.orderNumber || selectedOrder._id.slice(-8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white hover:bg-green-700 p-2 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 text-sm">Payment Confirmed</p>
                  <p className="text-xs text-green-700">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-600">Customer</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedOrder.email}</p>
                  </div>
                  {selectedOrder.phone && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedOrder.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-600">Items ({selectedOrder.items?.length || 0})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Total Amount</p>
                <p className="text-4xl font-black text-green-600 mb-3">{formatCurrency(selectedOrder.total)}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Payment Confirmed
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
