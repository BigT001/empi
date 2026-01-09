import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import Buyer from '@/lib/models/Buyer';
import Invoice from '@/lib/models/Invoice';
import Product from '@/lib/models/Product';
import { serializeDoc, serializeDocs } from '@/lib/serializer';
import { sendInvoiceEmail } from '@/lib/email';
import { generateProfessionalInvoiceHTML } from '@/lib/professionalInvoice';

// POST create/save order from Paystack
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await connectDB();
    
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
      price: item.price || item.unitPrice || 0,
      mode: item.mode || 'buy',
      rentalDays: item.rentalDays || 0,
      imageUrl: item.imageUrl || item.image || undefined, // Preserve image from cart if present
    }));

    // Calculate VAT (7.5% of subtotal)
    const subtotal = body.pricing?.subtotal || body.subtotal || 0;
    const vatRate = 7.5;
    const vat = subtotal * (vatRate / 100);

    // Calculate caution fee for rentals (50% per costume quantity, NOT per day)
    let cautionFee = 0;
    const rentalBaseTotal = processedItems
      .filter((item: any) => item.mode === 'rent')
      .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    if (rentalBaseTotal > 0) {
      cautionFee = rentalBaseTotal * 0.5;
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
      // Shipping removed from checkout totals - force zero
      shippingCost: 0,
      total: body.pricing?.total || body.total || 0,
      
      // Shipping info
      shippingType: body.shipping?.option || body.shippingType || 'standard',
      // Delivery fee removed from checkout totals
      deliveryFee: 0,
      
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
      
      // Pricing breakdown (from checkout)
      pricing: body.pricing || undefined,
      
      // Custom order linking (if this is a custom order payment)
      isCustomOrder: body.isCustomOrder || false,
      customOrderId: body.customOrderId || undefined,
      
      paymentMethod: body.paymentMethod || 'paystack',
      status: body.status || 'pending', // Orders start in pending status
    });

    // Validate order before saving
    const validationError = order.validateSync();
    if (validationError) {
      console.error('❌ Order validation error:', validationError);
      console.error('Order data being saved:', {
        orderNumber: order.orderNumber,
        items: order.items,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        total: order.total,
        status: order.status,
      });
      return NextResponse.json({ 
        error: 'Order validation failed',
        details: validationError.message
      }, { status: 400 });
    }

    // Check if order with this orderNumber already exists (prevent duplicates)
    const existingOrder = await Order.findOne({ orderNumber: order.orderNumber });
    if (existingOrder) {
      console.log(`⚠️ Order with orderNumber ${order.orderNumber} already exists. Returning existing order.`);
      return NextResponse.json({ 
        success: true,
        message: 'Order already exists',
        orderId: existingOrder._id,
        orderNumber: existingOrder.orderNumber,
      }, { status: 200 });
    }

    await order.save();
    
    console.log('[Orders API] 🎯 ORDER CREATED:', {
      orderNumber: order.orderNumber,
      _id: order._id,
      isCustomOrder: order.isCustomOrder,
      customOrderId: order.customOrderId,
      status: order.status,
    });
    
    // If this is a custom order payment, update the custom order status to "approved"
    if (body.isCustomOrder && body.customOrderId) {
      try {
        console.log('[Orders API] 🔗 LINKING CUSTOM ORDER');
        console.log('[Orders API]   Order _id:', order._id);
        console.log('[Orders API]   CustomOrder _id:', body.customOrderId);
        
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
        console.log('[Orders API] 👤 CREATING/FINDING GUEST BUYER');
        console.log('[Orders API]   Email:', email);
        console.log('[Orders API]   fullName:', fullName);
        
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
          console.log(`✅ Guest buyer CREATED with ID: ${guestBuyer._id}`);
          console.log(`   Email: ${guestBuyer.email}`);
          console.log(`   Full Name: ${guestBuyer.fullName}`);
        } else {
          // Update existing guest buyer with latest info if needed
          console.log(`✅ Guest buyer ALREADY EXISTS: ${existingBuyer._id}`);
          if (existingBuyer.phone !== phone && phone) {
            existingBuyer.phone = phone;
            await existingBuyer.save();
          }
        }
      } catch (buyerErr) {
        console.error('[Orders API] ❌ ERROR CREATING GUEST BUYER:', buyerErr);
        // Don't fail the order if guest buyer creation fails
      }
    }
    
    console.log(`✅ Order created: ${order.orderNumber} for ${email || 'Unknown'}`);
    console.log(`Order status: ${order.status}`);
    
    // Link existing invoice from payment verification to the order's buyer
    // This is critical for guest checkout - the invoice was created during verify-payment without a buyerId
    let existingInvoiceFound = false; // Track if we found and updated an existing invoice
    if (order.status === 'confirmed' || order.status === 'completed') {
      try {
        console.log('[Orders API] 🔗 LINKING INVOICE TO BUYER');
        console.log('[Orders API]   Order Number:', order.orderNumber);
        console.log('[Orders API]   Email:', order.email);
        console.log('[Orders API]   BuyerId:', order.buyerId || 'N/A (guest)');
        
        console.log('[Orders API] 🔍 Searching for invoice with:');
        console.log('[Orders API]   - orderNumber:', order.orderNumber);
        console.log('[Orders API]   - paymentVerified: true');
        
        // Look for existing invoice by payment reference (orderNumber from Paystack)
        const existingInvoice = await Invoice.findOne({ 
          orderNumber: order.orderNumber,
          paymentVerified: true 
        });
        
        if (existingInvoice) {
          existingInvoiceFound = true; // Mark that we found an existing invoice
          console.log('[Orders API] ✅ FOUND existing invoice!');
          console.log('[Orders API]   - invoiceNumber:', existingInvoice.invoiceNumber);
          console.log('[Orders API]   - _id:', existingInvoice._id);
          console.log('[Orders API]   - Current customerEmail:', existingInvoice.customerEmail);
          console.log('[Orders API]   - Current buyerId:', existingInvoice.buyerId || 'NONE');
          
          // Link the invoice to the buyer (either logged-in user or guest)
          let buyerIdToUse = order.buyerId;
          
          // If no buyerId but we have email, we need to find or create the guest buyer record
          if (!buyerIdToUse && email) {
            try {
              console.log('[Orders API] 🔎 Looking for guest buyer by email:', email);
              const guestBuyer = await Buyer.findOne({ email: email.toLowerCase() });
              if (guestBuyer) {
                buyerIdToUse = guestBuyer._id.toString();
                console.log('[Orders API] ✅ Found guest buyer ID:', buyerIdToUse);
              } else {
                console.log('[Orders API] ⚠️ No guest buyer found for email:', email);
              }
            } catch (guestBuyerErr) {
              console.warn('[Orders API] Could not find guest buyer:', guestBuyerErr);
            }
          }
          
          // Update the invoice with buyerId, customerName, and other order details
          console.log('[Orders API] 📝 Updating invoice with:');
          console.log('[Orders API]   - buyerId:', buyerIdToUse || 'STILL NO BUYERID!');
          console.log('[Orders API]   - customerName:', `${order.firstName} ${order.lastName}`);
          console.log('[Orders API]   - customerEmail:', order.email);
          console.log('[Orders API]   - totalAmount:', order.total);
          
          existingInvoice.buyerId = buyerIdToUse || undefined;
          existingInvoice.customerName = `${order.firstName} ${order.lastName}`;
          existingInvoice.customerEmail = order.email;
          existingInvoice.customerPhone = order.phone || '';
          existingInvoice.customerAddress = order.address || '';
          existingInvoice.customerCity = order.city || '';
          existingInvoice.customerState = order.state || '';
          existingInvoice.customerPostalCode = order.zipCode || '';
          existingInvoice.subtotal = order.subtotal || 0;
          // Ensure invoices do not include shipping
          existingInvoice.shippingCost = 0;
          existingInvoice.taxAmount = order.vat || 0;
          existingInvoice.totalAmount = order.total || 0;
          existingInvoice.items = (order.items || []).map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            mode: item.mode,
          }));
          
          await existingInvoice.save();
          console.log('[Orders API] ✅✅✅ INVOICE LINKED AND UPDATED!');
          console.log('[Orders API]   - invoiceNumber:', existingInvoice.invoiceNumber);
          console.log('[Orders API]   - buyerId:', existingInvoice.buyerId);
          console.log('[Orders API]   - customerEmail:', existingInvoice.customerEmail);
          console.log('[Orders API]   - totalAmount:', existingInvoice.totalAmount);
        } else {
          console.log('[Orders API] ❌ NO INVOICE FOUND for orderNumber:', order.orderNumber);
          console.log('[Orders API] This might mean:');
          console.log('[Orders API]   1. verify-payment was not called');
          console.log('[Orders API]   2. Invoice was created with different orderNumber');
          console.log('[Orders API]   3. Invoice was created with paymentVerified: false');
        }
      } catch (invoiceLinkError) {
        console.error('[Orders API] ❌ CRITICAL ERROR linking invoice:', invoiceLinkError);
        // Don't fail the whole process
      }
    }
    
    // Generate invoice automatically (for Paystack payments and checkout orders)
    // BUT skip if we already linked an existing invoice from payment verification
    let invoiceResult = null;
    if (!existingInvoiceFound && (order.status === 'confirmed' || order.status === 'completed')) {
      try {
        console.log('[Orders API] Generating invoice for order:', order.orderNumber);
        console.log('[Orders API] Order status is:', order.status);
        
        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const invoiceDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Prepare invoice data - call the proven working endpoint
        // Build invoice payload using structured pricing and excluding shipping
        const pricing = (order as any).pricing || {};
        const goodsSubtotal = pricing.goodsSubtotal ?? order.subtotal ?? 0;
        const cautionFee = pricing.cautionFee ?? order.cautionFee ?? 0;
        const taxAmount = pricing.tax ?? order.vat ?? 0;
        const subtotalWithCaution = goodsSubtotal + (cautionFee || 0);
        const totalAmount = subtotalWithCaution + (taxAmount || 0);

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
          subtotal: goodsSubtotal,
          goodsSubtotal: goodsSubtotal,
          cautionFee: cautionFee,
          subtotalWithCaution: subtotalWithCaution,
          shippingCost: 0,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
          items: (order.items || []).map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            mode: item.mode,
            rentalDays: item.rentalDays || 0,
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
              subtotal: goodsSubtotal,
              goodsSubtotal: goodsSubtotal,
              cautionFee: cautionFee,
              subtotalWithCaution: subtotalWithCaution,
              shippingCost: 0,
              taxAmount: taxAmount,
              totalAmount: totalAmount,
              items: (order.items || []).map((item: any) => ({ ...item, rentalDays: item.rentalDays || 0 })) || [],
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
