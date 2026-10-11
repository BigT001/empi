import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import { getAdminFromRequest } from '@/lib/adminAuth';
import Notification from '@/lib/models/Notification';
import { sendEmail } from '@/lib/email';
import { createInvoiceFromOrder } from '@/lib/createInvoiceFromOrder';
import Invoice from '@/lib/models/Invoice';

// POST - Admin confirm payment
export async function POST(req: NextRequest) {
  try {
    // Only a signed-in admin can confirm a payment
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the order
    const order = await UnifiedOrder.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status and payment verification
    order.status = 'approved';
    order.paymentVerified = true;
    order.paymentVerifiedAt = new Date();
    await order.save();

    // Create notification for buyer
    try {
      await Notification.create({
        type: 'order_approved',
        target: 'buyer',
        title: '✅ Order Approved',
        message: `Your order #${order.orderNumber} has been approved! Check your dashboard to track progress.`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        soundEnabled: true,
        smsEnabled: false, // User can enable SMS notifications in settings
      });
      console.log('[Confirm Payment] Buyer notification created');
    } catch (notifErr) {
      console.error('[Confirm Payment] Failed to create buyer notification:', notifErr);
    }

    // Generate invoice automatically and send email.
    // Orders recorded from a manual invoice already have one: mark it paid instead of creating a duplicate.
    let invoiceResult: any = null;
    try {
      if (order.source === 'manual_invoice' && order.invoiceNumber) {
        await Invoice.updateOne(
          { invoiceNumber: order.invoiceNumber },
          { $set: { status: 'paid', paymentVerified: true } }
        );
        invoiceResult = { success: true, invoiceNumber: order.invoiceNumber };
      } else {
        console.log('[Confirm Payment] Generating invoice for order:', order.orderNumber);
        invoiceResult = await createInvoiceFromOrder(order);
        if (invoiceResult.success) {
          console.log('[Confirm Payment] Invoice generated:', invoiceResult.invoiceNumber);
        } else {
          console.warn('[Confirm Payment] Invoice generation warning:', invoiceResult.error);
        }
      }
    } catch (invoiceError) {
      console.error('[Confirm Payment] Invoice generation failed:', invoiceError);
      // Don't fail payment confirmation if invoice generation fails
    }

    // Send confirmation email to customer
    const emailHtml = `
      <h2>Order Approved! 🎉</h2>
      <p>Hi ${order.firstName},</p>
      <p>Great news! We've received and approved your payment.</p>
      
      <h3>Order Details:</h3>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Total Amount Paid:</strong> ₦${order.total.toLocaleString()}</p>
      <p><strong>Status:</strong> APPROVED</p>
      
      ${invoiceResult?.success ? `<p><strong>Invoice Number:</strong> ${invoiceResult.invoiceNumber}</p>` : ''}
      
      <h3>Next Steps:</h3>
      <p>Your order has been approved and will be processed shortly.</p>
      <p>You'll receive regular updates about your order via email.</p>
      <p>You can also track your order progress in your dashboard.</p>
      
      <p>Thank you for shopping with EMPI!</p>
    `;

    try {
      await sendEmail({
        to: order.email,
        subject: `Order Approved - Order ${order.orderNumber}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('[Confirm Payment] Email send failed:', emailError);
      // Don't fail if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      invoice: invoiceResult?.success ? {
        invoiceNumber: invoiceResult.invoiceNumber,
        invoiceId: invoiceResult.invoiceId,
      } : null,
    });
  } catch (error) {
    console.error('[Confirm Payment] Error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
