import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomOrder from '@/lib/models/CustomOrder';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { orderId, durationDays, durationHours } = body;

    if (!orderId || durationDays === undefined || durationHours === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, durationDays, durationHours' },
        { status: 400 }
      );
    }

    // Validate duration
    if (durationDays < 0 || durationHours < 0) {
      return NextResponse.json(
        { error: 'Duration cannot be negative' },
        { status: 400 }
      );
    }

    if (durationDays === 0 && durationHours === 0) {
      return NextResponse.json(
        { error: 'Duration must be at least 1 hour' },
        { status: 400 }
      );
    }

    if (durationDays > 30) {
      return NextResponse.json(
        { error: 'Maximum duration is 30 days' },
        { status: 400 }
      );
    }

    // Find the custom order
    const customOrder = await CustomOrder.findById(orderId);
    if (!customOrder) {
      return NextResponse.json(
        { error: 'Custom order not found' },
        { status: 404 }
      );
    }

    // Calculate deadline
    const now = new Date();
    const deadlineDate = new Date(now);
    deadlineDate.setDate(deadlineDate.getDate() + durationDays);
    deadlineDate.setHours(deadlineDate.getHours() + durationHours);

    // Update order with timer
    customOrder.timerStartedAt = now;
    customOrder.deadlineDate = deadlineDate;
    customOrder.timerDurationDays = durationDays + durationHours / 24;
    
    // Change status to in-progress when timer is set (after payment)
    if (customOrder.status === 'pending') {
      customOrder.status = 'approved';
    } else if (customOrder.status === 'approved') {
      customOrder.status = 'in-progress';
    }

    await customOrder.save();

    console.log(`✅ Timer set for order ${orderId}`);
    console.log(`  Duration: ${durationDays} days, ${durationHours} hours`);
    console.log(`  Deadline: ${deadlineDate.toISOString()}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Timer set successfully',
        order: {
          _id: customOrder._id,
          orderNumber: customOrder.orderNumber,
          status: customOrder.status,
          timerStartedAt: customOrder.timerStartedAt,
          deadlineDate: customOrder.deadlineDate,
          timerDurationDays: customOrder.timerDurationDays,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting timer:', error);
    return NextResponse.json(
      { error: 'Failed to set timer' },
      { status: 500 }
    );
  }
}
