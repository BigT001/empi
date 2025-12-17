import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference');
    
    if (!reference) {
      console.error("❌ No reference provided");
      return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
    }

    console.log("🔍 Verifying payment for reference:", reference);

    // Verify with Paystack API
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("❌ PAYSTACK_SECRET_KEY not configured");
      return NextResponse.json({ error: 'Payment verification service not configured' }, { status: 500 });
    }

    console.log("📡 Making request to Paystack API:", verifyUrl);

    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log("📊 Paystack response status:", response.status);
    console.log("📋 Paystack response data:", data);

    if (!response.ok) {
      console.error("❌ Paystack API error:", data);
      return NextResponse.json(
        { error: data.message || 'Payment verification failed' },
        { status: response.status }
      );
    }

    // Check if payment was successful
    if (data.data?.status === 'success') {
      console.log("✅ Payment verified as successful for reference:", reference);
      
      // Send payment notifications
      try {
        console.log('[verify-payment] 🔗 Connecting to database...');
        await connectDB();
        console.log('[verify-payment] ✅ Database connected');
        
        // Find order by reference
        console.log('[verify-payment] 🔍 Looking for order with reference:', reference);
        const order = await Order.findOne({ orderNumber: reference });
        const customOrder = await CustomOrder.findOne({ orderNumber: reference });
        
        console.log('[verify-payment] 📊 Order lookup results:', {
          orderFound: !!order,
          customOrderFound: !!customOrder,
          reference,
        });
        
        const orderData = order || customOrder;
        
        if (orderData) {
          const amount = data.data.amount / 100; // Paystack returns amount in kobo
          const customerName = orderData.fullName || orderData.firstName || 'Valued Customer';
          const customerEmail = orderData.email || data.data.customer?.email;
          
          console.log('[verify-payment] 📧 Preparing to send notifications:', {
            orderNumber: reference,
            customerName,
            customerEmail,
            amount,
          });
          
          // Send success message to buyer
          console.log('[verify-payment] 📤 Sending success message to buyer...');
          /*
          await sendPaymentSuccessMessage({
            orderId: orderData._id?.toString(),
            orderNumber: reference,
            buyerEmail: customerEmail,
            buyerName: customerName,
            amount: amount,
            paymentReference: reference,
          });
          console.log('[verify-payment] ✅ Success message sent');
          
          // Send notification to admin
          console.log('[verify-payment] 📤 Sending notification to admin...');
          await sendPaymentSuccessNotificationToAdmin({
            orderId: orderData._id?.toString(),
            orderNumber: reference,
            buyerEmail: customerEmail,
            buyerName: customerName,
            amount: amount,
            paymentReference: reference,
          });
          console.log('[verify-payment] ✅ Admin notification sent');
          */
        } else {
          console.warn('[verify-payment] ⚠️ Order not found for reference:', reference);
          console.warn('[verify-payment] Available data:', {
            paymentReference: reference,
            paymentStatus: data.data?.status,
          });
        }
      } catch (notificationError) {
        console.error('[verify-payment] ⚠️ Failed to send payment notifications:', notificationError);
        // Don't fail the payment verification if notifications fail
      }
      
      return NextResponse.json({
        success: true,
        reference: data.data.reference,
        amount: data.data.amount,
        status: data.data.status,
        customer: data.data.customer,
      });
    } else {
      console.log("⚠️ Payment status is not success:", data.data?.status);
      
      // Send failure notification
      try {
        await connectDB();
        const order = await Order.findOne({ orderNumber: reference });
        const customOrder = await CustomOrder.findOne({ orderNumber: reference });
        const orderData = order || customOrder;
        
        if (orderData) {
          /*
          const { sendPaymentFailedMessage, sendPaymentFailedNotificationToAdmin } = await import('@/lib/paymentNotifications');
          const amount = data.data.amount / 100;
          const customerName = orderData.fullName || orderData.firstName || 'Valued Customer';
          const customerEmail = orderData.email;
          
          await sendPaymentFailedMessage({
            orderId: orderData._id?.toString(),
            orderNumber: reference,
            buyerEmail: customerEmail,
            buyerName: customerName,
            amount: amount,
            reason: data.data?.status,
          });
          
          await sendPaymentFailedNotificationToAdmin({
            orderId: orderData._id?.toString(),
            orderNumber: reference,
            buyerEmail: customerEmail,
            buyerName: customerName,
            amount: amount,
            reason: data.data?.status,
          });
          */
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send payment failure notifications:', notificationError);
      }
      
      return NextResponse.json({
        success: false,
        status: data.data?.status,
        message: 'Payment not successful',
      });
    }
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
