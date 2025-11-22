"use client";

import { useState, useEffect } from "react";

export function OrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/orders?limit=20');
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        if (mounted) setOrders(data.orders || data || []);
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
      <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-600">No recent orders</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o: any) => (
            <div key={o._id || o.id || o.orderId} className="flex justify-between">
              <div>
                <div className="font-medium">{o.orderId || o._id}</div>
                <div className="text-xs text-gray-500">{new Date(o.createdAt || o.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(o.totalAmount || 0)}</div>
                <div className="text-xs text-gray-500">{o.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
