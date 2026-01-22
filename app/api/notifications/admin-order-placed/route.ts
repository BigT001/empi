/**
 * 🔔 ADMIN NOTIFICATION API
 * Notifies admin when new orders are placed
 * Sends: Email + Desktop Push + Mobile Push + In-App Message
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { sendMultiChannelNotification } from '@/lib/notificationService';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderNumber, orderId, buyerName, buyerEmail, amount, orderType } = body;

    if (!orderNumber || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderNumber, orderId' },
        { status: 400 }
      );
    }

    console.log('[Admin Notification API] 📢 Processing admin notification for new order:', {
      orderNumber,
      orderType,
      buyerName,
      buyerEmail,
      amount,
    });

    // Get admin email from env
    const adminEmail = process.env.ADMIN_EMAIL || 'info.samuelstanley@gmail.com';
    const adminName = 'Admin';

    // Send multi-channel notification to admin
    const result = await sendMultiChannelNotification({
      type: 'order-placed',
      recipient: 'admin',
      email: adminEmail,
      name: adminName,
      orderNumber,
      orderId,
      amount,
      details: {
        buyerName,
        buyerEmail,
        orderType,
      },
    });

    console.log('[Admin Notification API] ✅ Notification sent:', result);

    return NextResponse.json({
      success: true,
      message: 'Admin notification sent successfully',
      result,
    });
  } catch (error) {
    console.error('[Admin Notification API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send admin notification', details: String(error) },
      { status: 500 }
    );
  }
}
