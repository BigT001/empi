/**
 * 🔍 DEBUG ANALYTICS API
 * Checks what data exists in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import Order from '@/lib/models/Order';
import Expense from '@/lib/models/Expense';
import CustomOrder from '@/lib/models/CustomOrder';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check admin session
    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[DEBUG] Checking database collections...');

    // Count all orders in both collections
    const unifiedOrderCount = await UnifiedOrder.countDocuments();
    const legacyOrderCount = await Order.countDocuments();
    const expenseCount = await Expense.countDocuments();
    const customOrderCount = await CustomOrder.countDocuments();

    // Get sample documents
    const sampleUnifiedOrders = await UnifiedOrder.find().limit(2).lean();
    const sampleLegacyOrders = await Order.find().limit(2).lean();
    const sampleExpenses = await Expense.find().limit(2).lean();

    console.log('[DEBUG] Collection counts:', {
      unifiedOrders: unifiedOrderCount,
      legacyOrders: legacyOrderCount,
      expenses: expenseCount,
      customOrders: customOrderCount,
    });

    return NextResponse.json({
      counts: {
        unifiedOrders: unifiedOrderCount,
        legacyOrders: legacyOrderCount,
        expenses: expenseCount,
        customOrders: customOrderCount,
      },
      samples: {
        unifiedOrders: sampleUnifiedOrders.map((o: any) => ({
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          itemsCount: o.items?.length || 0,
          vat: o.vat,
          discountAmount: o.discountAmount,
        })),
        legacyOrders: sampleLegacyOrders.map((o: any) => ({
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          itemsCount: o.items?.length || 0,
        })),
        expenses: sampleExpenses.map((e: any) => ({
          amount: e.amount,
          description: e.description,
          vat: e.vat,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: 'Failed to debug', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
