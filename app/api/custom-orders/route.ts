import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CustomOrder from "@/lib/models/CustomOrder";
import Order from "@/lib/models/Order";
import Invoice from "@/lib/models/Invoice";
import { v2 as cloudinary } from "cloudinary";
import { sendOrderDeclinedEmail, sendOrderDeletedEmail } from "@/lib/email";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/custom-orders
 * Creates a new custom costume order request
 * Accepts multipart form data with optional image file
 * 
 * OPTIMIZED: Returns immediately after saving order to DB
 * Images are uploaded to Cloudinary asynchronously in the background
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();

    // Extract form fields
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const description = formData.get("description") as string;
    const quantity = formData.get("quantity") as string;
    const deliveryDate = formData.get("deliveryDate") as string;
    const buyerId = formData.get("buyerId") as string | null;
    
    console.log("[API:POST /custom-orders] 📝 New custom order submission received");
    console.log("[API:POST /custom-orders] Email from form:", email);
    console.log("[API:POST /custom-orders] BuyerId from form:", buyerId || "(not provided)");

    // Get all design images
    const designImages = formData.getAll("designImages") as File[];

    // Validate required fields
    const missingFields: string[] = [];
    if (!fullName) missingFields.push("fullName");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("phone");
    if (!city) missingFields.push("city");
    if (!description) missingFields.push("description");

    if (missingFields.length > 0) {
      console.error("[API:POST /custom-orders] ❌ Missing fields:", missingFields);
      return NextResponse.json(
        { message: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate that at least one design image is provided
    if (designImages.length === 0) {
      return NextResponse.json(
        { message: "At least one design image is required" },
        { status: 400 }
      );
    }

    // Validate max 5 images
    if (designImages.length > 5) {
      return NextResponse.json(
        { message: "Maximum 5 design images allowed" },
        { status: 400 }
      );
    }

    // Generate unique order number using buyer's first name and short code
    const firstName = fullName.split(' ')[0]; // Get first name
    const shortCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const orderNumber = `${firstName}-${shortCode}`;

    // Create custom order in database IMMEDIATELY with empty design URLs
    // This returns instantly to the user
    const orderData: any = {
      orderNumber,
      fullName,
      email: email.toLowerCase(), // Lowercase email for consistency with invoice queries
      phone,
      city,
      description,
      designUrl: null, // Will be filled in by background task
      designUrls: [], // Will be filled in by background task
      quantity: parseInt(quantity) || 1,
      status: "pending",
    };

    // Add optional fields
    if (address) orderData.address = address;
    if (state) orderData.state = state;
    if (deliveryDate) orderData.deliveryDate = new Date(deliveryDate);
    if (buyerId) {
      orderData.buyerId = buyerId;
      console.log("[API:POST /custom-orders] ✅ Adding buyerId to database:", buyerId);
    }

    const customOrder = await CustomOrder.create(orderData);

    console.log("✅ Custom order created immediately:", customOrder._id);
    console.log("📋 Order Number:", customOrder.orderNumber);

    // 🚀 FAST RETURN: Send success response to user immediately
    // User sees confirmation without waiting for image uploads
    const response = NextResponse.json(
      {
        success: true,
        orderNumber: customOrder.orderNumber,
        orderId: customOrder._id,
        message: "Your custom costume order has been submitted successfully! Images are being processed.",
      },
      { status: 201 }
    );

    // 📸 BACKGROUND TASK: Upload images asynchronously without blocking the response
    // This happens in the background after the user gets their confirmation
    if (designImages.length > 0) {
      uploadImagesInBackground(customOrder._id, designImages, orderNumber).catch((err) => {
        console.error(`[Background] Failed to upload images for order ${orderNumber}:`, err);
      });
    }

    return response;
  } catch (error) {
    console.error("❌ Error creating custom order:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to create custom order";

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Background task to upload images to Cloudinary and update order
 * Runs asynchronously without blocking the API response
 */
async function uploadImagesInBackground(
  orderId: string,
  designImages: File[],
  orderNumber: string
) {
  try {
    console.log(`[Background:${orderNumber}] 📸 Starting async image upload for ${designImages.length} images...`);

    const designUrls: (string | undefined)[] = new Array(designImages.length).fill(undefined);
    let designUrl: string | null = null;

    // Upload all files to Cloudinary in parallel
    const uploadPromises = designImages.map((file, i) =>
      (async () => {
        try {
          console.log(`[Background:${orderNumber}] Uploading image ${i + 1}/${designImages.length}: ${file.name}`);
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const dataURL = `data:${file.type};base64,${base64}`;

          const uploadResult = await cloudinary.uploader.upload(dataURL, {
            folder: "empi/custom-orders",
            resource_type: "auto",
            quality: "auto",
            fetch_format: "auto",
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
        if (result.index === 0) {
          designUrl = result.url;
        }
      }
    });

    // Filter out failed uploads (undefined values)
    const successfulUrls = designUrls.filter((url): url is string => url !== undefined);
    console.log(`[Background:${orderNumber}] ✅ Upload complete: ${successfulUrls.length}/${designImages.length} images`);

    // Update the order with the uploaded image URLs
    await connectDB();
    const customOrder = await CustomOrder.findByIdAndUpdate(
      orderId,
      {
        designUrl,
        designUrls: successfulUrls,
      },
      { new: true }
    );

    console.log(`[Background:${orderNumber}] ✅ Order updated with design URLs`);
    console.log(`[Background:${orderNumber}] 📸 Final designUrls: ${successfulUrls.length} images`);
  } catch (error) {
    console.error(`[Background:${orderNumber}] ❌ Error in background upload task:`, error);
  }
}

/**
 * GET /api/custom-orders
 * Lists all custom orders AND regular orders (for unified admin panel)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[API:GET /custom-orders] 📋 Fetching orders...");
    await connectDB();
    console.log("[API:GET /custom-orders] ✅ Connected to database");

    const buyerId = request.nextUrl.searchParams.get("buyerId");
    const email = request.nextUrl.searchParams.get("email");
    const status = request.nextUrl.searchParams.get("status");

    console.log("[API:GET /custom-orders] 🔍 Query parameters received:", { buyerId, email, status });

    // If buyerId is provided, filter by that (user-specific orders)
    // If email is provided, use that as fallback
    // If no buyerId or email, only admin can fetch all orders
    const whereClause: any = {};
    
    if (buyerId) {
      whereClause.buyerId = buyerId;
      console.log("[API:GET /custom-orders] Filtering by buyerId:", buyerId);
    } else if (email) {
      whereClause.email = email;
      console.log("[API:GET /custom-orders] 📧 Filtering by email:", email);
    } else {
      console.log("[API:GET /custom-orders] ⚠️ No buyerId or email provided - returning all orders (admin access only)");
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    console.log("[API:GET /custom-orders] 🔎 MongoDB Query filter:", JSON.stringify(whereClause));

    // Fetch custom orders
    let customOrders = await CustomOrder.find(whereClause).sort({ createdAt: -1 });
    console.log("[API:GET /custom-orders] ✅ Found", customOrders.length, "custom orders");
    
    // Log details of fetched orders
    customOrders.forEach((order, idx) => {
      console.log(`[API:GET /custom-orders] Order ${idx + 1}:`);
      console.log(`  - orderNumber: ${order.orderNumber}`);
      console.log(`  - email: ${order.email}`);
      console.log(`  - designUrl: ${order.designUrl || "EMPTY"}`);
      console.log(`  - designUrls: ${order.designUrls?.length || 0} images`);
    });
    
    // Fetch regular orders with pending status (for unified display)
    let regularOrders = [];
    if (!buyerId && !email) {
      // Admin fetching all - include pending regular orders
      // Regular orders can have status 'pending' or 'awaiting_payment' in the pending tab
      let regularOrdersQuery: any = {};
      if (status === 'pending') {
        // For pending tab, fetch both 'pending' and 'awaiting_payment' statuses
        regularOrdersQuery = { $or: [{ status: 'pending' }, { status: 'awaiting_payment' }] };
      } else if (status) {
        regularOrdersQuery = { status: status };
      }
      regularOrders = await Order.find(regularOrdersQuery).sort({ createdAt: -1 });
      console.log("[API:GET /custom-orders] ✅ Found", regularOrders.length, "regular orders with query:", regularOrdersQuery);
    } else if (buyerId || email) {
      // User fetching their orders
      const orderWhereClause: any = {};
      if (buyerId) orderWhereClause.buyerId = buyerId;
      if (email) orderWhereClause.email = email;
      if (status) orderWhereClause.status = status;
      regularOrders = await Order.find(orderWhereClause).sort({ createdAt: -1 });
      console.log("[API:GET /custom-orders] ✅ Found", regularOrders.length, "regular orders for user");
    }
    
    // Attach payment verification status by checking invoices
    const ordersWithPaymentStatus = await Promise.all(
      customOrders.map(async (order) => {
        const orderObj = order.toObject();
        orderObj.isCustomOrder = true; // Mark as custom order
        console.log(`[API:GET /custom-orders] 🔍 Checking payment for order: ${order.orderNumber} (_id: ${order._id})`);
        try {
          // First, try to find the associated regular Order (for custom order payments)
          // Custom orders can have a linked regular Order with isCustomOrder: true and customOrderId pointing to this custom order
          let relatedOrder = await Order.findOne({
            customOrderId: order._id,
            isCustomOrder: true
          });
          
          if (relatedOrder) {
            console.log(`[API:GET /custom-orders]   Found related Order: ${relatedOrder.orderNumber}`);
            // Look for invoice using the related order's orderNumber
            const invoice = await Invoice.findOne({
              orderNumber: relatedOrder.orderNumber,
              paymentVerified: true
            });
            
            if (invoice) {
              orderObj.paymentVerified = true;
              orderObj.paymentReference = invoice.paymentReference;
              console.log(`[API:GET /custom-orders] ✅ Order ${order.orderNumber} has verified payment via related Order ${relatedOrder.orderNumber} - REF: ${invoice.paymentReference}`);
            } else {
              orderObj.paymentVerified = false;
              console.log(`[API:GET /custom-orders] ❌ Related Order ${relatedOrder.orderNumber} has NO verified invoice`);
            }
          } else {
            console.log(`[API:GET /custom-orders]   No related Order found, checking direct invoice match`);
            // Fallback: try direct match with custom order number
            const invoice = await Invoice.findOne({
              orderNumber: order.orderNumber,
              paymentVerified: true
            });
            
            if (invoice) {
              orderObj.paymentVerified = true;
              orderObj.paymentReference = invoice.paymentReference;
              console.log(`[API:GET /custom-orders] ✅ Order ${order.orderNumber} has verified payment - REF: ${invoice.paymentReference}`);
            } else {
              orderObj.paymentVerified = false;
              console.log(`[API:GET /custom-orders] ❌ Order ${order.orderNumber} has NO verified payment`);
            }
          }
        } catch (invoiceError) {
          console.error(`[API:GET /custom-orders] ⚠️ Error checking invoice for ${order.orderNumber}:`, invoiceError);
          orderObj.paymentVerified = false;
        }
        return orderObj;
      })
    );

    // Attach payment verification status to regular orders
    const regularOrdersWithPaymentStatus = await Promise.all(
      regularOrders.map(async (order) => {
        const orderObj = order.toObject();
        orderObj.isCustomOrder = false; // Mark as regular order
        console.log(`[API:GET /custom-orders] 🔍 Checking payment for regular order: ${order.orderNumber}`);
        try {
          const invoice = await Invoice.findOne({
            orderNumber: order.orderNumber,
            paymentVerified: true
          });
          
          if (invoice) {
            orderObj.paymentVerified = true;
            orderObj.paymentReference = invoice.paymentReference;
            console.log(`[API:GET /custom-orders] ✅ Regular order ${order.orderNumber} has verified payment`);
          } else {
            orderObj.paymentVerified = false;
            console.log(`[API:GET /custom-orders] ❌ Regular order ${order.orderNumber} has NO verified payment`);
          }
        } catch (invoiceError) {
          console.error(`[API:GET /custom-orders] ⚠️ Error checking invoice for regular order ${order.orderNumber}:`, invoiceError);
          orderObj.paymentVerified = false;
        }
        return orderObj;
      })
    );

    // Combine custom and regular orders
    const allOrders = [...ordersWithPaymentStatus, ...regularOrdersWithPaymentStatus].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ success: true, orders: allOrders }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching custom orders:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error details:", errorMsg);

    return NextResponse.json(
      { message: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/custom-orders?id=:id
 * Updates a custom order (e.g., status change to "rejected")
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const id = request.nextUrl.searchParams.get("id");
    const body = await request.json();

    console.log(`[API:PATCH /custom-orders] 📝 Updating order ${id} with:`, body);

    // Validate that id is a valid MongoDB ObjectId
    if (!id || id.length !== 24) {
      console.log(`[API:PATCH] ❌ Invalid order ID format: ${id}`);
      return NextResponse.json(
        { message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Determine if this is a custom order or regular order
    const isCustomOrderFlag = body.isCustomOrder ?? true; // Default to custom order for backward compatibility
    
    // Only allow specific fields to be updated
    const allowedUpdates = ["status", "quotedPrice", "buyerAgreedToDate", "deliveryDate", "quantity", "shippingType", "address", "busStop", "city", "state", "zipCode", "deliveryOption"];
    const updates: Record<string, any> = {};

    for (const key of Object.keys(body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    }

    // Log what's being updated
    if (updates.deliveryOption) {
      console.log(`[API:PATCH] 🚚 Delivery option being set to: ${updates.deliveryOption}`);
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ["pending", "approved", "in-progress", "ready", "completed", "rejected", "awaiting_payment", "payment_confirmed", "cancelled"];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          { message: "Invalid status value" },
          { status: 400 }
        );
      }
    }

    let updatedOrder;

    if (isCustomOrderFlag) {
      // Update custom order
      // If quantity is being updated, recalculate quotedPrice using unitPrice
      if (updates.quantity) {
        const currentOrder = await CustomOrder.findById(id);
        if (currentOrder) {
          const unitPrice = currentOrder.unitPrice || (currentOrder.quotedPrice / (currentOrder.quantity || 1));
          const newQuotedPrice = unitPrice * updates.quantity;
          updates.quotedPrice = newQuotedPrice;
          // Store unitPrice for future calculations if not already set
          if (!currentOrder.unitPrice) {
            updates.unitPrice = unitPrice;
          }
          console.log(`[API:PATCH] 🔢 Auto-calculated price: quantity ${currentOrder.quantity} → ${updates.quantity}, unitPrice ₦${unitPrice}, newQuotedPrice ₦${newQuotedPrice}`);
        }
      }

      updatedOrder = await CustomOrder.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );

      if (!updatedOrder) {
        return NextResponse.json(
          { message: "Custom order not found" },
          { status: 404 }
        );
      }

      console.log(`✅ Custom order ${id} updated:`, updates);
    } else {
      // Update regular order
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );

      if (!updatedOrder) {
        return NextResponse.json(
          { message: "Order not found" },
          { status: 404 }
        );
      }

      console.log(`✅ Regular order ${id} updated:`, updates);
    }

    // Create invoice when order is approved
    if (updates.status === "approved" && isCustomOrderFlag) {
      console.log(`[API:PATCH] 📄 Creating invoice for approved custom order ${updatedOrder.orderNumber}`);
      try {
        // Get quote items from the order
        const quoteItems = updatedOrder.quoteItems || [];
        const subtotal = quoteItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        const VAT_RATE = 0.075;
        const taxAmount = subtotal * VAT_RATE;
        const totalAmount = subtotal + taxAmount;

        // Map quote items to invoice items
        const items = quoteItems.map((item: any) => ({
          name: item.itemName,
          quantity: item.quantity,
          price: item.unitPrice,
          mode: 'buy',
        }));

        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const invoiceDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice
        const invoice = new Invoice({
          invoiceNumber,
          orderNumber: updatedOrder.orderNumber,
          customerName: updatedOrder.fullName,
          customerEmail: updatedOrder.email.toLowerCase(),
          customerPhone: updatedOrder.phone || '',
          customerAddress: updatedOrder.address || '',
          customerCity: updatedOrder.city || '',
          customerState: updatedOrder.state || '',
          customerPostalCode: '',
          subtotal,
          shippingCost: 0,
          taxAmount,
          totalAmount,
          items,
          invoiceDate,
          dueDate,
          currency: 'NGN',
          currencySymbol: '₦',
          taxRate: VAT_RATE * 100,
          type: 'automatic',
          status: 'sent',
          paymentVerified: true,
          paymentReference: updatedOrder.paymentReference || updatedOrder.orderNumber,
        });

        await invoice.save();
        console.log(`[API:PATCH] ✅ Invoice created for approved order: ${invoiceNumber}`);
        console.log(`[API:PATCH] 📋 Invoice saved with customerEmail: ${updatedOrder.email.toLowerCase()}`);
      } catch (invoiceError) {
        console.error("[API:PATCH] ⚠️ Failed to create invoice for approved order (non-blocking):", invoiceError);
      }
    }

    // Send email notification if order was rejected
    if (updates.status === "rejected") {
      console.log(`[API:PATCH] 📧 Sending rejection notification to ${updatedOrder.email}`);
      try {
        await sendOrderDeclinedEmail(
          updatedOrder.email,
          updatedOrder.fullName,
          updatedOrder.orderNumber
        );
      } catch (emailError) {
        console.error("[API:PATCH] ⚠️ Failed to send decline email (non-blocking):", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Custom order updated successfully",
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating custom order:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to update custom order";

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/custom-orders?id=:id
 * Permanently deletes a custom order
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const id = request.nextUrl.searchParams.get("id");

    console.log(`[API:DELETE /custom-orders] 🗑️ Deleting order ${id}`);

    if (!id) {
      console.log(`[API:DELETE] ❌ No order ID provided`);
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Try to find and delete by _id first
    let deletedOrder = await CustomOrder.findByIdAndDelete(id);

    if (!deletedOrder) {
      // Try to find by orderNumber if _id doesn't work
      console.log(`[API:DELETE] Order not found by _id, trying orderNumber...`);
      deletedOrder = await CustomOrder.findOneAndDelete({ orderNumber: id });
    }

    if (!deletedOrder) {
      console.log(`[API:DELETE] ❌ Custom order not found with id: ${id}`);
      return NextResponse.json(
        { message: "Custom order not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Custom order ${id} permanently deleted`);

    // Send email notification about deletion
    console.log(`[API:DELETE] 📧 Sending deletion notification to ${deletedOrder.email}`);
    try {
      await sendOrderDeletedEmail(
        deletedOrder.email,
        deletedOrder.fullName,
        deletedOrder.orderNumber
      );
    } catch (emailError) {
      console.error("[API:DELETE] ⚠️ Failed to send deletion email (non-blocking):", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Custom order deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting custom order:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete custom order";

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
