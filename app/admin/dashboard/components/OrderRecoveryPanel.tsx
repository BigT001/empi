'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, FileText, Loader2, RotateCcw, Trash2 } from 'lucide-react';

interface UnrecordedInvoice {
  _id: string;
  invoiceNumber: string;
  orderNumber?: string;
  customerName?: string;
  totalAmount?: number;
  status?: string;
  invoiceDate?: string;
  createdAt?: string;
}

interface DeletedOrder {
  _id: string;
  orderNumber: string;
  firstName?: string;
  lastName?: string;
  total?: number;
  status?: string;
  paymentVerified?: boolean;
  deletedAt?: string;
}

const naira = (n = 0) => `₦${Math.round(n).toLocaleString('en-NG')}`;
const shortDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/**
 * Surfaces sales that are missing from the Orders list:
 *  - manual invoices that were never recorded as orders (one click to record them)
 *  - orders that were removed from the dashboard (restore any of them)
 * Nothing here deletes data; recording only adds orders and restoring only un-hides them.
 */
export function OrderRecoveryPanel({ onChanged }: { onChanged: () => void }) {
  const [invoices, setInvoices] = useState<UnrecordedInvoice[]>([]);
  const [deleted, setDeleted] = useState<DeletedOrder[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showInvoices, setShowInvoices] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [invRes, delRes] = await Promise.all([
        fetch('/api/admin/orders/unrecorded', { cache: 'no-store' }),
        fetch('/api/admin/orders/deleted', { cache: 'no-store' }),
      ]);
      if (invRes.ok) {
        const data = await invRes.json();
        const list: UnrecordedInvoice[] = data.invoices || [];
        setInvoices(list);
        setSelected(new Set(list.map((i) => i._id)));
      }
      if (delRes.ok) {
        const data = await delRes.json();
        setDeleted(data.orders || []);
      }
    } catch (err) {
      console.error('[OrderRecoveryPanel] Failed to load:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load();
  }, [load]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const recordSelected = async () => {
    if (selected.size === 0) return;
    setBusy('record');
    setMessage(null);
    try {
      const res = await fetch('/api/admin/orders/unrecorded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record orders');
      const failedCount = data.failed?.length || 0;
      setMessage(
        failedCount > 0
          ? { type: 'error', text: `Recorded ${data.created} order(s); ${failedCount} could not be recorded.` }
          : { type: 'success', text: `✅ Recorded ${data.created} invoice(s) as orders.` }
      );
      await load();
      onChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to record orders' });
    } finally {
      setBusy(null);
    }
  };

  const restore = async (order: DeletedOrder) => {
    setBusy(order._id);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/orders/deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore order');
      setMessage({ type: 'success', text: `✅ Order ${order.orderNumber} restored.` });
      await load();
      onChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to restore order' });
    } finally {
      setBusy(null);
    }
  };

  if (invoices.length === 0 && deleted.length === 0 && !message) return null;

  const unrecordedTotal = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const selectedTotal = invoices.filter((i) => selected.has(i._id)).reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  return (
    <div className="space-y-3">
      {message && (
        <div className={`p-3 rounded-xl text-sm font-semibold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {invoices.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-gray-900">
                  {invoices.length} manual invoice{invoices.length === 1 ? '' : 's'} ({naira(unrecordedTotal)}) not recorded as orders
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  These sales are missing from Orders, Finance and VAT reports. Recording them adds orders &mdash; invoices are not changed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInvoices((v) => !v)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              Review <ChevronDown className={`h-4 w-4 transition-transform ${showInvoices ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showInvoices && (
            <div className="bg-white rounded-xl border border-amber-200 divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {invoices.map((inv) => (
                <label key={inv._id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={selected.has(inv._id)} onChange={() => toggle(inv._id)} />
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{inv.customerName || 'Customer'}</p>
                    <p className="text-xs text-gray-500">
                      {inv.invoiceNumber} · {shortDate(inv.invoiceDate || inv.createdAt)} ·{' '}
                      <span className={inv.status === 'paid' ? 'text-green-700 font-semibold' : 'text-gray-600'}>
                        {inv.status === 'paid' ? 'Paid → Approved' : 'Unpaid → Pending'}
                      </span>
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{naira(inv.totalAmount)}</span>
                </label>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={recordSelected}
            disabled={busy !== null || selected.size === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === 'record' && <Loader2 className="h-4 w-4 animate-spin" />}
            Record {selected.size} as order{selected.size === 1 ? '' : 's'} ({naira(selectedTotal)})
          </button>
        </div>
      )}

      {deleted.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowDeleted((v) => !v)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Trash2 className="h-4 w-4 text-gray-400" />
              {deleted.length} removed order{deleted.length === 1 ? '' : 's'}
              {deleted.some((o) => o.paymentVerified) && (
                <span className="text-xs font-semibold text-red-600">
                  ({deleted.filter((o) => o.paymentVerified).length} paid)
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDeleted ? 'rotate-180' : ''}`} />
          </button>

          {showDeleted && (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
              {deleted.map((order) => (
                <div key={order._id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {[order.firstName, order.lastName].filter(Boolean).join(' ') || 'Customer'} · {naira(order.total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.orderNumber} · {order.paymentVerified ? 'Paid' : 'Unpaid'} · status {order.status} · removed {shortDate(order.deletedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(order)}
                    disabled={busy !== null}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {busy === order._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
