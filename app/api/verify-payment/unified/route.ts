import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import Invoice from '@/lib/models/Invoice';
import Message from '@/lib/models/Message';
import { sendInvoiceEmail } from '@/lib/email';

/**
 * GET /api/verify-payment/unified
 * 
 * UNIFIED payment verification for both custom and regular orders
 * Single function - no duplication!
 * 
 * Query params: reference (Paystack reference)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    // email and name parameters reserved for future use

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference required' },
        { status: 400 }
      );
    }

    console.log(`[Verify Payment] Verifying payment: ${reference}`);

    // Find order by payment reference
    const order = await UnifiedOrder.findOne({
      paymentReference: reference,
      isActive: true,
    });

    if (!order) {
      console.log(`[Verify Payment] ❌ Order not found for reference: ${reference}`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify with Paystack
    const paymentValid = await verifyPaystackPayment(reference);

    if (!paymentValid) {
      console.log(`[Verify Payment] ❌ Payment invalid for reference: ${reference}`);
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    console.log(`[Verify Payment] ✅ Payment verified for ${order.orderNumber}`);

    // Create invoice with complete pricing (including discount)
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await Invoice.create({
      orderNumber: order.orderNumber,
      invoiceNumber,
      paymentReference: reference,
      paymentVerified: true,
      customerEmail: order.email,
      customerName: `${order.firstName} ${order.lastName}`,
      customerPhone: order.phone,
      customerAddress: order.address,
      customerCity: order.city,
      customerState: order.state,
      customerPostalCode: order.zipCode,
      items: order.items,
      subtotal: order.subtotal,
      // 🎁 Include discount information
      bulkDiscountPercentage: order.discountPercentage || 0,
      bulkDiscountAmount: order.discountAmount || 0,
      vat: order.vat,
      taxAmount: order.vat,
      total: order.total,
      totalAmount: order.total,
      currency: 'NGN',
      currencySymbol: '₦',
      type: 'automatic',
      status: 'sent',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
    });

    console.log(`[Verify Payment] 📋 Invoice created: ${invoiceNumber}`);

    // Determine appropriate status based on order type
    // CUSTOM ORDERS: Stay pending until admin explicitly approves
    // REGULAR ORDERS: Move to approved (payment completes the purchase)
    const newStatus = order.orderType === 'custom' ? 'pending' : 'approved';

    console.log(`[Verify Payment] 📌 Order type: ${order.orderType}, setting status to: ${newStatus}`);

    // Update order - UNIFIED (no duplication!)
    const updated = await UnifiedOrder.findByIdAndUpdate(
      order._id,
      {
        paymentVerified: true,
        paymentVerifiedAt: new Date(),
        status: newStatus,
        updatedAt: new Date(),
      },
      { new: true }
    );

    console.log(`[Verify Payment] ✅ Order status updated to '${newStatus}'`);

    // Send invoice email to customer
    try {
      console.log(`[Verify Payment] 📧 Sending invoice email to customer: ${order.email}`);
      
      // Generate a simple invoice HTML for email
      const invoiceHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2>Invoice ${invoiceNumber}</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <hr/>
          <h3>Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
            </tr>
            ${order.items?.map((item: any) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₦${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('') || ''}
          </table>
          <hr/>
          <div style="text-align: right; font-size: 14px;">
            <p><strong>Subtotal:</strong> ₦${order.subtotal?.toLocaleString() || 0}</p>
            ${order.discountPercentage ? `<p><strong>Discount (${order.discountPercentage}%):</strong> -₦${(order.discountAmount || 0).toLocaleString()}</p>` : ''}
            <p><strong>Tax (7.5%):</strong> ₦${(order.vat || 0).toLocaleString()}</p>
            <p style="font-size: 16px;"><strong>Total: ₦${order.total?.toLocaleString() || 0}</strong></p>
          </div>
        </div>
      `;
      
      const emailResult = await sendInvoiceEmail(
        order.email,
        `${order.firstName} ${order.lastName}`,
        invoiceNumber,
        invoiceHtml,
        order.orderNumber
      );
      
      console.log(`[Verify Payment] 📧 Invoice email result - Customer: ${emailResult.customerSent ? '✅' : '❌'}, Admin: ${emailResult.adminSent ? '✅' : '❌'}`);
    } catch (emailError) {
      console.error('[Verify Payment] Warning: Could not send invoice email', emailError);
    }

    // Send notification messages (tailored to order type)
    const notificationContent = order.orderType === 'custom' 
      ? `✅ Payment verified for your custom order ${order.orderNumber}! Admin will review and approve it shortly.`
      : `✅ Payment verified! Your order ${order.orderNumber} is now approved and will enter production.`;

    try {
      await Message.create({
        orderId: order._id,
        senderType: 'admin',
        senderName: 'System',
        content: notificationContent,
        messageType: 'system',
        isRead: false,
      });

      console.log(`[Verify Payment] 📧 Customer notification sent`);
    } catch (msgError) {
      console.error('[Verify Payment] Warning: Could not send notification', msgError);
    }

    return NextResponse.json({
      success: true,
      reference,
      orderNumber: order.orderNumber,
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
      },
      order: updated,
    });
  } catch (error) {
    console.error('[Verify Payment] Error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}

/**
 * Verify payment with Paystack API
 */
async function verifyPaystackPayment(reference: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.log(`[Paystack] API error: ${response.status}`);
      return false;
    }

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      console.log(`[Paystack] ✅ Payment confirmed: ${data.data.reference}`);
      return true;
    }

    console.log(`[Paystack] ❌ Payment not successful: ${data.data.status}`);
    return false;
  } catch (error) {
    console.error('[Paystack] Error verifying payment:', error);
    return false;
  }
}
