import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import Invoice from '@/lib/models/Invoice';
import Product from '@/lib/models/Product';
import { serializeDoc, serializeDocs } from '@/lib/serializer';
import { sendInvoiceEmail } from '@/lib/email';
import { generateProfessionalInvoiceHTML } from '@/lib/professionalInvoice';
import {
  determineOrderType,
  validateOrderItems,
  calculateOrderMetrics,
  getOrderSummary,
} from '@/lib/utils/orderUtils';
import { calculateCautionFeeAmount } from '@/lib/utils/cautionFeeUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectDB();

    // ============ STEP 1: Extract and validate customer info ============
    const customerName = body.customer?.name || '';
    const [firstName, ...lastNameParts] = customerName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Customer';
    const email = body.customer?.email || body.email || '';
    const phone = body.customer?.phone || body.phone || null;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // ============ STEP 2: Process and validate items ============
    const processedItems = (body.items || []).map((item: any) => ({
      productId: item.productId || item.id || `PROD-${Date.now()}`,
      name: item.name || 'Product',
      quantity: item.quantity || 1,
      price: item.price || item.unitPrice || 0,
      mode: item.mode || 'buy', // DEFAULT: critical safety
      rentalDays: item.rentalDays || 0,
      imageUrl: item.imageUrl || item.image || undefined,
    }));

    // Validate items using utility
    const validation = validateOrderItems(processedItems);
    if (!validation.valid) {
      console.error('[Order API] Validation failed:', validation.errors);
      return NextResponse.json(
        { error: 'Invalid order items', details: validation.errors },
        { status: 400 }
      );
    }

    // ============ STEP 3: Determine order type using utility ============
    const orderType = determineOrderType(processedItems);
    const metrics = calculateOrderMetrics(processedItems);

    // ============ STEP 4: Calculate caution fee (ONLY for rentals) ============
    const cautionFee = calculateCautionFeeAmount(processedItems);
    if (orderType === 'sales' && cautionFee > 0) {
      console.warn('[Order API] Sales order should not have caution fee');
    }

    // ============ STEP 5: Calculate pricing ============
    const subtotal = body.pricing?.subtotal || body.subtotal || 0;
    const vatRate = 7.5;
    const vat = Math.round((subtotal * (vatRate / 100)) * 100) / 100;
    const total = body.pricing?.total || body.total || 0;

    // ============ STEP 6: Create order ============
    const orderNumber = body.reference || `ORD-${Date.now()}`;

    const order = new Order({
      buyerId: body.buyerId || undefined,
      orderNumber,
      orderType, // Use utility result
      firstName: firstName || 'Customer',
      lastName,
      email,
      phone,
      items: processedItems,
      subtotal,
      vat,
      vatRate,
      shippingCost: 0,
      total,
      shippingType: body.shipping?.option || 'standard',
      deliveryFee: 0,
      address: body.address || null,
      busStop: body.busStop || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,
      country: body.country || 'Nigeria',
      rentalSchedule: body.rentalSchedule || undefined,
      cautionFee: cautionFee > 0 ? cautionFee : undefined,
      pricing: body.pricing || undefined,
      isCustomOrder: body.isCustomOrder || false,
      customOrderId: body.customOrderId || undefined,
      paymentMethod: body.paymentMethod || 'paystack',
      status: body.status || 'pending',
    });

    // ============ STEP 7: Validate Mongoose schema ============
    const validationError = order.validateSync();
    if (validationError) {
      console.error('[Order API] Mongoose validation failed:', validationError.message);
      return NextResponse.json(
        { error: 'Order validation failed', details: validationError.message },
        { status: 400 }
      );
    }

    // ============ STEP 8: Check for duplicates ============
    const existingOrder = await Order.findOne({ orderNumber });
    if (existingOrder) {
      console.log(`[Order API] Order ${orderNumber} already exists`);
      return NextResponse.json(
        { success: true, message: 'Order already exists', orderId: existingOrder._id },
        { status: 200 }
      );
    }

    // ============ STEP 9: Save order ============
    await order.save();

    // Log using utility
    console.log(`[Order API] ✅ ${getOrderSummary(processedItems, orderNumber)}`);

    // ============ STEP 10: Handle custom order linking ============
    if (body.isCustomOrder && body.customOrderId) {
      try {
        await CustomOrder.findByIdAndUpdate(
          body.customOrderId,
          { status: 'approved' },
          { new: true }
        );
      } catch (err) {
        console.error('[Order API] Failed to update custom order:', err);
      }
    }

    // ============ STEP 11: Generate invoice ============
    let invoice = null;
    try {
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      invoice = new Invoice({
        invoiceNumber,
        orderNumber,
        buyerId: order.buyerId,
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        customerPhone: phone || '',
        subtotal,
        cautionFee: cautionFee || 0,
        taxAmount: vat,
        totalAmount: total,
        items: processedItems,
        invoiceDate,
        dueDate,
        currency: 'NGN',
        currencySymbol: '₦',
      });

      await invoice.save();

      // Send invoice email
      try {
        const invoiceHtml = generateProfessionalInvoiceHTML(invoice.toObject());
        const customerName = body.buyerName || (body.email.split('@')[0]);
        await sendInvoiceEmail(email, customerName, invoiceNumber, invoiceHtml);
      } catch (emailErr) {
        console.warn('[Order API] Failed to send invoice email:', emailErr);
      }
    } catch (invoiceErr) {
      console.error('[Order API] Failed to create invoice:', invoiceErr);
    }

    // ============ STEP 12: Return success response ============
    return NextResponse.json(
      {
        success: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        total: order.total,
        cautionFee: order.cautionFee || 0,
        invoice: invoice ? { invoiceNumber: invoice.invoiceNumber } : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Order API] Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to populate imageUrl for order items from Product collection
async function populateOrderImages(order: any) {
  if (!order || !order.items || order.items.length === 0) {
    return order;
  }

  try {
    // Get unique product IDs that don't already have imageUrl
    const productIds = order.items
      .map((item: any) => item.productId)
      .filter((id: string) => id && !order.items.find((item: any) => item.imageUrl && item.productId === id));

    if (productIds.length === 0) {
      return order; // All items already have imageUrl
    }

    // Fetch products in batch
    const products = await Product.find({ _id: { $in: productIds } }).select('_id imageUrl');
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p.imageUrl]));

    // Add imageUrl to items (only if they don't already have it)
    order.items = order.items.map((item: any) => ({
      ...item,
      imageUrl: item.imageUrl || productMap.get(item.productId?.toString()),
    }));
  } catch (err) {
    console.warn('[Orders API] Warning: Failed to populate product images:', err);
    // Don't fail the request if image population fails
  }

  return order;
}

// Helper function to populate images for multiple orders
async function populateOrdersImages(orders: any[]) {
  if (!orders || orders.length === 0) {
    return orders;
  }

  try {
    // Collect all unique product IDs that don't have imageUrl
    const productIdsToFetch = new Set<string>();
    orders.forEach((order: any) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          if (item.productId && !item.imageUrl) {
            productIdsToFetch.add(item.productId);
          }
        });
      }
    });

    if (productIdsToFetch.size === 0) {
      return orders; // All items already have imageUrl
    }

    // Fetch products in batch
    const products = await Product.find({ _id: { $in: Array.from(productIdsToFetch) } }).select('_id imageUrl');
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p.imageUrl]));

    // Add imageUrl to items in all orders (only if they don't already have it)
    return orders.map((order: any) => ({
      ...order,
      items: (order.items || []).map((item: any) => ({
        ...item,
        imageUrl: item.imageUrl || productMap.get(item.productId?.toString()),
      })),
    }));
  } catch (err) {
    console.warn('[Orders API] Warning: Failed to populate product images for batch:', err);
    // Don't fail the request if image population fails
    return orders;
  }
}

// GET order by ID or reference
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ref = searchParams.get('ref');
    const email = searchParams.get('email');
    const buyerId = searchParams.get('buyerId');
    const includeCustom = searchParams.get('includeCustom');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (ref) {
      // Lookup by Paystack reference
      let order = await Order.findOne({ 
        $or: [{ reference: ref }, { orderNumber: ref }]
      });
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      const serialized = serializeDoc(order);
      const withImages = await populateOrderImages(serialized);
      return NextResponse.json({ success: true, order: withImages });
    }

    if (id) {
      let order = await Order.findById(id);
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      const serialized = serializeDoc(order);
      const withImages = await populateOrderImages(serialized);
      return NextResponse.json({ success: true, order: withImages });
    }

    // Get orders - filter by buyerId or email, but EXCLUDE custom order payments
    let query: any = {};
    if (buyerId) {
      query.buyerId = buyerId;
    } else if (email) {
      query.email = email;
    }
    // Exclude orders created for custom order payments by default
    // If `includeCustom=true` is provided, do not exclude custom orders
    if (includeCustom !== 'true') {
      query.$and = [
        { $or: [{ isCustomOrder: { $ne: true } }, { isCustomOrder: { $exists: false } }] },
        { $or: [{ customOrderId: { $eq: null } }, { customOrderId: { $exists: false } }] }
      ];
    }
    
    let orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit);
    console.log(`[Orders API] Fetched ${orders.length} orders for buyerId: ${buyerId || 'N/A'}, email: ${email || 'N/A'} (limit: ${limit})`);
    const serialized = serializeDocs(orders);
    // Add fullName to each order for logistics display
    const ordersWithFullName = serialized.map((order: any) => {
      const computed = order.fullName || `${order.firstName || ''} ${order.lastName || ''}`.trim() || order.orderNumber;
      console.log(`[Orders API] Order ${order.orderNumber}: firstName="${order.firstName}", lastName="${order.lastName}", fullName="${order.fullName}" -> computed="${computed}"`);
      return {
        ...order,
        fullName: computed
      };
    });
    console.log(`[Orders API] ✅ Response includes ${ordersWithFullName.length} orders with fullName computed`);
    if (ordersWithFullName.length > 0) {
      console.log(`[Orders API] First order in response:`, JSON.stringify(ordersWithFullName[0], null, 2));
    }
    const withImages = await populateOrdersImages(ordersWithFullName);
    return NextResponse.json({ success: true, orders: withImages });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
