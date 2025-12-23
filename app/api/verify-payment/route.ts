import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import Invoice from '@/lib/models/Invoice';
import { sendInvoiceEmail } from '@/lib/email';
import { generateProfessionalInvoiceHTML } from '@/lib/professionalInvoice';

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
      
      // Send payment notifications and update status
      try {
        console.log('[verify-payment] 🔗 Connecting to database...');
        await connectDB();
        console.log('[verify-payment] ✅ Database connected');
        
        // Find order by reference
        console.log('[verify-payment] 🔍 Looking for order with reference:', reference);
        let order = await Order.findOne({ orderNumber: reference });
        let customOrder = await CustomOrder.findOne({ orderNumber: reference });
        
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
          
          console.log('[verify-payment] 📧 Preparing to process payment:', {
            orderNumber: reference,
            customerName,
            customerEmail,
            amount,
            isCustomOrder: !!customOrder,
          });
          
          // Update custom order status to "approved" if it's a custom order
          if (customOrder) {
            console.log('[verify-payment] 📝 Updating custom order status to approved');
            customOrder.status = 'approved';
            await customOrder.save();
            console.log('[verify-payment] ✅ Custom order status updated to approved');
          }
          
          // Update regular order status if needed
          if (order) {
            console.log('[verify-payment] 📝 Updating order status to confirmed');
            order.status = 'confirmed';
            await order.save();
            console.log('[verify-payment] ✅ Order status updated to confirmed');
          }
          
          // Generate invoice automatically
          try {
            console.log('[verify-payment] 📄 Generating invoice for order:', reference);
            
            const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const invoiceDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            
            const actualOrder = order || customOrder;
            
            // Create invoice
            const invoice = new Invoice({
              invoiceNumber,
              orderNumber: actualOrder.orderNumber,
              buyerId: actualOrder.buyerId || null,
              customerName: `${actualOrder.firstName || actualOrder.fullName || 'Customer'} ${actualOrder.lastName || ''}`.trim(),
              customerEmail: actualOrder.email,
              customerPhone: actualOrder.phone || '',
              customerAddress: actualOrder.address || '',
              customerCity: actualOrder.city || '',
              customerState: actualOrder.state || '',
              customerPostalCode: actualOrder.zipCode || '',
              subtotal: actualOrder.subtotal || actualOrder.quotedPrice || 0,
              shippingCost: actualOrder.shippingCost || 0,
              taxAmount: actualOrder.vat || actualOrder.quotedVAT || 0,
              totalAmount: actualOrder.total || actualOrder.quotedTotal || 0,
              items: (actualOrder.items || []).map((item: any) => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                mode: item.mode,
              })),
              invoiceDate,
              dueDate,
              currency: 'NGN',
              currencySymbol: '₦',
              taxRate: actualOrder.vatRate || 7.5,
              type: 'automatic',
              status: 'sent',
            });
            
            await invoice.save();
            console.log('[verify-payment] ✅ Invoice created:', invoiceNumber);
            
            // Send invoice email to customer
            try {
              console.log('[verify-payment] 📧 Sending invoice email to customer');
              const invoiceHtml = generateProfessionalInvoiceHTML({
                invoiceNumber,
                customerName: invoice.customerName,
                customerEmail: invoice.customerEmail,
                customerPhone: invoice.customerPhone,
                customerAddress: invoice.customerAddress,
                customerCity: invoice.customerCity,
                customerState: invoice.customerState,
                customerPostalCode: invoice.customerPostalCode,
                subtotal: invoice.subtotal,
                shippingCost: invoice.shippingCost,
                taxAmount: invoice.taxAmount,
                totalAmount: invoice.totalAmount,
                items: invoice.items,
                invoiceDate: invoice.invoiceDate,
                dueDate: invoice.dueDate,
                currency: 'NGN',
                currencySymbol: '₦',
                taxRate: invoice.taxRate,
              });
              
              const emailResult = await sendInvoiceEmail(
                customerEmail,
                customerName,
                invoiceNumber,
                invoiceHtml,
                reference
              );
              
              console.log('[verify-payment] ✅ Invoice email sent:', {
                customerEmail,
                invoiceNumber,
              });
            } catch (emailError) {
              console.warn('[verify-payment] ⚠️ Failed to send invoice email:', emailError);
            }
          } catch (invoiceError) {
            console.error('[verify-payment] ❌ Invoice generation failed:', invoiceError);
          }
          
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
