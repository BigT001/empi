import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';

// POST - Send SMS notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, message, type, notificationId } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing phone number or message' },
        { status: 400 }
      );
    }

    await connectDB();

    // TODO: Integrate with SMS service (Twilio, Termii, Sendchamp, etc.)
    // For now, we'll log it and mark as sent
    console.log(`[SMS Notification] Phone: ${phoneNumber}, Message: ${message}, Type: ${type}`);

    // Update notification if ID provided
    if (notificationId) {
      await Notification.findByIdAndUpdate(
        notificationId,
        { smsSent: true },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SMS notification queued (SMS service integration needed)',
      // In production, this would return actual SMS service response
    });
  } catch (error) {
    console.error('[SMS Notification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS notification' },
      { status: 500 }
    );
  }
}
