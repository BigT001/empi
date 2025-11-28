"use client";

import { useState, useEffect, useMemo } from "react";
import { Palette, Search, AlertCircle, Clock, CheckCircle, Eye, EyeOff } from "lucide-react";

interface CustomOrder {
  _id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state?: string;
  costumeType: string;
  description: string;
  budget?: number;
  deliveryDate?: string;
  status: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  quotedPrice?: number;
  createdAt: string;
}

export function CustomOrdersPanel() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = async () => {
    let mounted = true;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/custom-orders');
      if (!res.ok) throw new Error('Failed to load custom orders');
      const data = await res.json();
      if (mounted) setOrders(data.orders || []);
    } catch (err: any) {
      console.error('[CustomOrdersPanel] Error loading orders:', err);
      if (mounted) setError(err.message || 'Failed to load custom orders');
    } finally {
      if (mounted) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.costumeType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "approved":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "in-progress":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "ready":
        return "bg-green-100 text-green-700 border-green-300";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
      case "in-progress":
        return <AlertCircle className="h-4 w-4" />;
      case "ready":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Palette className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => `₦${Number(amount || 0).toLocaleString()}`;

  const statuses = ['all', 'pending', 'approved', 'in-progress', 'ready', 'completed', 'rejected'];
  const statusCounts = statuses.reduce((acc, status) => {
    if (status === 'all') return acc;
    acc[status] = orders.filter(o => o.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Custom Orders</h2>
            <p className="text-purple-100 mt-1">{orders.length} total custom orders</p>
          </div>
          <Palette className="h-8 w-8 opacity-20" />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-purple-200" />
          <input
            type="text"
            placeholder="Search by order number, customer name, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-purple-500 placeholder-purple-200 text-white outline-none focus:ring-2 focus:ring-white focus:bg-purple-600 transition"
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
              <p className="font-semibold text-red-900">Error loading custom orders</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={loadOrders}
                className="mt-2 text-sm font-semibold text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-3">
              <div className="h-8 w-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 text-sm">Loading custom orders...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Palette className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-900">No custom orders yet</p>
              <p className="text-gray-600 text-sm mt-1">Custom costume requests will appear here</p>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        {!loading && !error && orders.length > 0 && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition ${
                    statusFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  {status !== 'all' && <span className="text-xs ml-1">({statusCounts[status] || 0})</span>}
                </button>
              ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No custom orders found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedId === order._id;
                  
                  return (
                    <div key={order._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                      {/* Order Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition flex items-start justify-between"
                        onClick={() => setExpandedId(isExpanded ? null : order._id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-bold text-gray-900">{order.orderNumber}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">{order.fullName}</p>
                            <p className="line-clamp-1">{order.costumeType} • {order.city}</p>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                          {order.quotedPrice && (
                            <p className="font-semibold text-gray-900 text-sm mt-1">{formatCurrency(order.quotedPrice)}</p>
                          )}
                          {!isExpanded && <Eye className="h-4 w-4 text-gray-400 mt-2 mx-auto" />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                          {/* Customer Info */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Customer Information</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><span className="font-medium">Email:</span> {order.email}</p>
                              <p><span className="font-medium">Phone:</span> {order.phone}</p>
                              <p><span className="font-medium">Location:</span> {order.city}{order.state ? `, ${order.state}` : ''}</p>
                            </div>
                          </div>

                          {/* Order Details */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Order Details</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><span className="font-medium">Costume Type:</span> {order.costumeType}</p>
                              {order.budget && (
                                <p><span className="font-medium">Budget:</span> {formatCurrency(order.budget)}</p>
                              )}
                              {order.deliveryDate && (
                                <p><span className="font-medium">Needed by:</span> {new Date(order.deliveryDate).toLocaleDateString()}</p>
                              )}
                              {order.quotedPrice && (
                                <p><span className="font-medium">Quoted Price:</span> {formatCurrency(order.quotedPrice)}</p>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Description</h4>
                            <p className="text-xs text-gray-700 bg-white rounded p-2 border border-gray-300 line-clamp-3">{order.description}</p>
                          </div>

                          {/* View Details Link */}
                          <div className="pt-2 border-t border-gray-300">
                            <a
                              href={`/admin/custom-orders`}
                              className="text-xs font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                            >
                              View Full Details →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {searchQuery && (
              <p className="text-sm text-gray-600 mt-4">
                Showing {filteredOrders.length} of {orders.length} custom orders
              </p>
            )}

            {/* Stats Footer */}
            <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <p className="text-gray-700 font-medium">
                📋 Total Custom Orders: <span className="text-purple-600 font-bold">{orders.length}</span> | Showing: <span className="text-purple-600 font-bold">{filteredOrders.length}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
