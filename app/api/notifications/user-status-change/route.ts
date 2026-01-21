/**
 * 🔔 USER NOTIFICATION API
 * Notifies users when order status changes
 * - Payment Received
 * - Order Ready
 * - Order Shipped
 * - Order Approved
 * 
 * Sends: Email + In-App Message + Mobile Push
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { sendMultiChannelNotification } from '@/lib/notificationService';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      type, // 'payment-received' | 'order-ready' | 'order-shipped' | 'order-approved'
      orderNumber,
      orderId,
      email,
      name,
      amount,
      details, // optional: trackingNumber, etc.
    } = body;

    if (!type || !orderNumber || !orderId || !email || !name) {
      return NextResponse.json(
        {
          error: 'Missing required fields: type, orderNumber, orderId, email, name',
        },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = [
      'payment-received',
      'order-ready',
      'order-shipped',
      'order-approved',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('[User Notification API] 📢 Processing user notification:', {
      type,
      orderNumber,
      email,
      name,
    });

    // Send multi-channel notification to user
    const result = await sendMultiChannelNotification({
      type: type as any,
      recipient: 'user',
      email,
      name,
      orderNumber,
      orderId,
      amount,
      details,
    });

    console.log('[User Notification API] ✅ Notification sent:', result);

    return NextResponse.json({
      success: true,
      message: `User notification sent for: ${type}`,
      result,
    });
  } catch (error) {
    console.error('[User Notification API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send user notification', details: String(error) },
      { status: 500 }
    );
  }
}
