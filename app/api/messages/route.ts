import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import CustomOrder from '@/lib/models/CustomOrder';
import { calculateQuote } from '@/lib/discountCalculator';

/**
 * GET /api/messages
 * Fetch messages for a specific custom order, or all reviews if messageType=review
 * Query params: 
 *   - orderId or orderNumber (required for order messages)
 *   - messageType (optional: 'review' to fetch all reviews without orderId)
 *   - handlerType (optional: 'production' or 'logistics')
 *   - isSuperAdmin (optional: 'true' to bypass logistics visibility restrictions)
 * 
 * If logistics handler: only show messages from handoffAt onwards (unless logisticsCanViewFullHistory is true)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const orderId = request.nextUrl.searchParams.get('orderId');
    const orderNumber = request.nextUrl.searchParams.get('orderNumber');
    const messageType = request.nextUrl.searchParams.get('messageType');
    const handlerType = request.nextUrl.searchParams.get('handlerType'); // 'production' or 'logistics'
    const isSuperAdmin = request.nextUrl.searchParams.get('isSuperAdmin') === 'true';

    console.log('[API:GET /messages] Received request - orderId:', orderId, 'orderNumber:', orderNumber, 'messageType:', messageType, 'handlerType:', handlerType);

    // Special case: fetch all reviews if messageType is 'review' and no orderId
    if (messageType === 'review' && !orderId && !orderNumber) {
      console.log('[API:GET /messages] Fetching all reviews');
      const reviews = await Message.find({ messageType: 'review', senderType: 'customer' })
        .sort({ createdAt: -1 })
        .lean();

      console.log('[API:GET /messages] ✅ Found', reviews.length, 'reviews');
      return NextResponse.json(
        { success: true, messages: reviews },
        { status: 200 }
      );
    }

    // Standard case: fetch messages for a specific order
    if (!orderId && !orderNumber) {
      console.log('[API:GET /messages] ❌ Missing orderId or orderNumber');
      return NextResponse.json(
        { message: 'orderId or orderNumber is required' },
        { status: 400 }
      );
    }

    const query = orderId ? { orderId } : { orderNumber };
    console.log('[API:GET /messages] Query:', JSON.stringify(query));

    // Fetch the order to check handoff details
    const order = await CustomOrder.findOne(query).lean() as any;
    
    // Build message query with handler-based filtering
    let messageQuery: any = query;
    
    if (handlerType === 'logistics' && order && order.handoffAt && !isSuperAdmin) {
      // Logistics can only see messages from handoffAt onwards (unless super admin grants access)
      if (!order.logisticsCanViewFullHistory) {
        messageQuery.createdAt = { $gte: order.handoffAt };
      }
    }

    const messages = await Message.find(messageQuery)
      .sort({ createdAt: 1 })
      .lean();

    console.log('[API:GET /messages] ✅ Found', messages.length, 'messages');
    if (messages.length > 0) {
      console.log('[API:GET /messages] First message:', messages[0]);
    }

    return NextResponse.json(
      { success: true, messages, order },
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
      quotedDeliveryDate = null,
      messageType = 'text', // 'text', 'quote', 'negotiation', or 'quantity-update'
      quantityChangeData = null,
      recipientType = 'all', // 'admin', 'buyer', or 'all'
      deliveryOption = null, // 'pickup' or 'delivery' - set when customer selects their preference
    } = body;

    console.log('[API:POST /messages] Received:', { orderId, orderNumber, senderType, messageType, contentLength: content?.length, deliveryOption });
    console.log('[API:POST /messages] quantityChangeData:', quantityChangeData);

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
    console.log('[API:POST /messages] 📝 Creating message with:', {
      orderId: finalOrderId,
      messageType,
      quantityChangeData: quantityChangeData ? 'present' : 'missing'
    });
    
    try {
      const message = await Message.create({
        orderId: finalOrderId,
        orderNumber,
        senderEmail,
        senderName,
        senderType,
        content,
        isFinalPrice,
        quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null,
        quotedDeliveryDate: quotedDeliveryDate ? new Date(quotedDeliveryDate) : null,
        quotedVAT,
        quotedTotal,
        discountPercentage,
        discountAmount,
        messageType,
        quantityChangeData: quantityChangeData || null,
        recipientType,
        deliveryOption: deliveryOption || null, // Store delivery option when customer selects
        isRead: false,
      });

      console.log('✅ Message created:', message._id);
      
      // If customer selects delivery option, update the order with that preference
      if (senderType === 'customer' && deliveryOption && (deliveryOption === 'pickup' || deliveryOption === 'delivery')) {
        console.log('[API:POST /messages] 📦 Customer selected delivery option:', deliveryOption, 'for order:', finalOrderId);
        
        try {
          const updatedOrder = await CustomOrder.findByIdAndUpdate(
            finalOrderId,
            { deliveryOption },
            { new: true }
          );
          
          console.log('[API:POST /messages] ✅ Order updated with deliveryOption:', {
            orderId: finalOrderId,
            deliveryOption: deliveryOption,
            orderDeliveryOption: updatedOrder?.deliveryOption,
            status: updatedOrder?.status,
            currentHandler: updatedOrder?.currentHandler
          });
        } catch (err) {
          console.error('[API:POST /messages] ❌ Error updating order with deliveryOption:', err);
        }
      }
      
      // If admin sends a quote or final price, update the order
      if (senderType === 'admin' && (messageType === 'quote' || isFinalPrice)) {
        console.log('[API:POST /messages] 📊 Admin sent quote, updating order:', {
          messageType,
          quotedPrice,
          quotedVAT,
          quotedTotal: quotedTotal || quotedPrice,
          isFinalPrice
        });
        
        // Get current order to calculate totals
        const currentOrder = await CustomOrder.findById(finalOrderId);
        if (!currentOrder) {
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          );
        }

        // When admin sends a quote, quotedPrice is the per-unit price
        // We need to calculate the total with VAT
        const { calculatePrice } = await import('@/lib/priceCalculations');
        const unitPrice = quotedPrice ? Math.round(parseFloat(quotedPrice)) : 0;
        const quantity = currentOrder.quantity || 1;
        
        let orderUpdate: any = {};
        
        if (unitPrice > 0) {
          const priceBreakdown = calculatePrice(unitPrice, quantity);
          orderUpdate = {
            unitPrice: Math.round(unitPrice),
            quotedPrice: Math.round(priceBreakdown.total), // Store TOTAL in quotedPrice, not per-unit
          };
          console.log(`[API:POST /messages] 💰 Calculated quote total: ₦${priceBreakdown.total} (unit: ₦${unitPrice} × qty: ${quantity} with discount)`);
        }
        
        if (quotedDeliveryDate) {
          orderUpdate.proposedDeliveryDate = new Date(quotedDeliveryDate);
        }
        
        const updatedOrder = await CustomOrder.findByIdAndUpdate(
          finalOrderId,
          orderUpdate,
          { new: true }
        );
        
        console.log('[API:POST /messages] ✅ Order updated with quote:', {
          quotedPrice: updatedOrder?.quotedPrice,
          unitPrice: updatedOrder?.unitPrice,
          quantity: updatedOrder?.quantity
        });
      }

      return NextResponse.json(
        { success: true, message },
        { status: 201 }
      );
    } catch (messageError) {
      console.error('[API:POST /messages] ❌ Error in message creation try block:', messageError);
      throw messageError;
    }
  } catch (error) {
    console.error('❌ Error creating message:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error details:', errorMessage);
    return NextResponse.json(
      { message: 'Failed to create message', error: errorMessage },
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

/**
 * PATCH /api/messages
 * Mark all unread messages for an order as read
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const orderId = request.nextUrl.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { message: 'orderId is required' },
        { status: 400 }
      );
    }

    const result = await Message.updateMany(
      { orderId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    console.log(`[API:PATCH /messages] ✅ Marked ${result.modifiedCount} messages as read for order ${orderId}`);

    return NextResponse.json(
      { success: true, modifiedCount: result.modifiedCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    return NextResponse.json(
      { message: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages
 * Delete messages for an order (admin action)
 * Query param: orderId
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ message: 'orderId is required' }, { status: 400 });
    }

    // Delete messages tied to this order
    const result = await Message.deleteMany({ orderId });
    console.log(`[API:DELETE /messages] ✅ Deleted ${result.deletedCount} messages for order ${orderId}`);

    return NextResponse.json({ success: true, deletedCount: result.deletedCount }, { status: 200 });
  } catch (error) {
    console.error('[API:DELETE /messages] ❌ Error deleting messages:', error);
    return NextResponse.json({ message: 'Failed to delete messages', error: String(error) }, { status: 500 });
  }
}
