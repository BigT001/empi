import { NextRequest, NextResponse } from 'next/server';

const orders: Map<string, any> = new Map();

// POST create order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create order
    const order = {
      id: `order_${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...body,
      items: body.items || [],
    };

    orders.set(order.id, order);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET all orders or single order by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const order = orders.get(id);
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(order);
    }

    // Return all orders
    return NextResponse.json(Array.from(orders.values()));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json([]);
  }
}
