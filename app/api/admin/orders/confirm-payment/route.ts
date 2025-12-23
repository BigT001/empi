import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Admin from '@/lib/models/Admin';
import { sendEmail } from '@/lib/email';
import { createInvoiceFromOrder } from '@/lib/createInvoiceFromOrder';

// POST - Admin confirm payment
export async function POST(req: NextRequest) {
  try {
    const { orderId, adminId: bodyAdminId, notes } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    // Resolve admin from session if possible (more secure than trusting client)
    let resolvedAdminId = bodyAdminId;
    try {
      const sessionToken = req.cookies.get('admin_session')?.value;
      if (sessionToken) {
        const admin = await Admin.findOne({ sessionToken, sessionExpiry: { $gt: new Date() } });
        if (admin) resolvedAdminId = admin._id;
      }
    } catch (e) {
      console.warn('[Confirm Payment] Failed to resolve admin from session, falling back to body adminId');
    }

    // Get the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    order.paymentStatus = 'confirmed';
    order.paymentConfirmedAt = new Date();
    if (resolvedAdminId) {
      order.paymentConfirmedBy = resolvedAdminId;
    }
    order.status = 'confirmed';
    await order.save();

    // Generate invoice automatically and send email
    let invoiceResult = null;
    try {
      console.log('[Confirm Payment] Generating invoice for order:', order.orderNumber);
      invoiceResult = await createInvoiceFromOrder(order);
      if (invoiceResult.success) {
        console.log('[Confirm Payment] Invoice generated:', invoiceResult.invoiceNumber);
      } else {
        console.warn('[Confirm Payment] Invoice generation warning:', invoiceResult.error);
      }
    } catch (invoiceError) {
      console.error('[Confirm Payment] Invoice generation failed:', invoiceError);
      // Don't fail payment confirmation if invoice generation fails
    }

    // Send confirmation email to customer
    const emailHtml = `
      <h2>Payment Confirmed! 🎉</h2>
      <p>Hi ${order.firstName},</p>
      <p>Great news! We've received and confirmed your payment.</p>
      
      <h3>Order Details:</h3>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Total Amount Paid:</strong> ₦${order.total.toLocaleString()}</p>
      <p><strong>Status:</strong> CONFIRMED</p>
      
      ${invoiceResult?.success ? `<p><strong>Invoice Number:</strong> ${invoiceResult.invoiceNumber}</p>` : ''}
      
      <h3>Next Steps:</h3>
      <p>Your order is now confirmed and will be processed shortly.</p>
      <p>You'll receive regular updates about your order via email.</p>
      
      <p>Thank you for shopping with EMPI!</p>
    `;

    try {
      await sendEmail({
        to: order.email,
        subject: `Payment Confirmed - Order ${order.orderNumber}`,
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
