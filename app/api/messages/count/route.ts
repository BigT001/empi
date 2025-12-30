import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';

/**
 * GET /api/messages/count
 * Fetch message counts (total and unread) for multiple orders
 * Query params: orderIds (comma-separated list of order IDs)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const orderIdsParam = request.nextUrl.searchParams.get('orderIds');
    
    if (!orderIdsParam) {
      return NextResponse.json(
        { message: 'orderIds parameter is required' },
        { status: 400 }
      );
    }

    const orderIds = orderIdsParam.split(',').map(id => id.trim());
    
    console.log('[API:GET /messages/count] Fetching message counts for orderIds:', orderIds);

    // Fetch message counts for each order
    const counts: Record<string, { total: number; unread: number }> = {};

    for (const orderId of orderIds) {
      const totalMessages = await Message.countDocuments({ orderId });
      const unreadMessages = await Message.countDocuments({ orderId, isRead: false });

      counts[orderId] = {
        total: totalMessages,
        unread: unreadMessages,
      };
    }

    console.log('[API:GET /messages/count] ✅ Fetched counts:', counts);

    return NextResponse.json(
      { success: true, counts },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API:GET /messages/count] ❌ Error fetching message counts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch message counts', error: String(error) },
      { status: 500 }
    );
  }
}
