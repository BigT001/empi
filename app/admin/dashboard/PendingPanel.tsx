"use client";

import { useState, useEffect } from "react";

export function PendingPanel() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/orders?limit=100');
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        const list = (data.orders || data || []).filter((o: any) => o.status === 'pending' || o.status === 'unpaid');
        if (mounted) setPending(list);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">Pending / Unpaid</h2>
      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : pending.length === 0 ? (
        <p className="text-sm text-gray-600">No pending invoices</p>
      ) : (
        <div className="space-y-3">
          {pending.map((o: any) => (
            <div key={o._id || o.id} className="flex justify-between">
              <div>
                <div className="font-medium">{o.orderId || o._id}</div>
                <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(o.totalAmount || 0)}</div>
                <div className="text-xs text-orange-600">{o.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
