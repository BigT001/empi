import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import Invoice from '@/lib/models/Invoice';
import { sendInvoiceEmail } from '@/lib/email';
import { generateProfessionalInvoiceHTML } from '@/lib/professionalInvoice';

export async function GET(request: NextRequest) {
  try {
    console.log('\n========== PAYMENT VERIFICATION START ==========');
    const reference = request.nextUrl.searchParams.get('reference');
    
    if (!reference) {
      console.error("❌ [verify-payment] No reference provided");
      return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
    }

    console.log("[verify-payment] 📋 Reference:", reference);
    console.log("[verify-payment] 🔍 Verifying payment for reference:", reference);

    // Verify with Paystack API
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("❌ [verify-payment] PAYSTACK_SECRET_KEY not configured");
      return NextResponse.json({ error: 'Payment verification service not configured' }, { status: 500 });
    }
    
    console.log("[verify-payment] 🔑 Secret key found:", !!secretKey);
    console.log("[verify-payment] 📡 Making request to Paystack API:", verifyUrl);

    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log("[verify-payment] ✅ Got response from Paystack");
    console.log("[verify-payment] 📊 Response status:", response.status);
    console.log("[verify-payment] 📋 Response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("❌ [verify-payment] Paystack API error:", data);
      return NextResponse.json(
        { error: data.message || 'Payment verification failed' },
        { status: response.status }
      );
    }

    // Check if payment was successful
    console.log("[verify-payment] 🔎 Checking payment status...");
    console.log("[verify-payment] Payment status from Paystack:", data.data?.status);
    
    if (data.data?.status === 'success') {
      console.log("[verify-payment] ✅✅✅ PAYMENT VERIFIED AS SUCCESSFUL!");
      
      // Send payment notifications and update status
      try {
        console.log('[verify-payment] 🔗 Connecting to database...');
        await connectDB();
        console.log('[verify-payment] ✅ Database connected');
        
        // Find order by reference
        console.log('[verify-payment] 🔍 Looking for order with reference:', reference);
        let order = await Order.findOne({ orderNumber: reference });
        let customOrder = await CustomOrder.findOne({ orderNumber: reference });
        
        console.log('[verify-payment] 📊 Order lookup results:');
        console.log('[verify-payment]   - Regular order found:', !!order);
        console.log('[verify-payment]   - Custom order found:', !!customOrder);
        
        const orderData = order || customOrder;
        
        if (orderData) {
          console.log('[verify-payment] ✅ Order found!');
          const amount = data.data.amount / 100; // Paystack returns amount in kobo
          const customerName = orderData.fullName || orderData.firstName || 'Valued Customer';
          const customerEmail = orderData.email || data.data.customer?.email;
          
          console.log('[verify-payment] 📧 Order details:');
          console.log('[verify-payment]   - Order number:', reference);
          console.log('[verify-payment]   - Customer name:', customerName);
          console.log('[verify-payment]   - Customer email:', customerEmail);
          console.log('[verify-payment]   - Amount:', amount);
          console.log('[verify-payment]   - Is custom order:', !!customOrder);
          
          // Update custom order status to "pending" - will move to approved when admin approves
          if (customOrder) {
            console.log('[verify-payment] 📝 Updating custom order status to pending');
            customOrder.status = 'pending';
            await customOrder.save();
            console.log('[verify-payment] ✅ Custom order status updated to pending');
          }
          
          // Update regular order status to "pending" - same flow as custom orders
          if (order) {
            console.log('[verify-payment] 📝 Updating order status to pending');
            order.status = 'pending';
            await order.save();
            console.log('[verify-payment] ✅ Order status updated to pending');
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
              
              console.log('[verify-payment] ✅ Invoice email sent to:', customerEmail);
            } catch (emailError) {
              console.warn('[verify-payment] ⚠️ Failed to send invoice email:', emailError);
            }
          } catch (invoiceError) {
            console.error('[verify-payment] ❌ Invoice generation failed:', invoiceError);
          }

          // Send automatic message to buyer about payment confirmation
          try {
            console.log('[verify-payment] 📨 Sending payment confirmation message to buyer');
            const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
            const messageRes = await fetch(`${baseUrl}/api/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderData._id?.toString(),
                orderNumber: reference,
                senderEmail: 'system@empi.com',
                senderName: 'EMPI System',
                senderType: 'admin',
                content: `✅ Payment Confirmed!\n\nWe've received your payment of ₦${(data.data.amount / 100).toLocaleString()}.\n\nYour order is now confirmed and will be processed shortly. You'll be prompted to select your delivery method next.\n\nThank you for your order!`,
                messageType: 'system',
                recipientType: 'buyer',
              }),
            });

            if (!messageRes.ok) {
              console.warn('[verify-payment] ⚠️ Failed to send payment confirmation message');
            } else {
              console.log('[verify-payment] ✅ Payment confirmation message sent to buyer');
            }
          } catch (msgError) {
            console.warn('[verify-payment] ⚠️ Error sending payment confirmation message:', msgError);
          }
          
          console.log('[verify-payment] 📤 Preparing success response...');
        } else {
          console.warn('[verify-payment] ⚠️ Order not found for reference:', reference);
          console.warn('[verify-payment] Payment is verified but order record not found in database');
          console.warn('[verify-payment] Available data:', {
            paymentReference: reference,
            paymentStatus: data.data?.status,
          });
        }
      } catch (notificationError) {
        console.error('[verify-payment] ⚠️ Failed to process order data:', notificationError);
        // Don't fail the payment verification if order processing fails
      }
      
      console.log('[verify-payment] ✅✅✅ Sending SUCCESS response to frontend');
      const successResponse = {
        success: true,
        reference: data.data.reference,
        amount: data.data.amount,
        status: data.data.status,
        customer: data.data.customer,
      };
      console.log('[verify-payment] Response:', JSON.stringify(successResponse, null, 2));
      console.log('========== PAYMENT VERIFICATION SUCCESS ==========\n');
      return NextResponse.json(successResponse);
    } else {
      console.log("⚠️ [verify-payment] Payment status is not success:", data.data?.status);
      console.log('========== PAYMENT VERIFICATION FAILED ==========\n');
      
      // Send failure notification
      try {
        await connectDB();
        const order = await Order.findOne({ orderNumber: reference });
        const customOrder = await CustomOrder.findOne({ orderNumber: reference });
        const orderData = order || customOrder;
        
        if (orderData) {
          console.log('[verify-payment] Found order for failed payment, but notifications disabled');
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to process failed payment:', notificationError);
      }
      
      return NextResponse.json({
        success: false,
        status: data.data?.status,
        message: 'Payment not successful',
      });
    }
  } catch (error) {
    console.error("❌❌❌ [verify-payment] Exception in payment verification!");
    console.error("[verify-payment] Error:", error);
    console.log('========== PAYMENT VERIFICATION ERROR ==========\n');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
