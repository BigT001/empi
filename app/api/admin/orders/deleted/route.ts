import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { serializeDocs, serializeDoc } from '@/lib/serializer';

/**
 * GET /api/admin/orders/deleted
 * Orders that were removed from the dashboard (soft-deleted, still in the database).
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  await connectDB();
  const orders = await UnifiedOrder.find({ isActive: false })
    .select('orderNumber orderType firstName lastName email total status paymentVerified createdAt deletedAt source')
    .sort({ deletedAt: -1 })
    .limit(200)
    .lean();
  return NextResponse.json({ orders: serializeDocs(orders), count: orders.length });
}

/**
 * POST /api/admin/orders/deleted  { orderId }
 * Restores a removed order back to the dashboard.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { orderId } = await request.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });

  await connectDB();
  const order = await UnifiedOrder.findOneAndUpdate(
    { _id: orderId, isActive: false },
    { $set: { isActive: true }, $unset: { deletedAt: 1 } },
    { new: true }
  ).lean();
  if (!order) return NextResponse.json({ error: 'Deleted order not found' }, { status: 404 });

  console.log(`[Admin] ${admin.email} restored order ${(order as any).orderNumber}`);
  return NextResponse.json({ success: true, order: serializeDoc(order) });
}
