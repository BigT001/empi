"use client";

import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Search, Calendar, AlertCircle, Filter } from "lucide-react";

interface OrderData {
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

export function OrdersPanel() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/orders?limit=100');
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        // Handle both API response formats
        const ordersList = data.orders || (Array.isArray(data) ? data : []);
        console.log('[OrdersPanel] Loaded orders:', ordersList.length);
        console.log('[OrdersPanel] Full response:', data);
        if (ordersList.length > 0) {
          console.log('[OrdersPanel] Sample order:', JSON.stringify(ordersList[0], null, 2));
          console.log('[OrdersPanel] Order statuses:', ordersList.map((o: any) => ({ orderNum: o.orderNumber, status: o.status, statusType: typeof o.status })));
        }
        if (mounted) setOrders(ordersList);
      } catch (err: any) {
        console.error('[OrdersPanel] Error loading orders:', err);
        if (mounted) setError(err.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => {
        const orderStatus = o.status?.toLowerCase();
        const filterStatus = statusFilter.toLowerCase();
        
        // Map similar statuses together
        if (filterStatus === 'confirmed') {
          return orderStatus === 'confirmed' || orderStatus === 'completed';
        } else if (filterStatus === 'pending') {
          return orderStatus === 'pending' || orderStatus === 'unpaid';
        }
        
        return orderStatus === filterStatus;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, statusFilter]);

  useEffect(() => {
    console.log('[OrdersPanel] Filtered orders:', filteredOrders.length, 'for status filter:', statusFilter);
  }, [filteredOrders, statusFilter]);

  const formatCurrency = (amount: number) =>
    `₦${Number(amount || 0).toLocaleString()}`;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      confirmed: orders.filter(o => o.status?.toLowerCase() === 'confirmed' || o.status?.toLowerCase() === 'completed').length,
      pending: orders.filter(o => o.status?.toLowerCase() === 'pending' || o.status?.toLowerCase() === 'unpaid').length,
      cancelled: orders.filter(o => o.status?.toLowerCase() === 'cancelled').length,
    };
    console.log('[OrdersPanel] Status counts:', counts);
    return counts;
  };

  const counts = getStatusCounts();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Recent Orders</h2>
            <p className="text-orange-100 mt-1">{orders.length} total orders</p>
          </div>
          <ShoppingBag className="h-8 w-8 opacity-20" />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-orange-200" />
          <input
            type="text"
            placeholder="Search by order #, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-orange-500 placeholder-orange-200 text-white outline-none focus:ring-2 focus:ring-white focus:bg-orange-600 transition"
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
              <p className="font-semibold text-red-900">Error loading orders</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-3">
              <div className="h-8 w-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 text-sm">Loading orders...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-900">No orders yet</p>
              <p className="text-gray-600 text-sm mt-1">Orders will appear here once customers make purchases</p>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        {!loading && !error && orders.length > 0 && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'All Orders', count: counts.all },
                { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
                { key: 'pending', label: 'Pending', count: counts.pending },
                { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition ${
                    statusFilter === tab.key
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} <span className="text-xs ml-1">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <th className="px-4 py-3">Order #</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <p className="text-gray-500">No orders found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900 font-mono text-sm">
                              {order.orderNumber || order._id.slice(-8).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {order.firstName} {order.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{order.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {searchQuery && (
              <p className="text-sm text-gray-600 mt-4">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
