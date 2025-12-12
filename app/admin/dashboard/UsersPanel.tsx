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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600 opacity-10 rounded-full -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600 opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black">Registered Users</h2>
              <p className="text-slate-300 text-base mt-2">{buyers.length} total customers in your store</p>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
            >
              Refresh
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700 placeholder-slate-400 text-white outline-none focus:ring-2 focus:ring-purple-500 focus:bg-slate-600 transition"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
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
        <div className="flex items-center justify-center py-16">
          <div className="space-y-3 text-center">
            <div className="h-12 w-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 text-base font-medium">Loading users...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && buyers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-gray-50 rounded-2xl p-12 text-center max-w-sm">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
            <p className="font-black text-gray-900 text-lg">No Registered Users Yet</p>
            <p className="text-gray-600 text-sm mt-2">Users who sign up for an account will appear here</p>
          </div>
        </div>
      )}

      {/* Users List */}
      {!loading && !error && buyers.length > 0 && (
        <div className="space-y-4">
          {/* Sort Controls */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-700 uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 hover:border-gray-400 transition"
              >
                <option value="joined">Joined Date</option>
                <option value="name">Name (A-Z)</option>
                <option value="email">Email</option>
                <option value="orders">Orders Count</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
            {searchQuery && (
              <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg font-semibold">
                Found {filteredAndSortedBuyers.length} of {buyers.length} users
              </span>
            )}
          </div>

          {/* Users Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr className="text-left text-xs font-black text-gray-700 uppercase tracking-widest">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4">Member Since</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {filteredAndSortedBuyers.map((buyer) => {
                      const userOrders = orders.filter((o: any) => String(o.buyerId) === String(buyer._id));
                      const isExpanded = expanded === buyer._id;

                      return (
                        <Fragment key={buyer._id}>
                          {/* Main Row */}
                          <tr className="hover:bg-purple-50 transition border-b border-gray-200">
                            {/* User Info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base ${getAvatarColor(buyer._id)} shadow-sm`}>
                                  {getInitials(buyer.fullName)}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{buyer.fullName}</p>
                                  {buyer.isAdmin && (
                                    <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-black rounded-full">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="truncate">{buyer.email}</span>
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
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-purple-600" />
                                <span className="font-black text-gray-900 text-lg">{buyer.orderCount}</span>
                              </div>
                            </td>

                            {/* Joined */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {formatDate(buyer.createdAt)}
                              </div>
                            </td>

                            {/* Last Active */}
                            <td className="px-6 py-4">
                              {buyer.lastLogin ? (
                                <span className="inline-block px-3 py-1.5 bg-green-100 text-green-700 text-xs font-black rounded-full">
                                  {formatDate(buyer.lastLogin)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500 font-medium">Never</span>
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
