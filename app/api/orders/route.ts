import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { serializeDoc, serializeDocs } from '@/lib/serializer';

// POST create/save order from Paystack
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Extract customer info
    const customerName = body.customer?.name || '';
    const [firstName, ...lastNameParts] = customerName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Customer';

    // Process items - add productId if missing
    const processedItems = (body.items || []).map((item: any) => ({
      productId: item.productId || item.id || `PROD-${Date.now()}`,
      name: item.name || 'Product',
      quantity: item.quantity || 1,
      price: item.price || 0,
      mode: item.mode || 'buy',
      rentalDays: item.rentalDays || 0,
    }));

    const order = new Order({
      // Customer info
      firstName: firstName || 'Customer',
      lastName: lastName,
      email: body.customer?.email || body.email || '',
      phone: body.customer?.phone || body.phone || null,
      
      // Order info
      orderNumber: body.reference || `ORD-${Date.now()}`,
      items: processedItems,
      subtotal: body.pricing?.subtotal || body.subtotal || 0,
      shippingCost: body.pricing?.shipping || body.shippingCost || 0,
      total: body.pricing?.total || body.total || 0,
      
      // Shipping info
      shippingType: body.shipping?.option || body.shippingType || 'standard',
      deliveryFee: body.pricing?.shipping || body.deliveryFee || 0,
      
      // Address (if provided)
      address: body.address || null,
      busStop: body.busStop || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,
      country: body.country || 'Nigeria',
      
      paymentMethod: body.paymentMethod || 'card',
      status: body.status || 'confirmed',
    });

    await order.save();
    
    console.log(`✅ Order created: ${order.orderNumber} for ${order.email}`);
    
    return NextResponse.json({
      success: true,
      orderId: order._id,
      reference: order.orderNumber,
      message: 'Order saved successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json({ 
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}

// GET order by ID or reference
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ref = searchParams.get('ref');

    if (ref) {
      // Lookup by Paystack reference
      const order = await Order.findOne({ 
        $or: [{ reference: ref }, { orderNumber: ref }]
      });
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, order: serializeDoc(order) });
    }

    if (id) {
      const order = await Order.findById(id);
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, order: serializeDoc(order) });
    }

    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders: serializeDocs(orders) });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
