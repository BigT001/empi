"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, AlertTriangle, Search, Calendar, AlertCircle } from "lucide-react";

interface PendingOrderData {
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
}

export function PendingPanel() {
  const [pending, setPending] = useState<PendingOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');

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
        const pendingList = ordersList.filter((o: any) => 
          o.status === 'pending' || o.status === 'unpaid' || o.status === 'processing'
        );
        if (mounted) setPending(pendingList);
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Pending / Unpaid Orders</h2>
            <p className="text-red-100 mt-1">⚠️ {pending.length} orders awaiting action</p>
          </div>
          <Clock className="h-8 w-8 opacity-20" />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-red-400">
          <div>
            <p className="text-red-100 text-sm">Total Pending Amount</p>
            <p className="font-bold text-lg">{formatCurrency(totalPendingAmount)}</p>
          </div>
          <div>
            <p className="text-red-100 text-sm">Orders Count</p>
            <p className="font-bold text-lg">{pending.length}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-red-200" />
          <input
            type="text"
            placeholder="Search by order #, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-red-500 placeholder-red-200 text-white outline-none focus:ring-2 focus:ring-white focus:bg-red-600 transition"
          />
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

        {/* Pending Orders List */}
        {!loading && !error && pending.length > 0 && (
          <>
            {/* Sort Controls */}
            <div className="flex items-center gap-2 mb-4">
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

            {/* Orders List */}
            <div className="space-y-3">
              {filteredPending.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending orders found</p>
                </div>
              ) : (
                filteredPending.map((order) => {
                  const daysOld = getDaysOld(order.createdAt);
                  return (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition hover:border-red-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Order Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900 font-mono text-sm">
                              {order.orderNumber || order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getUrgencyColor(daysOld)}`}>
                              {daysOld === 0 ? 'Today' : daysOld === 1 ? '1 day old' : `${daysOld} days old`}
                            </span>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <p className="font-semibold text-gray-900">
                              {order.firstName} {order.lastName}
                            </p>
                            <p className="text-gray-500">{order.email}</p>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>

                        {/* Right: Amount & Status */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(order.total)}
                          </p>
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                          </span>
                          {order.items && (
                            <p className="text-xs text-gray-500 mt-2">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {searchQuery && (
              <p className="text-sm text-gray-600 mt-4">
                Showing {filteredPending.length} of {pending.length} pending orders
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
