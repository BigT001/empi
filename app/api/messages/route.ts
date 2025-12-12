import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import CustomOrder from '@/lib/models/CustomOrder';
import { calculateQuote } from '@/lib/discountCalculator';

/**
 * GET /api/messages
 * Fetch messages for a specific custom order
 * Query params: orderId or orderNumber
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const orderId = request.nextUrl.searchParams.get('orderId');
    const orderNumber = request.nextUrl.searchParams.get('orderNumber');

    console.log('[API:GET /messages] Received request - orderId:', orderId, 'orderNumber:', orderNumber);

    if (!orderId && !orderNumber) {
      console.log('[API:GET /messages] ❌ Missing orderId or orderNumber');
      return NextResponse.json(
        { message: 'orderId or orderNumber is required' },
        { status: 400 }
      );
    }

    const query = orderId ? { orderId } : { orderNumber };
    console.log('[API:GET /messages] Query:', JSON.stringify(query));

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .lean();

    console.log('[API:GET /messages] ✅ Found', messages.length, 'messages');
    if (messages.length > 0) {
      console.log('[API:GET /messages] First message:', messages[0]);
    }

    return NextResponse.json(
      { success: true, messages },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      { message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * Send a new message
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      orderId,
      orderNumber,
      senderEmail,
      senderName,
      senderType, // 'admin' or 'customer'
      content,
      isFinalPrice = false,
      quotedPrice = null,
      messageType = 'text', // 'text', 'quote', or 'negotiation'
    } = body;

    console.log('[API:POST /messages] Received:', { orderId, orderNumber, senderType, messageType, contentLength: content?.length });

    // Validate required fields
    if (!orderId && !orderNumber) {
      console.log('[API:POST /messages] ❌ Missing orderId or orderNumber');
      return NextResponse.json(
        { message: 'orderId or orderNumber is required' },
        { status: 400 }
      );
    }

    if (!senderEmail || !senderName || !senderType || !content) {
      console.log('[API:POST /messages] ❌ Missing required fields');
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['admin', 'customer'].includes(senderType)) {
      console.log('[API:POST /messages] ❌ Invalid senderType:', senderType);
      return NextResponse.json(
        { message: 'senderType must be admin or customer' },
        { status: 400 }
      );
    }

    // Find the order to get its ID if only orderNumber is provided
    let finalOrderId = orderId;
    let orderQuantity = 1;
    if (!orderId && orderNumber) {
      console.log('[API:POST /messages] Looking up order by orderNumber:', orderNumber);
      const order = await CustomOrder.findOne({ orderNumber });
      if (!order) {
        console.log('[API:POST /messages] ❌ Order not found with orderNumber:', orderNumber);
        return NextResponse.json(
          { message: 'Order not found' },
          { status: 404 }
        );
      }
      finalOrderId = order._id;
      orderQuantity = order.quantity || 1;
      console.log('[API:POST /messages] ✅ Found order, _id:', finalOrderId, 'quantity:', orderQuantity);
    } else if (orderId) {
      const order = await CustomOrder.findById(orderId);
      if (order) {
        orderQuantity = order.quantity || 1;
      }
    }

    // Calculate pricing with discount and VAT if it's a quote
    let quotedVAT = null;
    let quotedTotal = null;
    let discountPercentage = 0;
    let discountAmount = 0;
    let subtotalAfterDiscount = null;

    if (quotedPrice) {
      const priceValue = parseFloat(quotedPrice);
      const quoteData = calculateQuote(priceValue, orderQuantity);
      
      quotedVAT = quoteData.vat;
      quotedTotal = quoteData.total;
      discountPercentage = quoteData.discountPercentage;
      discountAmount = quoteData.discountAmount;
      subtotalAfterDiscount = quoteData.subtotalAfterDiscount;

      console.log('[API:POST /messages] Quote calculated:', {
        basePrice: priceValue,
        quantity: orderQuantity,
        discountPercentage,
        discountAmount,
        vat: quotedVAT,
        total: quotedTotal,
      });
    }

    // Create the message
    const message = await Message.create({
      orderId: finalOrderId,
      orderNumber,
      senderEmail,
      senderName,
      senderType,
      content,
      isFinalPrice,
      quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null,
      quotedVAT,
      quotedTotal,
      discountPercentage,
      discountAmount,
      messageType,
      isRead: false,
    });

    console.log('✅ Message created:', message._id);

    // If admin sends a quote or final price, update the order
    if (senderType === 'admin' && (messageType === 'quote' || isFinalPrice)) {
      console.log('[API:POST /messages] Updating order quotedPrice:', quotedPrice);
      await CustomOrder.findByIdAndUpdate(
        finalOrderId,
        {
          quotedPrice: quotedPrice || undefined,
        },
        { new: true }
      );
    }

    return NextResponse.json(
      { success: true, message },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating message:', error);
    return NextResponse.json(
      { message: 'Failed to create message' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/messages
 * Mark messages as read
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { messageIds } = body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { message: 'messageIds array is required' },
        { status: 400 }
      );
    }

    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return NextResponse.json(
      { success: true, modifiedCount: result.modifiedCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating messages:', error);
    return NextResponse.json(
      { message: 'Failed to update messages' },
      { status: 500 }
    );
  }
}
