import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomOrder from '@/lib/models/CustomOrder';
import Message from '@/lib/models/Message';

/**
 * POST /api/orders/handoff
 * Transfer order from production to logistics
 * Sends an auto-message notifying that logistics has joined
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { orderId, orderNumber } = await request.json();

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { message: 'orderId or orderNumber is required' },
        { status: 400 }
      );
    }

    const query = orderId ? { _id: orderId } : { orderNumber };
    
    // Get the latest delivery option message from customer
    const latestDeliveryMessageDoc = await Message.findOne({
      ...query,
      senderType: 'customer',
      deliveryOption: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 }).lean();

    const latestDeliveryMessage = latestDeliveryMessageDoc as any;

    // Get the current order first to check if already handed off
    const currentOrder = await CustomOrder.findOne(query);
    
    if (!currentOrder) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if logistics handoff message already exists (only send once)
    const existingHandoffMessage = await Message.findOne({
      orderId: currentOrder._id,
      content: '🔄 Logistics team has joined the conversation to handle your delivery.',
      senderType: 'admin',
    });

    const isFirstHandoff = !existingHandoffMessage;

    console.log('[API:POST /orders/handoff] 📊 Handoff state:', {
      orderId: currentOrder._id,
      currentHandler: currentOrder.currentHandler,
      handoffMessageExists: !!existingHandoffMessage,
      isFirstHandoff,
    });

    // Update order: set currentHandler to 'logistics', set handoffAt, and store deliveryOption
    const updateData: any = {
      currentHandler: 'logistics',
    };

    // Only set handoffAt if this is the first time
    if (isFirstHandoff) {
      updateData.handoffAt = new Date();
    }

    if (latestDeliveryMessage?.deliveryOption) {
      updateData.deliveryOption = latestDeliveryMessage.deliveryOption;
    }

    const updatedOrder = await CustomOrder.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );

    // Send auto-message about logistics joining (only on first handoff)
    let handoffMessage = null;
    if (isFirstHandoff) {
      handoffMessage = await Message.create({
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        senderEmail: 'logistics@empi.com',
        senderName: 'Logistics Team',
        senderType: 'admin',
        content: '🔄 Logistics team has joined the conversation to handle your delivery.',
        messageType: 'system',
        recipientType: 'all',
        isRead: false,
      });

      console.log('[API:POST /orders/handoff] ✅ First handoff - system message created:', handoffMessage._id);
    } else {
      console.log('[API:POST /orders/handoff] ℹ️ Order already handed off - NO NEW MESSAGE');
    }

    console.log('[API:POST /orders/handoff] ✅ Order handed off to logistics:', updatedOrder._id);

    return NextResponse.json(
      { success: true, order: updatedOrder, message: handoffMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error handing off order:', error);
    return NextResponse.json(
      { message: 'Failed to hand off order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/handoff
 * Grant logistics permission to view full chat history
 * Only super admin can do this
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const { orderId, orderNumber, grantAccess } = await request.json();

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { message: 'orderId or orderNumber is required' },
        { status: 400 }
      );
    }

    const query = orderId ? { _id: orderId } : { orderNumber };
    
    const updatedOrder = await CustomOrder.findOneAndUpdate(
      query,
      {
        logisticsCanViewFullHistory: grantAccess === true,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Send audit message
    const auditMessage = await Message.create({
      orderId: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      senderEmail: 'admin@empi.com',
      senderName: 'Super Admin',
      senderType: 'system',
      content: grantAccess 
        ? '🔐 Logistics now has access to full chat history.'
        : '🔒 Logistics history access has been revoked.',
      messageType: 'system',
      recipientType: 'all',
      isRead: false,
    });

    console.log('[API:PATCH /orders/handoff] ✅ Updated history access for order:', updatedOrder._id);

    return NextResponse.json(
      { success: true, order: updatedOrder, message: auditMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating handoff permissions:', error);
    return NextResponse.json(
      { message: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
