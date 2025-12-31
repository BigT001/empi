import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';

// GET - Get notifications
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target') as 'admin' | 'buyer' | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const query: any = {};
    if (target) query.target = target;
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('[Notifications GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      target,
      targetId,
      title,
      message,
      orderId,
      orderNumber,
      soundEnabled = true,
      smsEnabled = false,
    } = body;

    if (!type || !target || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, target, title, message' },
        { status: 400 }
      );
    }

    await connectDB();

    const notification = new Notification({
      type,
      target,
      targetId,
      title,
      message,
      orderId,
      orderNumber,
      soundEnabled,
      smsEnabled,
      read: false,
    });

    await notification.save();

    return NextResponse.json(
      {
        success: true,
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Notifications POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
