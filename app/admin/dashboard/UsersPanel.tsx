"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Trash2, RotateCcw, Eye, EyeOff, Mail, Phone, Calendar, ShoppingBag, AlertCircle } from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";

interface BuyerData {
  _id: string;
  email: string;
  phone: string;
  fullName: string;
  createdAt: string;
  lastLogin?: string;
  isAdmin: boolean;
  orderCount: number;
}

export function UsersPanel() {
  const [buyers, setBuyers] = useState<BuyerData[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'joined' | 'orders'>('joined');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<{
    title?: string;
    message?: string;
    action: 'delete' | 'reset' | null;
    targetId?: string | null;
  }>({ title: undefined, message: undefined, action: null, targetId: null });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bRes, oRes] = await Promise.all([
        fetch('/api/admin/buyers'),
        fetch('/api/orders'),
      ]);
      
      if (!bRes.ok) {
        throw new Error('Failed to fetch buyers');
      }
      
      const bData = await bRes.json();
      const oData = oRes.ok ? await oRes.json() : { orders: [] };
      
      setBuyers(bData.buyers || []);
      const ordersList = Array.isArray(oData) ? oData : (oData.orders || []);
      setOrders(ordersList);
    } catch (err: any) {
      console.error('[UsersPanel] Error loading data:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) loadData();
    return () => { mounted = false; };
  }, []);

  // Filtered and sorted buyers
  const filteredAndSortedBuyers = useMemo(() => {
    let filtered = buyers.filter(b =>
      b.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone?.includes(searchQuery)
    );

    // Sort
    filtered.sort((a, b) => {
      let compareVal = 0;
      switch (sortBy) {
        case 'name':
          compareVal = (a.fullName || '').localeCompare(b.fullName || '');
          break;
        case 'email':
          compareVal = a.email.localeCompare(b.email);
          break;
        case 'joined':
          compareVal = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'orders':
          compareVal = a.orderCount - b.orderCount;
          break;
      }
      return sortOrder === 'desc' ? -compareVal : compareVal;
    });

    return filtered;
  }, [buyers, searchQuery, sortBy, sortOrder]);

  const deleteBuyer = async (buyerId: string) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/admin/buyers/${buyerId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete user');
      }
      await loadData();
    } catch (err: any) {
      console.error('[UsersPanel] Delete error:', err);
      alert(err.message || 'Failed to delete user');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
    }
  };

  const resetPassword = async (buyerId: string) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/admin/buyers/${buyerId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      alert(`Password reset. New password: ${data.password}`);
    } catch (err: any) {
      console.error('[UsersPanel] Reset password error:', err);
      alert(err.message || 'Failed to reset password');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
    }
  };

  const openConfirm = (action: 'delete' | 'reset', targetId: string, name?: string) => {
    setConfirmOptions({
      action,
      targetId,
      title: action === 'delete' ? 'Delete user' : 'Reset password',
      message:
        action === 'delete'
          ? `Delete this user${name ? ` (${name})` : ''}? This action is irreversible.`
          : `Reset password for this user${name ? ` (${name})` : ''}? The new password will be shown once and you should share it securely.`,
    });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmOptions.action || !confirmOptions.targetId) return;
    if (confirmOptions.action === 'delete') {
      await deleteBuyer(confirmOptions.targetId);
    } else if (confirmOptions.action === 'reset') {
      await resetPassword(confirmOptions.targetId);
    }
  };

  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const getAvatarColor = (id: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
    const hash = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    return colors[hash % colors.length];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Registered Users</h2>
            <p className="text-purple-100 mt-1">{buyers.length} total customers</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-purple-200" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
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
              <p className="font-semibold text-red-900">Error loading users</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={loadData}
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
              <p className="text-gray-600 text-sm">Loading users...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && buyers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-900">No registered users yet</p>
              <p className="text-gray-600 text-sm mt-1">Users who sign up will appear here</p>
            </div>
          </div>
        )}

        {/* Users List */}
        {!loading && !error && buyers.length > 0 && (
          <div className="space-y-3">
            {/* Sort Controls */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="joined">Joined Date</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="orders">Orders Count</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              {searchQuery && (
                <span className="text-sm text-gray-600">
                  Found {filteredAndSortedBuyers.length} of {buyers.length}
                </span>
              )}
            </div>

            {/* Users Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Member Since</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAndSortedBuyers.map((buyer) => {
                      const userOrders = orders.filter((o: any) => String(o.buyerId) === String(buyer._id));
                      const isExpanded = expanded === buyer._id;

                      return (
                        <Fragment key={buyer._id}>
                          {/* Main Row */}
                          <tr className="hover:bg-gray-50 transition">
                            {/* User Info */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(buyer._id)}`}>
                                  {getInitials(buyer.fullName)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{buyer.fullName}</p>
                                  {buyer.isAdmin && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  {buyer.email}
                                </div>
                                {buyer.phone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {buyer.phone}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Orders */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">{buyer.orderCount}</span>
                              </div>
                            </td>

                            {/* Joined */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {formatDate(buyer.createdAt)}
                              </div>
                            </td>

                            {/* Last Active */}
                            <td className="px-4 py-3">
                              {buyer.lastLogin ? (
                                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                  {formatDate(buyer.lastLogin)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">Never</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleExpand(buyer._id)}
                                  className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-600"
                                  title={isExpanded ? 'Hide details' : 'View details'}
                                >
                                  {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => openConfirm('reset', buyer._id, buyer.fullName)}
                                  className="p-1.5 hover:bg-blue-100 rounded-lg transition text-blue-600"
                                  title="Reset password"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openConfirm('delete', buyer._id, buyer.fullName)}
                                  className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-gray-50 border-t-2 border-purple-200">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="space-y-4">
                                  {/* User Info Cards */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                      <p className="text-xs font-semibold text-gray-600 uppercase">Email</p>
                                      <p className="text-sm text-gray-900 mt-1 break-all">{buyer.email}</p>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                      <p className="text-xs font-semibold text-gray-600 uppercase">Phone</p>
                                      <p className="text-sm text-gray-900 mt-1">{buyer.phone || '—'}</p>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                      <p className="text-xs font-semibold text-gray-600 uppercase">Member for</p>
                                      <p className="text-sm text-gray-900 mt-1">
                                        {Math.floor((Date.now() - new Date(buyer.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                                      </p>
                                    </div>
                                  </div>

                                  {/* Recent Orders */}
                                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Recent Orders ({userOrders.length})</h4>
                                    {userOrders.length === 0 ? (
                                      <p className="text-sm text-gray-500">No orders yet</p>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {userOrders.slice(0, 5).map((order: any) => (
                                          <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <div className="flex-1">
                                              <p className="text-sm font-semibold text-gray-900">
                                                Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                                              </p>
                                              <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-semibold text-gray-900">₦{Number(order.total || order.totalAmount || 0).toLocaleString()}</p>
                                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                              }`}>
                                                {order.status || 'Pending'}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* No results message */}
            {filteredAndSortedBuyers.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p className="text-gray-600">No users match your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmOptions.title}
        message={confirmOptions.message}
        loading={confirmLoading}
        confirmLabel={confirmOptions.action === 'delete' ? 'Delete' : 'Reset'}
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
