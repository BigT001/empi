import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomOrder from '@/lib/models/CustomOrder';

/**
 * DEBUG endpoint to check what's actually stored in database
 * GET /api/debug/custom-orders
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch last 5 custom orders
    const orders = await CustomOrder.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log('[DEBUG] Found orders:', orders.length);
    orders.forEach((order: any, idx: number) => {
      console.log(`[DEBUG] Order ${idx + 1}:`);
      console.log(`  - OrderNumber: ${order.orderNumber}`);
      console.log(`  - Email: ${order.email}`);
      console.log(`  - designUrl: ${order.designUrl || 'EMPTY'}`);
      console.log(`  - designUrls length: ${order.designUrls?.length || 0}`);
      console.log(`  - designUrls:`, order.designUrls || []);
    });

    return NextResponse.json({
      success: true,
      total: orders.length,
      orders: orders.map((order: any) => ({
        orderNumber: order.orderNumber,
        email: order.email,
        fullName: order.fullName,
        designUrl: order.designUrl,
        designUrlsCount: order.designUrls?.length || 0,
        designUrls: order.designUrls || [],
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
