/**
 * 🔔 TEST ADMIN NOTIFICATION API
 * Endpoint to test admin notifications
 * Sends a test email and triggers push notification
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { sendMultiChannelNotification } from '@/lib/notificationService';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { testMode = true } = body;

    console.log('[Test Notification API] 📢 Testing admin notifications');

    // Use test admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'info.samuelstanley@gmail.com';
    const adminName = 'Admin';
    const testOrderNumber = `TEST-${Date.now().toString().slice(-6)}`;

    // Send multi-channel notification to admin
    const result = await sendMultiChannelNotification({
      type: 'order-placed',
      recipient: 'admin',
      email: adminEmail,
      name: adminName,
      orderNumber: testOrderNumber,
      orderId: 'test-id-' + Date.now(),
      amount: 50000,
      details: {
        buyerName: 'Test Customer',
        buyerEmail: 'test@example.com',
        orderType: 'Test Order',
      },
    });

    console.log('[Test Notification API] ✅ Test notification sent:', result);

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      testOrderNumber,
      result,
      notificationsSent: {
        email: result.email,
        message: result.message,
        push: result.push,
        mobile: result.mobile,
      },
    });
  } catch (error) {
    console.error('[Test Notification API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification', details: String(error) },
      { status: 500 }
    );
  }
}
