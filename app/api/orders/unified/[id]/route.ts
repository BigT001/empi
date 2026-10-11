import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { getBuyerFromRequest } from '@/lib/buyerAuth';
import { checkPaymentForOrder } from '@/lib/paymentVerification';

// The only order fields a customer may change: contact and delivery details.
// Prices, totals, status and payment flags are admin/server-only.
const CUSTOMER_EDITABLE_FIELDS = [
  'firstName', 'lastName', 'phone', 'address', 'city', 'state', 'country', 'zipCode',
  'deliveryOption', 'shippingType',
] as const;

/**
 * GET /api/orders/unified/[id]
 * 
 * Fetch single order by ID (works for both custom and regular)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[Unified Orders API] GET /api/orders/unified/[id] called:', id);
    
    if (!id) {
      console.error('[Unified Orders API] ❌ No ID provided');
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    console.log('[Unified Orders API] ✅ Connected to DB for order:', id);
    
    const order = await UnifiedOrder.findById(id).lean();

    if (!order) {
      console.warn('[Unified Orders API] ❌ Order not found:', id);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Orders placed from a customer account are only visible to that account (or admins).
    // Guest orders are reachable by their order ID, which only the customer is given.
    const orderBuyerId = (order as { buyerId?: string }).buyerId;
    if (orderBuyerId) {
      const admin = await getAdminFromRequest(request);
      if (!admin) {
        const buyer = await getBuyerFromRequest(request);
        if (!buyer || String(buyer._id) !== String(orderBuyerId)) {
          return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
      }
    }

    console.log('[Unified Orders API] ✅ Order found, converting to JSON');

    // Log order details for debugging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderData = order as any;
    
    try {
      console.log('[Unified Orders API] ✅ GET - Order retrieved:', {
        id: orderData._id,
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType,
        requiredQuantity: orderData.requiredQuantity,
        quotedPrice: orderData.quotedPrice,
        quoteItemsCount: Array.isArray(orderData.quoteItems) ? orderData.quoteItems.length : 0,
        quoteItems: orderData.quoteItems,
        designUrls: Array.isArray(orderData.designUrls) ? orderData.designUrls.length : 0,
        firstName: orderData.firstName,
        email: orderData.email,
      });
    } catch (logError) {
      console.warn('[Unified Orders API] Warning logging order details:', logError);
      // Continue anyway, don't fail
    }

    return NextResponse.json(order);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[API] GET /orders/unified/[id] failed:', {
      error: errorMessage,
      stack: errorStack,
    });
    return NextResponse.json(
      { error: 'Failed to fetch order', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/unified/[id]
 * 
 * Update order (both custom and regular)
 * Auto-handoff: When status changes to 'ready_for_delivery', 
 * automatically transitions to 'in_logistics' handler
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body = await request.json();

    // Non-admins can only touch their own order's contact/delivery details.
    // Payment is never trusted from the browser - it is verified with Flutterwave here.
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      await connectDB();
      const order = await UnifiedOrder.findById(id);
      if (!order || order.isActive === false) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Orders placed from a customer account can only be changed by that account
      if (order.buyerId) {
        const buyer = await getBuyerFromRequest(request);
        if (!buyer || String(buyer._id) !== String(order.buyerId)) {
          return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
      }

      const safeUpdate: Record<string, unknown> = {};
      for (const field of CUSTOMER_EDITABLE_FIELDS) {
        const value = body?.[field];
        if (typeof value === 'string') safeUpdate[field] = value.slice(0, 500);
      }

      if (typeof body?.paymentReference === 'string' && body.paymentReference && !order.paymentVerified) {
        const reference = body.paymentReference.slice(0, 200);
        const payment = await checkPaymentForOrder(reference, order.total, order._id);
        safeUpdate.paymentReference = reference;
        if (payment.verified) {
          safeUpdate.paymentVerified = true;
          safeUpdate.paymentVerifiedAt = new Date();
        } else {
          console.warn(`[Unified Orders API] ⚠️ Payment not verified for ${order.orderNumber}: ${payment.reason}`);
        }
      }

      const ignored = Object.keys(body || {}).filter((k) => !(k in safeUpdate) && k !== 'paymentVerified');
      if (ignored.length) console.warn('[Unified Orders API] Ignored customer-supplied fields:', ignored);
      body = safeUpdate;
    }
    
    // CRITICAL: Log the raw request body as JSON string to see exact structure
    console.log('[Unified Orders API] 🔥 RAW PATCH BODY:', JSON.stringify(body, null, 2));
    
    console.log('[Unified Orders API] PATCH /api/orders/unified/[id] called:', {
      id,
      status: body.status,
      currentHandler: body.currentHandler,
      quotedPrice: body.quotedPrice,
      quoteItemsCount: body.quoteItems?.length || 0,
      discountPercentage: body.discountPercentage,
      discountAmount: body.discountAmount,
      subtotal: body.subtotal,
      subtotalAfterDiscount: body.subtotalAfterDiscount,
      vat: body.vat,
      allBodyKeys: Object.keys(body),
    });

    await connectDB();

    // Build update object - explicitly ensure discount fields are included
    const updateData: Record<string, unknown> = { 
      ...body,
      // Explicitly set discount fields to ensure they're saved
      ...(body.subtotal !== undefined && { subtotal: body.subtotal }),
      ...(body.discountPercentage !== undefined && { discountPercentage: body.discountPercentage }),
      ...(body.discountAmount !== undefined && { discountAmount: body.discountAmount }),
      ...(body.subtotalAfterDiscount !== undefined && { subtotalAfterDiscount: body.subtotalAfterDiscount }),
      ...(body.vat !== undefined && { vat: body.vat }),
      ...(body.total !== undefined && { total: body.total }),
    };

    console.log('[Unified Orders API] PATCH request body details:');
    console.log('  ├─ quotedPrice type:', typeof body.quotedPrice);
    console.log('  ├─ quotedPrice value:', body.quotedPrice);
    console.log('  ├─ quoteItems type:', Array.isArray(body.quoteItems) ? 'array' : typeof body.quoteItems);
    console.log('  ├─ quoteItems length:', body.quoteItems?.length || 0);
    console.log('  ├─ subtotal:', body.subtotal);
    console.log('  ├─ discountPercentage:', body.discountPercentage);
    console.log('  ├─ discountAmount:', body.discountAmount);
    console.log('  ├─ subtotalAfterDiscount:', body.subtotalAfterDiscount);
    console.log('  ├─ vat:', body.vat);
    console.log('  └─ total:', body.total);

    // Auto-handoff logic: If status changes to 'ready_for_delivery', 
    // automatically transition to logistics
    if (body.status === 'ready_for_delivery') {
      updateData.currentHandler = 'logistics';
      updateData.handoffAt = new Date();
      console.log('[Unified Orders API] 🔄 Auto-handoff triggered: production → logistics');
    }

    const updatedOrder = await UnifiedOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Convert to plain object for proper serialization
    const orderData = updatedOrder as Record<string, unknown>;
    
    // CRITICAL: Verify discount fields were actually saved
    console.log('[Unified Orders API] 🔍 VERIFICATION - What was actually saved to database:');
    console.log('  ├─ ID:', orderData._id);
    console.log('  ├─ subtotal saved:', orderData.subtotal, '(expected:', body.subtotal, ')');
    console.log('  ├─ discountPercentage saved:', orderData.discountPercentage, '(expected:', body.discountPercentage, ')');
    console.log('  ├─ discountAmount saved:', orderData.discountAmount, '(expected:', body.discountAmount, ')');
    console.log('  ├─ subtotalAfterDiscount saved:', orderData.subtotalAfterDiscount, '(expected:', body.subtotalAfterDiscount, ')');
    console.log('  ├─ vat saved:', orderData.vat, '(expected:', body.vat, ')');
    console.log('  ├─ total saved:', orderData.total, '(expected:', body.total, ')');
    console.log('  ├─ quotedPrice saved:', orderData.quotedPrice, '(expected:', body.quotedPrice, ')');
    console.log('  └─ quoteItems saved:', (orderData.quoteItems as any[])?.length || 0);
    
    // If discount fields are missing, something went wrong
    if (!orderData.discountPercentage && body.discountPercentage) {
      console.error('[CRITICAL ERROR] Discount fields NOT saved! The PATCH update failed silently.');
      console.error('  Body sent:', JSON.stringify(body));
      console.error('  Update data:', JSON.stringify(updateData));
      console.error('  Database response:', JSON.stringify(orderData));
    }
    
    console.log('[Unified Orders API] ✅ PATCH - Order updated, checking saved data:');
    console.log('  ├─ Saved quotedPrice:', orderData.quotedPrice);
    console.log('  ├─ Saved subtotal:', orderData.subtotal);
    console.log('  ├─ Saved discountPercentage:', orderData.discountPercentage);
    console.log('  ├─ Saved discountAmount:', orderData.discountAmount);
    console.log('  ├─ Saved subtotalAfterDiscount:', orderData.subtotalAfterDiscount);
    console.log('  ├─ Saved vat:', orderData.vat);
    console.log('  ├─ Saved total:', orderData.total);
    console.log('  ├─ Saved quoteItems count:', (orderData.quoteItems as any[])?.length || 0);
    console.log('  └─ ALL order fields:', Object.keys(orderData).slice(0, 15), '...');
    
    console.log('[Unified Orders API] ✅ Returning to admin with discount data:', {
      id: orderData._id,
      quotedPrice: orderData.quotedPrice,
      subtotal: orderData.subtotal,
      discountPercentage: orderData.discountPercentage,
      discountAmount: orderData.discountAmount,
      quoteItemsCount: (orderData.quoteItems as any[])?.length || 0,
    });
    
    return NextResponse.json({
      success: true,
      order: orderData,
    });
  } catch (error) {
    console.error('[API] PATCH /orders/unified/[id] failed:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/unified/[id]
 * 
 * Soft delete order (both custom and regular)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[DELETE] 🗑️ Called with ID:', id);
    console.log('[DELETE] ID type:', typeof id);
    console.log('[DELETE] ID length:', id?.length);

    await connectDB();
    console.log('[DELETE] ✅ Connected to database');

    // Verify the order exists BEFORE deletion
    console.log('[DELETE] 🔍 Looking for order with ID:', id);
    const existingOrder = await UnifiedOrder.findById(id);
    console.log('[DELETE] Found existing order?', !!existingOrder);
    if (existingOrder) {
      console.log('[DELETE] Order details:', {
        orderNumber: existingOrder.orderNumber,
        isActive: existingOrder.isActive,
        status: existingOrder.status,
      });
    }

    if (!existingOrder) {
      console.error('[DELETE] ❌ Order does not exist with ID:', id);
      return NextResponse.json(
        { error: 'Order not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Admins can remove any order. Customers can only remove their own unpaid orders,
    // so a paid order can never disappear from the admin dashboard.
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      const buyer = await getBuyerFromRequest(request);
      const ownsOrder = buyer && (
        (existingOrder.buyerId && String(existingOrder.buyerId) === String(buyer._id)) ||
        (existingOrder.email || '').toLowerCase() === String(buyer.email).toLowerCase()
      );
      if (!ownsOrder) {
        return NextResponse.json(
          { error: 'Not authenticated', message: 'Please log in to manage this order' },
          { status: 401 }
        );
      }
      if (existingOrder.paymentVerified) {
        return NextResponse.json(
          { error: 'Paid order', message: 'This order has been paid and can no longer be deleted. Please contact support.' },
          { status: 403 }
        );
      }
    }

    // Perform the soft delete
    console.log('[DELETE] 🔄 Attempting to update order to isActive=false...');
    const deletedOrder = await UnifiedOrder.findByIdAndUpdate(
      id,
      { 
        isActive: false, 
        deletedAt: new Date() 
      },
      { new: true }
    );

    console.log('[DELETE] Update returned:', !!deletedOrder);
    if (deletedOrder) {
      console.log('[DELETE] Updated order:', {
        orderNumber: deletedOrder.orderNumber,
        isActive: deletedOrder.isActive,
        deletedAt: deletedOrder.deletedAt,
      });
    }

    if (!deletedOrder) {
      console.error('[DELETE] ❌ findByIdAndUpdate returned null');
      return NextResponse.json(
        { error: 'Failed to delete order', message: 'Failed to delete order' },
        { status: 500 }
      );
    }

    // Verify the order was actually deleted by querying again
    console.log('[DELETE] ✅ Verifying deletion...');
    const verifyDeleted = await UnifiedOrder.findById(id);
    if (verifyDeleted) {
      console.log('[DELETE] Verification - order after delete:', {
        orderNumber: verifyDeleted.orderNumber,
        isActive: verifyDeleted.isActive,
      });
    }

    console.log('[DELETE] ✅ Order soft deleted successfully:', deletedOrder.orderNumber);
    return NextResponse.json(
      {
        success: true,
        message: 'Order deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE] ❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete order';
    console.error('[DELETE] Error message:', errorMessage);
    console.error('[DELETE] Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: errorMessage,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
