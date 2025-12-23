import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import Buyer from '@/lib/models/Buyer';
import Product from '@/lib/models/Product';
import { serializeDoc, serializeDocs } from '@/lib/serializer';
import { sendInvoiceEmail } from '@/lib/email';
import { generateProfessionalInvoiceHTML } from '@/lib/professionalInvoice';

// POST create/save order from Paystack
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Extract customer info
    const customerName = body.customer?.name || '';
    const [firstName, ...lastNameParts] = customerName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Customer';
    const fullName = customerName || `${firstName} ${lastName}`.trim();
    const email = body.customer?.email || body.email || '';
    const phone = body.customer?.phone || body.phone || null;

    // Process items - add productId if missing
    const processedItems = (body.items || []).map((item: any) => ({
      productId: item.productId || item.id || `PROD-${Date.now()}`,
      name: item.name || 'Product',
      quantity: item.quantity || 1,
      price: item.price || 0,
      mode: item.mode || 'buy',
      rentalDays: item.rentalDays || 0,
    }));

    // Calculate VAT (7.5% of subtotal)
    const subtotal = body.pricing?.subtotal || body.subtotal || 0;
    const vatRate = 7.5;
    const vat = subtotal * (vatRate / 100);

    // Calculate caution fee for rentals (50% of total rental cost)
    let cautionFee = 0;
    const rentalTotal = processedItems
      .filter((item: any) => item.mode === 'rent')
      .reduce((sum: number, item: any) => sum + (item.price * item.quantity * (item.rentalDays || 1)), 0);
    if (rentalTotal > 0) {
      cautionFee = rentalTotal * 0.5;
    }

    const order = new Order({
      // Customer info
      buyerId: body.buyerId || undefined, // Set if user is logged in (registered customer)
      firstName: firstName || 'Customer',
      lastName: lastName,
      email: email,
      phone: phone,
      
      // Order info
      orderNumber: body.reference || `ORD-${Date.now()}`,
      items: processedItems,
      subtotal: subtotal,
      vat: Math.round(vat * 100) / 100, // Round to 2 decimal places
      vatRate: vatRate,
      shippingCost: body.pricing?.shipping || body.shippingCost || 0,
      total: body.pricing?.total || body.total || 0,
      
      // Shipping info
      shippingType: body.shipping?.option || body.shippingType || 'standard',
      deliveryFee: body.pricing?.shipping || body.deliveryFee || 0,
      
      // Address (if provided)
      address: body.address || null,
      busStop: body.busStop || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,
      country: body.country || 'Nigeria',
      
      // Rental schedule (if provided)
      rentalSchedule: body.rentalSchedule || undefined,
      cautionFee: cautionFee > 0 ? cautionFee : undefined,
      
      paymentMethod: body.paymentMethod || 'paystack',
      status: body.status || 'confirmed',
    });

    // Validate order before saving
    const validationError = order.validateSync();
    if (validationError) {
      console.error('❌ Order validation error:', validationError.message);
      
      // Log detailed field errors
      const fieldErrors: any = {};
      for (const path in validationError.errors) {
        const error = validationError.errors[path];
        fieldErrors[path] = error.message;
      }
      console.error('Field validation errors:', fieldErrors);
      
      console.error('Order data being saved:', {
        orderNumber: order.orderNumber,
        items: order.items,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        total: order.total,
        status: order.status,
        shippingType: order.shippingType,
      });
      return NextResponse.json({ 
        error: 'Order validation failed',
        details: validationError.message,
        fieldErrors: fieldErrors
      }, { status: 400 });
    }

    await order.save();
    
    // If this is a custom order payment, update the custom order status to "approved"
    if (body.isCustomOrder && body.customOrderId) {
      try {
        const customOrder = await CustomOrder.findByIdAndUpdate(
          body.customOrderId,
          { status: 'approved' },
          { new: true }
        );
        console.log('[Orders API] ✅ Custom order status updated to approved:', customOrder?.orderNumber);
      } catch (customOrderError) {
        console.error('[Orders API] ⚠️ Failed to update custom order status:', customOrderError);
        // Don't fail the whole process if custom order update fails
      }
    }
    
    // If guest checkout (no buyerId), create or update guest Buyer record
    if (!body.buyerId && email) {
      try {
        // Check if guest user already exists
        const existingBuyer = await Buyer.findOne({ email: email.toLowerCase() });
        
        if (!existingBuyer) {
          // Create new guest buyer record (with a temporary password)
          const guestBuyer = new Buyer({
            email: email.toLowerCase(),
            fullName: fullName,
            phone: phone || '',
            password: `guest_${Date.now()}`, // Temporary password
            isAdmin: false,
          });
          await guestBuyer.save();
          console.log(`✅ Guest buyer created: ${email}`);
        } else {
          // Update existing guest buyer with latest info if needed
          if (existingBuyer.phone !== phone && phone) {
            existingBuyer.phone = phone;
            await existingBuyer.save();
          }
          console.log(`✅ Guest buyer already exists: ${email}`);
        }
      } catch (buyerErr) {
        console.error(`⚠️ Warning: Failed to create guest buyer record: ${email}`, buyerErr);
        // Don't fail the order if guest buyer creation fails
      }
    }
    
    console.log(`✅ Order created: ${order.orderNumber} for ${email || 'Unknown'}`);
    console.log(`Order status: ${order.status}`);
    
    // Generate invoice automatically (for Paystack payments and checkout orders)
    let invoiceResult = null;
    // Check the actual saved order status, not the input body
    if (order.status === 'confirmed' || order.status === 'completed') {
      try {
        console.log('[Orders API] Generating invoice for order:', order.orderNumber);
        console.log('[Orders API] Order status is:', order.status);
        
        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const invoiceDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Prepare invoice data - call the proven working endpoint
        const invoicePayload = {
          invoiceNumber,
          orderNumber: order.orderNumber,
          buyerId: order.buyerId || null,
          customerName: `${order.firstName} ${order.lastName}`,
          customerEmail: order.email,
          customerPhone: order.phone || '',
          customerAddress: order.address || '',
          customerCity: order.city || '',
          customerState: order.state || '',
          customerPostalCode: order.zipCode || '',
          subtotal: order.subtotal || 0,
          shippingCost: order.shippingCost || 0,
          taxAmount: order.vat || 0,
          totalAmount: order.total || 0,
          items: (order.items || []).map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            mode: item.mode,
          })),
          invoiceDate: invoiceDate.toISOString(),
          dueDate: dueDate.toISOString(),
          currency: 'NGN',
          currencySymbol: '₦',
          taxRate: order.vatRate || 7.5,
          type: 'automatic',
          status: 'sent',
        };

        console.log('[Orders API] Calling /api/invoices with:', {
          invoiceNumber,
          customerName: invoicePayload.customerName,
          customerEmail: invoicePayload.customerEmail,
          totalAmount: invoicePayload.totalAmount,
        });

        // Call the working /api/invoices endpoint
        const invoiceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/api/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoicePayload),
        });

        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          console.log('[Orders API] Invoice successfully created:', invoiceData.invoiceNumber);
          
          // Send invoice emails to customer and admin
          try {
            console.log('[Orders API] Sending invoice emails...');
            const invoiceForEmail = invoiceData.invoice || {
              invoiceNumber: invoiceData.invoiceNumber,
              customerName: `${order.firstName} ${order.lastName}`,
              customerEmail: order.email,
              customerPhone: order.phone || '',
              customerAddress: order.address || '',
              customerCity: order.city || '',
              customerState: order.state || '',
              customerPostalCode: order.zipCode || '',
              subtotal: order.subtotal || 0,
              shippingCost: order.shippingCost || 0,
              taxAmount: order.vat || 0,
              totalAmount: order.total || 0,
              items: order.items || [],
              invoiceDate: new Date().toISOString(),
              dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
              currency: 'NGN',
              currencySymbol: '₦',
              taxRate: order.vatRate || 7.5,
            };

            const invoiceHtml = generateProfessionalInvoiceHTML(invoiceForEmail);
            const emailResult = await sendInvoiceEmail(
              order.email,
              `${order.firstName} ${order.lastName}`,
              invoiceData.invoiceNumber,
              invoiceHtml,
              order.orderNumber
            );
            
            console.log('[Orders API] Invoice emails sent - Customer:', emailResult.customerSent, 'Admin:', emailResult.adminSent);
          } catch (emailError) {
            console.warn('[Orders API] Failed to send invoice emails:', emailError);
            // Don't fail the whole process if email sending fails
          }
          
          invoiceResult = { 
            success: true, 
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceId: invoiceData.invoice?._id 
          };
        } else {
          const errorData = await invoiceResponse.json();
          console.warn('[Orders API] Invoice endpoint returned error:', errorData.error);
          invoiceResult = { success: false, error: errorData.error };
        }
      } catch (invoiceError) {
        console.error('[Orders API] Invoice generation failed:', invoiceError);
        console.error('[Orders API] Invoice error details:', invoiceError instanceof Error ? invoiceError.message : invoiceError);
        // Don't fail order creation if invoice generation fails
        invoiceResult = { success: false };
      }
    } else {
      console.log('[Orders API] Skipping invoice generation - order status is:', order.status);
    }
    
    // Emit Socket.IO notification for new order
    try {
      const { getSocket } = await import('@/lib/socket');
      const io = getSocket();
      if (io) {
        io.emit('new-order', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: `${order.firstName} ${order.lastName}`,
          customerEmail: order.email,
          totalAmount: order.total,
          items: order.items,
          status: order.status,
          timestamp: new Date(),
        });
        console.log('[Orders API] 📡 Socket.IO notification emitted for new order');
      }
    } catch (socketError) {
      console.warn('[Orders API] ⚠️ Could not emit Socket.IO notification:', socketError);
    }
    
    return NextResponse.json({
      success: true,
      orderId: order._id,
      reference: order.orderNumber,
      message: 'Order saved successfully',
      invoice: invoiceResult?.success ? {
        invoiceNumber: invoiceResult.invoiceNumber,
        invoiceId: invoiceResult.invoiceId,
      } : null,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 400 });
  }
}

// Helper function to populate imageUrl for order items from Product collection
async function populateOrderImages(order: any) {
  if (!order || !order.items || order.items.length === 0) {
    return order;
  }

  try {
    // Get unique product IDs
    const productIds = order.items
      .map((item: any) => item.productId)
      .filter((id: string) => id && !order.items.find((item: any) => item.imageUrl && item.productId === id));

    if (productIds.length === 0) {
      return order; // All items already have imageUrl
    }

    // Fetch products in batch
    const products = await Product.find({ _id: { $in: productIds } }).select('_id imageUrl');
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p.imageUrl]));

    // Add imageUrl to items
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

    // Add imageUrl to items in all orders
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

    // Get orders - filter by email if provided
    let query: any = {};
    if (email) {
      query.email = email;
    }
    let orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit);
    console.log(`[Orders API] Fetched ${orders.length} orders for email: ${email || 'all'} (limit: ${limit})`);
    const serialized = serializeDocs(orders);
    const withImages = await populateOrdersImages(serialized);
    return NextResponse.json({ success: true, orders: withImages });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
