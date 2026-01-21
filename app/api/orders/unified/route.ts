import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import { createInvoiceFromOrder } from '@/lib/createInvoiceFromOrder';
import { logOrderModeDiagnostics } from '@/lib/utils/orderDiagnostics';
import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (err) {
  console.warn('[API] ⚠️ Cloudinary configuration warning:', err);
}

/**
 * GET /api/orders/unified
 * 
 * Fetch orders with flexible filtering
 * Query params: email, status, orderType, currentHandler, buyerId, limit, ref
 * 
 * Works for both custom and regular orders!
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Unified Orders API] GET /api/orders/unified called');
    await connectDB();
    console.log('[Unified Orders API] ✅ Connected to DB');

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const orderType = searchParams.get('orderType');
    const currentHandler = searchParams.get('currentHandler');
    const buyerId = searchParams.get('buyerId');
    const ref = searchParams.get('ref');
    const limit = parseInt(searchParams.get('limit') || '100');

    const query: Record<string, unknown> = { isActive: true };

    if (email) query.email = email;
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (currentHandler) query.currentHandler = currentHandler;
    if (buyerId) query.buyerId = buyerId;
    if (ref) query.reference = ref;

    console.log('[Unified Orders API] 🔍 Query:', query);
    
    let orders: any[] = [];
    try {
      const queryResult = await UnifiedOrder.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      
      // Ensure all discount fields are properly serialized
      orders = queryResult.map((order: any) => {
        // CRITICAL: Log pricing fields being returned
        if (order.orderType === 'custom') {
          console.log(`[Unified Orders API] 🔍 Custom order ${order.orderNumber} pricing from DB:`, {
            subtotal: order.subtotal,
            discountPercentage: order.discountPercentage,
            discountAmount: order.discountAmount,
            subtotalAfterDiscount: order.subtotalAfterDiscount,
            vat: order.vat,
            total: order.total,
          });
        }
        
        // Log rental schedule if present
        if (order.rentalSchedule) {
          console.log(`[Unified Orders API] 📅 Order ${order.orderNumber} has rental schedule:`, {
            pickupDate: order.rentalSchedule.pickupDate,
            pickupTime: order.rentalSchedule.pickupTime,
            returnDate: order.rentalSchedule.returnDate,
            pickupLocation: order.rentalSchedule.pickupLocation,
            rentalDays: order.rentalSchedule.rentalDays,
            rentalPolicyAgreed: order.rentalPolicyAgreed,
          });
        }
        
        return {
          ...order,
          // Ensure numeric fields are properly converted
          subtotal: order.subtotal ?? 0,
          vat: order.vat ?? 0,
          total: order.total ?? 0,
          cautionFee: order.cautionFee ?? 0,
          discountPercentage: order.discountPercentage ?? 0,
          discountAmount: order.discountAmount ?? 0,
          subtotalAfterDiscount: order.subtotalAfterDiscount ?? 0,
          // Ensure rental schedule is included
          rentalSchedule: order.rentalSchedule || undefined,
          rentalPolicyAgreed: order.rentalPolicyAgreed || false,
        };
      });
      
      console.log(`[Unified Orders API] ✅ Found ${orders.length} orders`);
    } catch (dbError) {
      console.error('[Unified Orders API] ❌ Database query failed:', dbError);
      throw new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }
    
    // Log custom order details for debugging (wrapped in try-catch to prevent crashes)
    try {
      orders.forEach((order: Record<string, unknown>) => {
        if (order.orderType === 'custom') {
          console.log(`[Unified Orders API] Custom Order: ${order.orderNumber}`, {
            requiredQuantity: order.requiredQuantity,
            designUrls: Array.isArray(order.designUrls) ? order.designUrls.length : 0,
            quotedPrice: order.quotedPrice,
            quoteItemsCount: Array.isArray(order.quoteItems) ? order.quoteItems.length : 0,
            quoteItems: order.quoteItems,
            description: order.description ? '✅' : '❌',
            firstName: order.firstName,
            email: order.email,
            city: order.city,
          });
        }
      });
    } catch (logError) {
      console.warn('[Unified Orders API] Warning logging order details:', logError);
      // Continue anyway, don't fail
    }
    
    // If searching by reference and found single order, return just that order
    if (ref && orders.length === 1) {
      console.log('[Unified Orders API] Returning single order by reference');
      return NextResponse.json(orders[0]);
    }
    
    console.log('[Unified Orders API] ✅ Returning', orders.length, 'orders');
    return NextResponse.json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error('[API] GET /orders/unified failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/unified
 * 
 * Create new order (both custom and regular)
 * Handles:
 * - JSON body for regular orders (from checkout)
 * - FormData for custom orders (from custom-costumes)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Unified Orders API] POST /api/orders/unified called');
    await connectDB();
    console.log('[Unified Orders API] ✅ Connected to DB');

    // Check for idempotency key to prevent duplicate order creation
    const idempotencyKey = request.headers.get('X-Idempotency-Key');
    if (idempotencyKey) {
      console.log(`[Unified Orders API] 🔑 Idempotency key found: ${idempotencyKey}`);
      
      // Check if we already processed this request
      const existingOrder = await UnifiedOrder.findOne({ 
        paymentReference: idempotencyKey,
        isActive: true 
      });
      
      if (existingOrder) {
        console.log(`[Unified Orders API] ⚠️ Order already created for this payment reference: ${existingOrder.orderNumber}`);
        return NextResponse.json(
          { 
            success: true,
            message: 'Order already exists for this payment',
            orderId: existingOrder._id?.toString(),
            orderNumber: existingOrder.orderNumber,
            invoice: { invoiceNumber: 'N/A' }
          },
          { status: 200 }
        );
      }
    }

    let body: Record<string, unknown> = {};
    const contentType = request.headers.get('content-type') || '';

    // Handle FormData (custom orders)
    if (contentType.includes('multipart/form-data')) {
      console.log('[Unified Orders API] Processing FormData (custom order)');
      const formData = await request.formData();
      
      // Extract design images for background processing
      const designImages = formData.getAll('designImages') as File[];
      const quantity = parseInt(formData.get('quantity') as string) || 1;
      const fullName = (formData.get('fullName') as string) || '';
      
      body = {
        email: (formData.get('email') as string || '').toLowerCase(),
        firstName: fullName?.split(/\s+/)[0] || '',
        lastName: fullName?.split(/\s+/).slice(1).join(' ') || '',
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipCode: formData.get('postalCode'), // Map postalCode from form to zipCode in schema
        buyerId: formData.get('buyerId'),
        orderType: 'custom',
        description: formData.get('description'),
        deliveryDate: formData.get('deliveryDate'),
        requiredQuantity: quantity,
        quantity: quantity,
        designImages: designImages, // Store for processing
      };
    } else {
      // Handle JSON (regular orders)
      console.log('[Unified Orders API] Processing JSON body (regular order)');
      body = await request.json();
      
      // CRITICAL LOGGING: Check if items have mode BEFORE any processing
      if (body.items && Array.isArray(body.items)) {
        console.log('[Unified Orders API] 🔍 RECEIVED ITEMS FROM CHECKOUT:');
        body.items.forEach((item: Record<string, unknown>, idx: number) => {
          console.log(`  [Item ${idx + 1}] "${item.name}"`, {
            mode: item.mode || '❌ MISSING',
            qty: item.quantity,
            price: item.price,
            hasMode: !!item.mode,
          });
        });
      }
      
      // Ensure all items have proper structure
      if (body.items && Array.isArray(body.items)) {
        body.items = body.items.map((item: Record<string, unknown>) => {
          const mapped = {
            ...item,
            image: (item.image as string) || (item.imageUrl as string) || '', // Ensure image field exists
            imageUrl: (item.imageUrl as string) || (item.image as string) || '', // Ensure imageUrl field exists too
          };
          console.log(`[Unified Orders API] Item mapping: "${item.name}" original mode: ${(item as any).mode || '❌ MISSING'} -> mapped mode: ${(mapped as any).mode || '❌ MISSING'}`);
          return mapped;
        });
      }
      
      // Log item details for debugging
      if (body.items && Array.isArray(body.items)) {
        console.log('[Unified Orders API] Items after processing:');
        body.items.forEach((item: Record<string, unknown>, idx: number) => {
          console.log(`  [${idx}] ${item.name} - mode: ${item.mode || '❌ MISSING'}`);
        });
      }
    }

    console.log('[Unified Orders API] 📝 Body:', { email: body.email, orderType: body.orderType, firstName: body.firstName, lastName: body.lastName });

    // Validate required fields
    if (!body.email || !body.firstName || !body.lastName) {
      console.error('[Unified Orders API] ❌ Missing required fields:', { email: !!body.email, firstName: !!body.firstName, lastName: !!body.lastName });
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, lastName' },
        { status: 400 }
      );
    }

    // Auto-detect orderType if not provided
    const orderType = body.orderType || (body.designImages ? 'custom' : 'regular');

    // For custom orders, ensure subtotal and total are provided or set defaults
    if (orderType === 'custom') {
      // If custom order doesn't have pricing, set placeholder values
      if (!body.subtotal) body.subtotal = 0;
      // Calculate VAT (7.5%)
      const vat = (body.subtotal as number) * 0.075;
      if (!body.vat) body.vat = vat;
      if (!body.total) body.total = (body.subtotal as number) + vat;
      console.log('[Unified Orders API] 💰 Custom order pricing:', { 
        subtotal: body.subtotal, 
        vat: body.vat,
        total: body.total 
      });
    }

    // Generate unique order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Prepare order data - ensure all fields are properly mapped
    const orderDataToSave = {
      // Basic Info
      orderNumber,
      orderType,
      
      // Customer Info
      firstName: (body.firstName as string) || '',
      lastName: (body.lastName as string) || '',
      email: (body.email as string) || '',
      phone: (body.phone as string) || '',
      address: (body.address as string) || undefined,
      city: (body.city as string) || '',
      state: (body.state as string) || undefined,
      zipCode: (body.zipCode as string) || undefined,
      buyerId: (body.buyerId as string) || undefined,
      
      // Items (empty for custom orders, will be populated when admin adds them)
      items: (body.items as Record<string, unknown>[]) || [],
      
      // Custom Order Specific
      description: (body.description as string) || undefined,
      designUrls: [], // Will be filled by background task if images exist
      requiredQuantity: (body.requiredQuantity as number) || (body.quantity as number) || 1,
      
      // Pricing
      subtotal: (body.subtotal as number) || 0,
      // CRITICAL: Include discount fields for regular orders
      discountPercentage: (body.discountPercentage as number) || 0,
      discountAmount: (body.discountAmount as number) || 0,
      subtotalAfterDiscount: (body.subtotalAfterDiscount as number) || (body.subtotal as number) || 0,
      vat: (body.vat as number) || 0,
      total: (body.total as number) || 0,
      cautionFee: (body.cautionFee as number) || 0,
      
      // Rental Schedule (if rental items exist)
      rentalSchedule: body.rentalSchedule ? {
        pickupDate: (body.rentalSchedule as any).pickupDate,
        pickupTime: (body.rentalSchedule as any).pickupTime,
        returnDate: (body.rentalSchedule as any).returnDate,
        pickupLocation: (body.rentalSchedule as any).pickupLocation,
        rentalDays: (body.rentalSchedule as any).rentalDays,
      } : undefined,
      rentalPolicyAgreed: (body as any).rentalPolicyAgreed || false,
      
      // Payment
      paymentVerified: orderType === 'regular' ? true : false,
      paymentReference: idempotencyKey || (body.paymentReference as string) || undefined,
      
      // Status & Logistics
      status: 'pending',
      currentHandler: 'production',
      
      // Timeline
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate as string) : undefined,
      
      // Metadata
      isActive: true,
    };

    // Remove designImages from order data (they're not a model field, we'll process them separately)
    const designImages = (body.designImages as File[]) || [];

    // CRITICAL: Log EXACTLY what's being saved to MongoDB
    console.log('[Unified Orders API] 🔍 ABOUT TO SAVE TO MONGODB:');
    console.log('[Unified Orders API] orderDataToSave.items:');
    if (orderDataToSave.items && Array.isArray(orderDataToSave.items)) {
      (orderDataToSave.items as Record<string, unknown>[]).forEach((item: Record<string, unknown>, idx: number) => {
        console.log(`  [${idx}] "${item.name}" - mode: ${item.mode || '❌ MISSING IN SAVE OBJECT'}, has mode: ${!!item.mode}`);
      });
    }
    
    // Log rental schedule if present
    if ((orderDataToSave as any).rentalSchedule) {
      console.log('[Unified Orders API] 📅 RENTAL SCHEDULE TO SAVE:');
      console.log('  Pickup Date:', (orderDataToSave as any).rentalSchedule.pickupDate);
      console.log('  Pickup Time:', (orderDataToSave as any).rentalSchedule.pickupTime);
      console.log('  Return Date:', (orderDataToSave as any).rentalSchedule.returnDate);
      console.log('  Location:', (orderDataToSave as any).rentalSchedule.pickupLocation);
      console.log('  Days:', (orderDataToSave as any).rentalSchedule.rentalDays);
      console.log('  Policy Agreed:', (orderDataToSave as any).rentalPolicyAgreed);
    } else {
      console.log('[Unified Orders API] ℹ️ No rental schedule (buy-only order)');
    }

    const newOrder = await UnifiedOrder.create(orderDataToSave);

    // CRITICAL LOGGING: Verify items were saved with mode
    console.log('[Unified Orders API] ✅ Order created:', { 
      id: newOrder._id, 
      number: newOrder.orderNumber, 
      type: orderType,
      itemCount: newOrder.items?.length || 0,
    });
    
    // CRITICAL: Log what came back from MongoDB
    console.log('[Unified Orders API] 🔍 RETRIEVED FROM MONGODB (after create):');
    if (newOrder.items && Array.isArray(newOrder.items)) {
      newOrder.items.forEach((item: any, idx: number) => {
        console.log(`  [${idx}] "${item.name}" - mode: ${item.mode || '❌ MISSING FROM DB'}, has mode: ${!!item.mode}`);
      });
    }
    
    // Log rental schedule from database
    if ((newOrder as any).rentalSchedule) {
      console.log('[Unified Orders API] ✅ RENTAL SCHEDULE RETRIEVED FROM DB:');
      console.log('  Pickup Date:', (newOrder as any).rentalSchedule.pickupDate);
      console.log('  Pickup Time:', (newOrder as any).rentalSchedule.pickupTime);
      console.log('  Return Date:', (newOrder as any).rentalSchedule.returnDate);
      console.log('  Location:', (newOrder as any).rentalSchedule.pickupLocation);
      console.log('  Days:', (newOrder as any).rentalSchedule.rentalDays);
      console.log('  Policy Agreed:', (newOrder as any).rentalPolicyAgreed);
    } else {
      console.log('[Unified Orders API] ❌ NO RENTAL SCHEDULE IN DATABASE');
    }
    
    // Use diagnostic function to log detailed item info
    logOrderModeDiagnostics(newOrder, `API Order ${newOrder.orderNumber}`);

    // Process images in background if this is a custom order with images
    if (orderType === 'custom' && designImages.length > 0) {
      uploadCustomOrderImagesInBackground(newOrder._id, designImages, orderNumber).catch((err) => {
        console.error(`[Background] Failed to upload images for order ${orderNumber}:`, err);
      });
    }

    // AUTO-GENERATE INVOICE for all paid orders
    let invoiceData = null;
    if (body.paymentVerified || orderType === 'regular') {
      try {
        console.log('[Unified Orders API] 📧 Auto-generating invoice...');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        invoiceData = await createInvoiceFromOrder(newOrder as any);
        if (invoiceData.success) {
          console.log('[Unified Orders API] ✅ Invoice created and sent:', invoiceData.invoiceNumber);
        }
      } catch (invoiceError) {
        console.error('[Unified Orders API] ⚠️ Invoice generation failed (non-blocking):', invoiceError);
        // Don't fail the order creation if invoice generation fails
      }
    }

    // 🔔 Send ADMIN NOTIFICATION for new order (non-blocking)
    try {
      console.log('[Unified Orders API] 📢 Sending admin notification for new order...');
      const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      await fetch(`${baseUrl}/api/notifications/admin-order-placed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: newOrder.orderNumber,
          orderId: newOrder._id,
          buyerName: `${newOrder.firstName} ${newOrder.lastName}`,
          buyerEmail: newOrder.email,
          amount: newOrder.total || 0,
          orderType: orderType,
        }),
      }).catch(err => {
        console.error('[Unified Orders API] ⚠️ Failed to send admin notification:', err);
        // Non-blocking - don't fail the order creation
      });
    } catch (notifError) {
      console.error('[Unified Orders API] ⚠️ Admin notification error (non-blocking):', notifError);
    }

    return NextResponse.json(
      {
        success: true,
        order: newOrder,
        orderNumber: newOrder.orderNumber,
        orderId: newOrder._id,
        invoice: invoiceData || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] POST /orders/unified failed:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Background task: Upload custom order design images to Cloudinary
 * Updates the unified order with designUrls after successful upload
 */
async function uploadCustomOrderImagesInBackground(
  orderId: string,
  designImages: File[],
  orderNumber: string
) {
  try {
    console.log(`[Background:${orderNumber}] 📸 Starting image upload for ${designImages.length} images...`);

    // Validate cloudinary is configured
    if (!cloudinary || !cloudinary.uploader) {
      console.warn(`[Background:${orderNumber}] ⚠️ Cloudinary not configured, skipping image uploads`);
      return;
    }

    const designUrls: (string | undefined)[] = new Array(designImages.length).fill(undefined);

    // Upload all images to Cloudinary in parallel
    const uploadPromises = designImages.map((file, i) =>
      (async () => {
        try {
          console.log(`[Background:${orderNumber}] Uploading image ${i + 1}/${designImages.length}: ${file.name}`);
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const dataURL = `data:${file.type};base64,${base64}`;

          const uploadResult = await cloudinary.uploader.upload(dataURL, {
            folder: 'empi/custom-orders',
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          });

          const url = uploadResult.secure_url;
          console.log(`[Background:${orderNumber}] ✅ Image ${i + 1}/${designImages.length} uploaded:`, url);
          return { success: true, url, index: i };
        } catch (uploadError) {
          console.error(`[Background:${orderNumber}] ⚠️ Failed to upload image ${i + 1}:`, uploadError);
          return { success: false, index: i };
        }
      })()
    );

    // Wait for all uploads in parallel
    const uploadResults = await Promise.all(uploadPromises);

    // Process results and maintain order
    uploadResults.forEach((result) => {
      if (result.success && result.url) {
        designUrls[result.index] = result.url;
      }
    });

    // Filter out failed uploads
    const successfulUrls = designUrls.filter((url): url is string => url !== undefined);
    console.log(`[Background:${orderNumber}] ✅ Upload complete: ${successfulUrls.length}/${designImages.length} images`);

    // Update the order with the uploaded image URLs
    await connectDB();
    const updatedOrder = await UnifiedOrder.findByIdAndUpdate(
      orderId,
      { designUrls: successfulUrls },
      { new: true }
    );

    console.log(`[Background:${orderNumber}] ✅ Order updated with design URLs:`, {
      orderId,
      designUrlCount: successfulUrls.length,
    });

    return updatedOrder;
  } catch (error) {
    console.error(`[Background:${orderNumber}] ❌ Error uploading images:`, error);
    throw error;
  }
}
