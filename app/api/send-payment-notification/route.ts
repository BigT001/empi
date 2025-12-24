import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  sendPaymentSuccessMessageToBuyer,
  sendPaymentSuccessMessageToAdmin,
  sendPaymentFailedMessageToBuyer,
  sendPaymentFailedMessageToAdmin,
} from '@/lib/paymentNotifications';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { type, orderNumber, orderId, buyerEmail, buyerName, amount, paymentReference, invoiceId, isCustomOrder } = body;

    console.log('[send-payment-notification] Processing:', {
      type,
      orderNumber,
      buyerName,
      amount,
      isCustomOrder,
    });

    if (type === 'success') {
      // Send BUYER message
      const buyerMsg = await sendPaymentSuccessMessageToBuyer({
        orderId,
        orderNumber,
        buyerEmail,
        buyerName,
        amount,
        paymentReference,
        invoiceId,
        isCustomOrder,
      });

      // Send ADMIN message
      const adminMsg = await sendPaymentSuccessMessageToAdmin({
        orderId,
        orderNumber,
        buyerEmail,
        buyerName,
        amount,
        paymentReference,
        invoiceId,
        isCustomOrder,
      });

      console.log('[send-payment-notification] ✅ Payment success notifications sent');

      return NextResponse.json({
        success: true,
        buyerMessageId: buyerMsg._id,
        adminMessageId: adminMsg._id,
        message: 'Payment notification messages sent successfully',
      });
    } else if (type === 'failed') {
      // Send BUYER message
      const buyerMsg = await sendPaymentFailedMessageToBuyer({
        orderNumber,
        buyerName,
        amount,
        orderId,
        reason: body.reason,
      });

      // Send ADMIN message
      const adminMsg = await sendPaymentFailedMessageToAdmin({
        orderNumber,
        buyerEmail,
        buyerName,
        amount,
        orderId,
        reason: body.reason,
      });

      console.log('[send-payment-notification] ⚠️ Payment failed notifications sent');

      return NextResponse.json({
        success: false,
        buyerMessageId: buyerMsg._id,
        adminMessageId: adminMsg._id,
        message: 'Payment failed notification messages sent',
      });
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }
  } catch (error) {
    console.error('[send-payment-notification] ❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send payment notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
