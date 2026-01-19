import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Invoice from '@/lib/models/Invoice';
import CustomOrder from '@/lib/models/CustomOrder';
import { sendEmail } from '@/lib/email';

// POST - Create order with bank transfer payment
export async function POST(req: NextRequest) {
  try {
    const {
      buyerId,
      firstName,
      lastName,
      email,
      phone,
      address,
      busStop,
      city,
      state,
      zipCode,
      country,
      shippingType,
      items,
      rentalSchedule,
      deliveryQuote,
      subtotal,
      vat,
      total,
      cautionFee,
      isFromQuote,
      customOrderId,
      discountAmount,
    } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !items || !total) {
      const missing = [];
      if (!firstName) missing.push('firstName');
      if (!lastName) missing.push('lastName');
      if (!email) missing.push('email');
      if (!items) missing.push('items');
      if (!total) missing.push('total');
      
      console.error('[Bank Transfer Order] Validation failed. Missing fields:', missing);
      console.error('[Bank Transfer Order] Received:', {
        firstName,
        lastName,
        email,
        items: items?.length,
        total,
      });
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate unique order number
    const timestamp = Date.now().toString();
    const orderNumber = `ORD-${timestamp.slice(-9)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Determine order type based on items
    const hasRentalItems = items.some((item: any) => item.mode === 'rent');
    const hasSalesItems = items.some((item: any) => item.mode !== 'rent');
    const orderType: 'rental' | 'sales' | 'mixed' = hasRentalItems && hasSalesItems ? 'mixed' : hasRentalItems ? 'rental' : 'sales';

    // Create order with awaiting_payment status
    const order = new Order({
      buyerId,
      orderNumber,
      orderType: orderType,
      firstName,
      lastName,
      email,
      phone,
      address,
      busStop,
      city,
      state,
      zipCode,
      country,
      shippingType,
      items,
      rentalSchedule: rentalSchedule || undefined,
      subtotal,
      vat,
      vatRate: 7.5,
      total,
      cautionFee: cautionFee || 0,
      paymentMethod: 'bank_transfer',
      status: 'pending', // Awaiting admin confirmation
      paymentStatus: 'pending', // Not yet paid
      isOffline: false,
    });

    // Add delivery details if EMPI delivery
    if (shippingType === 'empi' && deliveryQuote) {
      order.deliveryState = deliveryQuote.deliveryState;
      order.deliveryFee = deliveryQuote.cost;
      order.estimatedDeliveryDays = deliveryQuote.estimatedDeliveryDays;
      order.vehicleType = deliveryQuote.vehicleType;
    }

    let savedOrder;
    try {
      savedOrder = await order.save();
      console.log('[Bank Transfer Order] Successfully created order:', savedOrder._id);
    } catch (saveError) {
      console.error('[Bank Transfer Order] Failed to save order:', saveError);
      return NextResponse.json(
        { error: `Failed to save order: ${saveError instanceof Error ? saveError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // If from custom order quote, update the quote status
    if (isFromQuote && customOrderId) {
      const customOrder = await CustomOrder.findByIdAndUpdate(
        customOrderId,
        {
          status: 'pending_payment',
          orderId: savedOrder._id,
          discountAmount: discountAmount || 0,
        },
        { new: true }
      );

      if (!customOrder) {
        console.warn(`[Bank Transfer] Custom order ${customOrderId} not found for update`);
      }
    }

    // Send confirmation email to customer
    const emailHtml = `
      <h2>Order Confirmation</h2>
      <p>Hi ${firstName},</p>
      <p>Thank you for your order! Your order has been created and is awaiting payment confirmation.</p>
      
      <h3>Order Details:</h3>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Total Amount:</strong> ₦${total.toLocaleString()}</p>
      <p><strong>Status:</strong> Awaiting Payment Confirmation</p>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Please transfer ₦${total.toLocaleString()} to our bank account</li>
        <li>You can optionally upload a payment proof screenshot in your order confirmation email</li>
        <li>Our team will verify and confirm your payment within 24 hours</li>
        <li>Once confirmed, you'll receive an automated invoice via email</li>
      </ol>
      
      <p>If you have any questions, please contact our support team.</p>
      <p>Thank you for shopping with EMPI!</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: `Order Confirmation - ${orderNumber}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('[Bank Transfer] Email send failed:', emailError);
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      message: 'Order created successfully. Awaiting payment confirmation.',
    });
  } catch (error) {
    console.error('[Bank Transfer Order] Catch Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
