import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { serializeDoc, serializeDocs } from '@/lib/serializer';

// POST create order
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const order = new Order({
      orderNumber: `ORD-${Date.now()}`,
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      email: body.email || '',
      phone: body.phone || null,
      address: body.address || null,
      busStop: body.busStop || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,
      country: body.country || 'Nigeria',
      shippingType: body.shippingType || '',
      shippingCost: body.shippingCost || 0,
      subtotal: body.subtotal || 0,
      total: body.total || 0,
      paymentMethod: body.paymentMethod || '',
      status: body.status || 'confirmed',
      items: body.items || [],
    });

    await order.save();
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET all orders or single order by ID
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const order = await Order.findById(id);
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(serializeDoc(order));
    }

    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json(serializeDocs(orders));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json([]);
  }
}
