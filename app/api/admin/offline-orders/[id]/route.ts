import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { serializeDoc } from '@/lib/serializer';
import { Types } from 'mongoose';

// GET - Fetch single offline order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await Order.findOne({
      _id: new Types.ObjectId(id),
      isOffline: true
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Offline order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeDoc(order)
    });
  } catch (error) {
    console.error('Error fetching offline order:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch offline order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete offline order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Find and verify it's an offline order before deleting
    const order = await Order.findOne({
      _id: new Types.ObjectId(id),
      isOffline: true
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Offline order not found' },
        { status: 404 }
      );
    }

    // Delete the order
    await Order.deleteOne({ _id: new Types.ObjectId(id) });

    console.log(`✅ Offline order deleted: ${order.orderNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Offline order deleted successfully',
      deletedOrder: serializeDoc(order)
    });
  } catch (error) {
    console.error('Error deleting offline order:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete offline order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update offline order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Validate MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Find the offline order
    const order = await Order.findOne({
      _id: new Types.ObjectId(id),
      isOffline: true
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Offline order not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'city',
      'state',
      'address',
      'paymentMethod',
      'status',
      'itemDescription'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'email') {
          order[field] = body[field].toLowerCase().trim();
        } else if (['firstName', 'lastName', 'address'].includes(field)) {
          order[field] = body[field].trim();
        } else {
          order[field] = body[field];
        }
      }
    }

    // If subtotal is updated, recalculate VAT
    if (body.subtotal !== undefined) {
      const subtotal = parseFloat(body.subtotal);
      if (subtotal <= 0) {
        return NextResponse.json(
          { error: 'Subtotal must be greater than 0' },
          { status: 400 }
        );
      }
      order.subtotal = subtotal;
      order.vat = Math.round(subtotal * (7.5 / 100) * 100) / 100;
      order.total = Math.round((subtotal + order.vat) * 100) / 100;
    }

    await order.save();

    console.log(`✅ Offline order updated: ${order.orderNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Offline order updated successfully',
      data: serializeDoc(order)
    });
  } catch (error) {
    console.error('Error updating offline order:', error);
    return NextResponse.json(
      {
        error: 'Failed to update offline order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
