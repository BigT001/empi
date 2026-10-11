import { NextRequest, NextResponse } from 'next/server';
import Invoice from '@/lib/models/Invoice';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { findUnrecordedInvoices, recordInvoiceAsOrder } from '@/lib/invoiceOrders';
import { serializeDocs } from '@/lib/serializer';

/**
 * GET /api/admin/orders/unrecorded
 * Manual invoices that were never recorded as orders (read-only).
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const invoices = await findUnrecordedInvoices();
  const totalAmount = invoices.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);
  return NextResponse.json({ invoices: serializeDocs(invoices), count: invoices.length, totalAmount });
}

/**
 * POST /api/admin/orders/unrecorded  { invoiceIds?: string[] }
 * Records the chosen manual invoices (or all unrecorded ones) as orders.
 * Only adds orders - existing orders and invoices are never changed or deleted.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const invoiceIds: string[] | undefined = Array.isArray(body.invoiceIds) ? body.invoiceIds.map(String) : undefined;

  const unrecorded = await findUnrecordedInvoices();
  const targets = invoiceIds
    ? unrecorded.filter((i: any) => invoiceIds.includes(String(i._id)))
    : unrecorded;

  const results = [];
  for (const target of targets) {
    const invoice = await Invoice.findById((target as any)._id).lean();
    if (invoice) results.push(await recordInvoiceAsOrder(invoice as any));
  }

  const created = results.filter((r) => r.status === 'created').length;
  const failed = results.filter((r) => r.status === 'failed');
  console.log(`[Admin] ${admin.email} recorded ${created} manual invoice(s) as orders`, failed.length ? failed : '');

  return NextResponse.json({ success: failed.length === 0, created, failed, results });
}
