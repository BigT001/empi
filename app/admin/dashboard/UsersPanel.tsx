"use client";

import { useState, useEffect, Fragment } from "react";
import ConfirmModal from "@/app/components/ConfirmModal";

export function UsersPanel() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
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
      const [bRes, oRes] = await Promise.all([
        fetch('/api/admin/buyers'),
        fetch('/api/orders'),
      ]);
      const bData = bRes.ok ? await bRes.json() : { buyers: [] };
      const oData = oRes.ok ? await oRes.json() : [];
      setBuyers(bData.buyers || []);
      const ordersList = Array.isArray(oData) ? oData : (oData.orders || oData || []);
      setOrders(ordersList);
    } catch (err) {
      console.error('Failed to load buyers or orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) loadData();
    return () => { mounted = false; };
  }, []);

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
      console.error(err);
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
      console.error(err);
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">Registered Users</h2>
      {loading ? (
        <p className="text-sm text-gray-600">Loading users...</p>
      ) : buyers.length === 0 ? (
        <p className="text-sm text-gray-600">No registered users</p>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Phone</th>
                  <th className="px-2 py-2">Orders</th>
                  <th className="px-2 py-2">Last Login</th>
                  <th className="px-2 py-2">Joined</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b: any) => {
                  const userOrders = orders.filter((o: any) => String(o.buyerId) === String(b._id));
                  return (
                    <Fragment key={b._id}>
                      <tr className="border-t">
                        <td className="px-2 py-3">{b.fullName || '—'}</td>
                        <td className="px-2 py-3">{b.email}</td>
                        <td className="px-2 py-3">{b.phone || '—'}</td>
                        <td className="px-2 py-3">{b.orderCount ?? userOrders.length}</td>
                        <td className="px-2 py-3">{b.lastLogin ? new Date(b.lastLogin).toLocaleString() : '—'}</td>
                        <td className="px-2 py-3">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="px-2 py-3 space-x-2">
                          <button onClick={() => toggleExpand(b._id)} className="text-sm text-lime-600">{expanded === b._id ? 'Hide' : 'View'}</button>
                          <button onClick={() => openConfirm('reset', b._id, b.fullName || b.email)} className="text-sm text-blue-600">Reset</button>
                          <button onClick={() => openConfirm('delete', b._id, b.fullName || b.email)} className="text-sm text-red-600">Delete</button>
                        </td>
                      </tr>
                      {expanded === b._id && (
                        <tr key={`${b._id}-details`} className="bg-gray-50">
                          <td colSpan={7} className="p-4">
                            <div className="space-y-2">
                              <div className="text-sm text-gray-700">Recent activity (last 5 orders)</div>
                              {userOrders.length === 0 ? (
                                <div className="text-sm text-gray-500">No orders</div>
                              ) : (
                                <div className="space-y-2">
                                  {userOrders.slice(0,5).map((o:any) => (
                                    <div key={o._id} className="flex justify-between text-sm">
                                      <div>{o.orderNumber || o._id}</div>
                                      <div className="text-gray-600">{new Date(o.createdAt).toLocaleString()}</div>
                                      <div className="font-semibold">₦{Number(o.total || o.totalAmount || 0).toLocaleString()}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
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
      )}
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
