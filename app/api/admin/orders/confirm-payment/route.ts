import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import Admin from '@/lib/models/Admin';
import Notification from '@/lib/models/Notification';
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
    const order = await UnifiedOrder.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    order.status = 'approved';
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
