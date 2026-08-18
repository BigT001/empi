"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  AlertCircle,
  Users,
  UserCheck,
  UserPlus,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  ArrowUpDown,
  CheckCircle2
} from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";

interface BuyerData {
  _id: string;
  email: string;
  phone: string;
  fullName: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
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
  const [filterSegment, setFilterSegment] = useState<'all' | 'shoppers' | 'new' | 'admins'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'joined' | 'orders'>('joined');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        fetch('/api/orders/unified'),
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

  // Stats calculation
  const stats = useMemo(() => {
    const totalUsers = buyers.length;
    const activeShoppers = buyers.filter(b => (b.orderCount || 0) > 0).length;
    const now = Date.now();
    const recentSignups = buyers.filter(b => {
      const days = (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 30;
    }).length;
    const totalOrders = orders.length;

    return { totalUsers, activeShoppers, recentSignups, totalOrders };
  }, [buyers, orders]);

  // Filtered and sorted buyers
  const filteredAndSortedBuyers = useMemo(() => {
    let filtered = buyers.filter(b => {
      const matchesSearch =
        b.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.phone?.includes(searchQuery) ||
        b.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.state?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterSegment === 'shoppers') return (b.orderCount || 0) > 0;
      if (filterSegment === 'new') {
        const days = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return days <= 30;
      }
      if (filterSegment === 'admins') return b.isAdmin;

      return true;
    });

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
          compareVal = (a.orderCount || 0) - (b.orderCount || 0);
          break;
      }
      return sortOrder === 'desc' ? -compareVal : compareVal;
    });

    return filtered;
  }, [buyers, searchQuery, filterSegment, sortBy, sortOrder]);

  const resetPassword = async (buyerId: string) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/admin/buyers/${buyerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      alert(`Password reset successfully!\n\nTemporary Password: ${data.password}\n\nPlease copy and provide this password to the user.`);
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
      title: action === 'delete' ? 'Delete User Account' : 'Reset User Password',
      message:
        action === 'delete'
          ? `Are you sure you want to delete user account "${name || 'this user'}"? This action cannot be undone.`
          : `Reset password for "${name || 'this user'}"? A new random password will be generated for them.`,
    });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmOptions.action || !confirmOptions.targetId) return;
    if (confirmOptions.action === 'reset') {
      await resetPassword(confirmOptions.targetId);
    }
  };

  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id);

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Orders Count', 'City', 'State', 'Address', 'Member Since', 'Last Login'];
    const rows = filteredAndSortedBuyers.map(b => [
      `"${b.fullName || ''}"`,
      `"${b.email || ''}"`,
      `"${b.phone || ''}"`,
      b.orderCount || 0,
      `"${b.city || ''}"`,
      `"${b.state || ''}"`,
      `"${b.address || ''}"`,
      `"${formatDate(b.createdAt)}"`,
      `"${b.lastLogin ? formatDate(b.lastLogin) : 'Never'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `empi_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">User Management</h1>
            <span className="bg-lime-500/10 text-lime-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-lime-500/20">
              {buyers.length} Customers
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer accounts, view order activity, and reset user access credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            disabled={filteredAndSortedBuyers.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl border border-gray-300 shadow-2xs transition hover:shadow-xs disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-gray-500" />
            Export CSV
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition"
          >
            <RefreshCw className={`h-4 w-4 text-lime-400 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Analytical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Registered</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Active Directory
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-lime-50 border border-lime-200/60 flex items-center justify-center text-lime-700">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Active Shoppers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Shoppers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeShoppers}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Users with 1+ orders</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: New Signups (30d) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">New (Last 30 Days)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.recentSignups}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">Recent customer growth</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
            <UserPlus className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Total Customer Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Store Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Unified Order History</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Segment Filter & Sort */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Segment Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setFilterSegment('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterSegment === 'all'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Users ({buyers.length})
            </button>
            <button
              onClick={() => setFilterSegment('shoppers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterSegment === 'shoppers'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Shoppers ({stats.activeShoppers})
            </button>
            <button
              onClick={() => setFilterSegment('new')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterSegment === 'new'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              New 30d ({stats.recentSignups})
            </button>
            <button
              onClick={() => setFilterSegment('admins')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterSegment === 'admins'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Admins ({buyers.filter(b => b.isAdmin).length})
            </button>
          </div>
        </div>

        {/* Sort Bar */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-gray-700">Sort by:</span>
            {(['joined', 'name', 'email', 'orders'] as const).map(option => (
              <button
                key={option}
                onClick={() => {
                  if (sortBy === option) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(option);
                    setSortOrder('desc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  sortBy === option
                    ? 'bg-lime-500/10 text-lime-800 font-bold border border-lime-500/20'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option === 'name' && 'Name'}
                {option === 'email' && 'Email'}
                {option === 'joined' && 'Joined Date'}
                {option === 'orders' && 'Order Count'}
                {sortBy === option && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>

          <span className="font-medium text-gray-400">
            Showing {filteredAndSortedBuyers.length} of {buyers.length} accounts
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-900 text-sm">Failed to load user directory</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-xs font-bold text-red-800 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center space-y-4">
          <div className="h-10 w-10 border-3 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">Fetching customer accounts...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && buyers.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="h-14 w-14 bg-lime-50 text-lime-600 rounded-2xl flex items-center justify-center mx-auto border border-lime-200/60">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No Registered Customers Yet</h3>
          <p className="text-xs text-gray-500">
            When users register accounts on your store or place custom orders, they will appear here.
          </p>
        </div>
      )}

      {/* Main Users Table */}
      {!loading && !error && buyers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Contact & Location</th>
                  <th className="px-6 py-3.5">Orders</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5">Last Active</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredAndSortedBuyers.map((buyer) => {
                  const userOrders = orders.filter((o: any) => String(o.buyerId) === String(buyer._id));
                  const isExpanded = expanded === buyer._id;

                  return (
                    <Fragment key={buyer._id}>
                      <tr className={`transition-colors ${isExpanded ? 'bg-lime-50/30' : 'hover:bg-gray-50/60'}`}>
                        {/* Customer Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center text-black font-black text-xs shadow-xs shrink-0">
                              {getInitials(buyer.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-xs truncate">{buyer.fullName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {buyer.isAdmin ? (
                                  <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.2 rounded-full border border-purple-200">
                                    Admin
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.2 rounded-full">
                                    Customer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact & Location */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                              <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{buyer.email}</span>
                              <button
                                onClick={() => copyToClipboard(buyer.email, `email-${buyer._id}`)}
                                className="text-gray-400 hover:text-gray-600 transition"
                                title="Copy Email"
                              >
                                {copiedId === `email-${buyer._id}` ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                ) : null}
                              </button>
                            </div>
                            {buyer.phone ? (
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span>{buyer.phone}</span>
                              </div>
                            ) : null}
                            {(buyer.city || buyer.state) && (
                              <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span>{[buyer.city, buyer.state].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Orders */}
                        <td className="px-6 py-4">
                          {buyer.orderCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200/60">
                              <ShoppingBag className="h-3.5 w-3.5" />
                              {buyer.orderCount} {buyer.orderCount === 1 ? 'order' : 'orders'}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">0 orders</span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>{formatDate(buyer.createdAt)}</span>
                          </div>
                        </td>

                        {/* Last Active */}
                        <td className="px-6 py-4">
                          {buyer.lastLogin ? (
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium text-[11px]">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {formatDate(buyer.lastLogin)}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">Never logged in</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleExpand(buyer._id)}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                                isExpanded
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              title={isExpanded ? 'Hide Customer Activity' : 'View Customer Activity'}
                            >
                              {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              <span>{isExpanded ? 'Hide' : 'Details'}</span>
                            </button>

                            <button
                              onClick={() => openConfirm('reset', buyer._id, buyer.fullName)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200/60"
                              title="Reset Password"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Drawer Details */}
                      {isExpanded && (
                        <tr className="bg-gray-50/60 border-t border-b border-gray-200/80">
                          <td colSpan={6} className="px-6 py-5">
                            <div className="space-y-4">
                              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                                <Users className="h-4 w-4 text-lime-600" />
                                Customer Profile & Order History
                              </h4>

                              {/* Customer Information Cards Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Account Email</p>
                                  <p className="text-xs font-semibold text-gray-900 mt-1 break-all">{buyer.email}</p>
                                </div>
                                <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                                  <p className="text-xs font-semibold text-gray-900 mt-1">{buyer.phone || 'Not provided'}</p>
                                </div>
                                <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">City & State</p>
                                  <p className="text-xs font-semibold text-gray-900 mt-1">
                                    {[buyer.city, buyer.state].filter(Boolean).join(', ') || 'Not specified'}
                                  </p>
                                </div>
                                <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Member Duration</p>
                                  <p className="text-xs font-semibold text-gray-900 mt-1">
                                    {Math.floor((Date.now() - new Date(buyer.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                                  </p>
                                </div>
                                <div className="bg-white p-3.5 rounded-xl border border-gray-200 md:col-span-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Street Address</p>
                                  <p className="text-xs font-semibold text-gray-900 mt-1">{buyer.address || 'No street address on file'}</p>
                                </div>
                                <div className="bg-white p-3.5 rounded-xl border border-gray-200 md:col-span-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Postal Code</p>
                                  <p className="text-xs font-semibold text-gray-900 mt-1">{buyer.postalCode || 'N/A'}</p>
                                </div>
                              </div>

                              {/* Customer Orders Breakdown */}
                              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-emerald-600" />
                                    Order History ({userOrders.length})
                                  </h5>
                                </div>

                                {userOrders.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">This user has not placed any orders yet.</p>
                                ) : (
                                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {userOrders.map((order: any) => (
                                      <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/80 transition">
                                        <div>
                                          <p className="text-xs font-bold text-gray-900">
                                            Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                                          </p>
                                          <p className="text-[11px] text-gray-500 mt-0.5">{formatDateTime(order.createdAt)}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs font-extrabold text-gray-900">
                                            ₦{Number(order.total || order.totalAmount || 0).toLocaleString()}
                                          </p>
                                          <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                            order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                            order.status === 'pending' || order.status === 'processing' ? 'bg-amber-100 text-amber-700' :
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

          {filteredAndSortedBuyers.length === 0 && searchQuery && (
            <div className="p-8 text-center text-gray-500 text-xs">
              No customer accounts found matching &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmOptions.title}
        message={confirmOptions.message}
        loading={confirmLoading}
        confirmLabel={confirmOptions.action === 'delete' ? 'Delete' : 'Reset Password'}
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
