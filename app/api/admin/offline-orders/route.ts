import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { serializeDoc, serializeDocs } from '@/lib/serializer';

// POST - Create offline/manual order
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    console.log('📋 [Offline Order API] Received body:', {
      type: body.type,
      firstName: body.firstName,
      itemDescription: body.itemDescription,
    });

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'subtotal', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Calculate VAT (7.5% of subtotal)
    const subtotal = parseFloat(body.subtotal);
    const vatRate = 7.5;
    const vat = Math.round(subtotal * (vatRate / 100) * 100) / 100;
    const total = Math.round((subtotal + vat) * 100) / 100;

    // Determine mode based on type (sale or rental)
    const type = body.type || 'sale'; // Default to 'sale'
    const mode = type === 'rental' ? 'rent' : 'buy';

    console.log('🔧 [Offline Order API] Processing:', {
      type,
      mode,
      itemDescription: body.itemDescription,
    });

    // Generate unique order number for offline orders
    const orderNumber = `OFF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create offline order
    const offlineOrder = new Order({
      orderNumber,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      subtotal,
      vat,
      vatRate,
      total,
      shippingCost: 0,
      shippingType: 'offline',
      paymentMethod: body.paymentMethod,
      status: body.status || 'completed', // Offline orders default to completed
      items: body.items || [
        {
          productId: 'OFFLINE-ITEM',
          name: body.itemDescription || (type === 'rental' ? 'Offline Rental' : 'Offline Sale'),
          quantity: 1,
          price: subtotal,
          mode: mode, // Set mode based on type
          rentalDays: type === 'rental' ? 1 : 0, // Default to 1 day for rentals
        }
      ],
      country: body.country || 'Nigeria',
      isOffline: true, // Mark as offline order
      offlineType: type, // Track the original type for reference
    });

    await offlineOrder.save();

    console.log(`✅ Offline order created: ${offlineOrder.orderNumber} for ${offlineOrder.email}`);
    console.log(`📝 Saved item mode: ${offlineOrder.items[0].mode}, type: ${type}, offlineType: ${offlineOrder.offlineType}`);

    return NextResponse.json({
      success: true,
      orderId: offlineOrder._id,
      orderNumber: offlineOrder.orderNumber,
      message: 'Offline order saved successfully',
      data: serializeDoc(offlineOrder),
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating offline order:', error);
    return NextResponse.json(
      {
        error: 'Failed to create offline order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Fetch offline orders with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    const filterStatus = searchParams.get('status');

    // Build filter
    const filter: any = { isOffline: true };
    if (filterStatus && filterStatus !== 'all') {
      filter.status = filterStatus;
    }

    // Fetch offline orders
    const offlineOrders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Order.countDocuments(filter);

    console.log(`[Offline Orders API] Fetched ${offlineOrders.length} offline orders (Total: ${totalCount})`);

    return NextResponse.json({
      success: true,
      data: serializeDocs(offlineOrders),
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      }
    });
  } catch (error) {
    console.error('Error fetching offline orders:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch offline orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
