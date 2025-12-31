import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';

/**
 * DELETE /api/cleanup
 * Delete all orders (admin use only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Security check - require a secret token
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.ADMIN_RESET_SECRET}`;
    
    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Delete all orders
    const orderResult = await Order.deleteMany({});
    console.log(`✅ Deleted ${orderResult.deletedCount} orders`);

    // Delete all custom orders
    const customOrderResult = await CustomOrder.deleteMany({});
    console.log(`✅ Deleted ${customOrderResult.deletedCount} custom orders`);

    return NextResponse.json({
      success: true,
      message: 'All orders deleted successfully',
      deleted: {
        orders: orderResult.deletedCount,
        customOrders: customOrderResult.deletedCount
      }
    });
  } catch (error) {
    console.error('❌ Error deleting orders:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
