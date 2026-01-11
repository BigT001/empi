import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const allOrders = await Order.find({}).lean();
    
    console.log('[DEBUG] Total orders in DB:', allOrders.length);
    
    // Show each order
    allOrders.forEach((order: any, idx: number) => {
      console.log(`[DEBUG] Order ${idx + 1}:`, {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
      });
    });

    // Apply the same filter as finance API
    const completedOrders = allOrders.filter(
      (order: any) =>
        order.status === 'confirmed' ||
        order.status === 'completed' ||
        order.status === 'delivered' ||
        order.status === 'shipped' ||
        order.paymentStatus === 'confirmed'
    );

    console.log('[DEBUG] Completed orders after filter:', completedOrders.length);
    completedOrders.forEach((order: any) => {
      console.log('[DEBUG] Completed:', {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
      });
    });

    const completedRevenue = completedOrders.reduce(
      (sum: number, order: any) => sum + (order.total || 0),
      0
    );

    return NextResponse.json({
      success: true,
      totalOrders: allOrders.length,
      completedOrdersCount: completedOrders.length,
      completedRevenue,
      orders: allOrders.map((o: any) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        isCompleted: completedOrders.some(co => String((co as any)?._id) === String(o._id)),
      })),
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
