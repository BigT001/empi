import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Buyer from '@/lib/models/Buyer';
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
    const fullName = customerName || `${firstName} ${lastName}`.trim();
    const email = body.customer?.email || body.email || '';
    const phone = body.customer?.phone || body.phone || null;

    // Process items - add productId if missing
    const processedItems = (body.items || []).map((item: any) => ({
      productId: item.productId || item.id || `PROD-${Date.now()}`,
      name: item.name || 'Product',
      quantity: item.quantity || 1,
      price: item.price || 0,
      mode: item.mode || 'buy',
      rentalDays: item.rentalDays || 0,
    }));

    // Calculate VAT (7.5% of subtotal)
    const subtotal = body.pricing?.subtotal || body.subtotal || 0;
    const vatRate = 7.5;
    const vat = subtotal * (vatRate / 100);

    // Calculate caution fee for rentals (50% of total rental cost)
    let cautionFee = 0;
    const rentalTotal = processedItems
      .filter((item: any) => item.mode === 'rent')
      .reduce((sum: number, item: any) => sum + (item.price * item.quantity * (item.rentalDays || 1)), 0);
    if (rentalTotal > 0) {
      cautionFee = rentalTotal * 0.5;
    }

    const order = new Order({
      // Customer info
      buyerId: body.buyerId || undefined, // Set if user is logged in (registered customer)
      firstName: firstName || 'Customer',
      lastName: lastName,
      email: email,
      phone: phone,
      
      // Order info
      orderNumber: body.reference || `ORD-${Date.now()}`,
      items: processedItems,
      subtotal: subtotal,
      vat: Math.round(vat * 100) / 100, // Round to 2 decimal places
      vatRate: vatRate,
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
      
      // Rental schedule (if provided)
      rentalSchedule: body.rentalSchedule || undefined,
      cautionFee: cautionFee > 0 ? cautionFee : undefined,
      
      paymentMethod: body.paymentMethod || 'card',
      status: body.status || 'confirmed',
    });

    await order.save();
    
    // If guest checkout (no buyerId), create or update guest Buyer record
    if (!body.buyerId && email) {
      try {
        // Check if guest user already exists
        const existingBuyer = await Buyer.findOne({ email: email.toLowerCase() });
        
        if (!existingBuyer) {
          // Create new guest buyer record (with a temporary password)
          const guestBuyer = new Buyer({
            email: email.toLowerCase(),
            fullName: fullName,
            phone: phone || '',
            password: `guest_${Date.now()}`, // Temporary password
            isAdmin: false,
          });
          await guestBuyer.save();
          console.log(`✅ Guest buyer created: ${email}`);
        } else {
          // Update existing guest buyer with latest info if needed
          if (existingBuyer.phone !== phone && phone) {
            existingBuyer.phone = phone;
            await existingBuyer.save();
          }
          console.log(`✅ Guest buyer already exists: ${email}`);
        }
      } catch (buyerErr) {
        console.error(`⚠️ Warning: Failed to create guest buyer record: ${email}`, buyerErr);
        // Don't fail the order if guest buyer creation fails
      }
    }
    
    console.log(`✅ Order created: ${order.orderNumber} for ${email || 'Unknown'}`);
    
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
    const limit = parseInt(searchParams.get('limit') || '100');

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

    // Get all orders with limit
    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);
    console.log(`[Orders API] Fetched ${orders.length} orders (limit: ${limit})`);
    return NextResponse.json({ success: true, orders: serializeDocs(orders) });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
