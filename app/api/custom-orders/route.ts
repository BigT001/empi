import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CustomOrder from "@/lib/models/CustomOrder";
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
    
    // Get all design images
    const designImages = formData.getAll("designImages") as File[];

    // Validate required fields
    if (!fullName || !email || !phone || !city || !description) {
      return NextResponse.json(
        { message: "Missing required fields" },
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

    const designUrls: string[] = [];
    let designUrl: string | null = null; // Keep first one for backward compatibility

    // Upload all files to Cloudinary
    for (let i = 0; i < designImages.length; i++) {
      const file = designImages[i];
      try {
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
        designUrls.push(url);
        
        // Keep first URL for backward compatibility
        if (i === 0) {
          designUrl = url;
        }
        
        console.log(`✅ Design image ${i + 1}/${designImages.length} uploaded to Cloudinary:`, url);
      } catch (uploadError) {
        console.error(`⚠️ Failed to upload design image ${i + 1} to Cloudinary:`, uploadError);
        // Continue uploading remaining images even if one fails
      }
    }

    // Generate unique order number
    const orderNumber = `CUSTOM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create custom order in database
    const customOrder = await CustomOrder.create({
      orderNumber,
      fullName,
      email,
      phone,
      address: address || undefined,
      city,
      state: state || undefined,
      description,
      designUrl,
      designUrls, // Store all design image URLs
      quantity: parseInt(quantity) || 1,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      status: "pending",
    });

    console.log("✅ Custom order created:", customOrder._id);

    // TODO: Send email notification to admin and customer
    // For now, just log it
    console.log(`📧 TODO: Send email to ${email} and admin about new custom order`);

    return NextResponse.json(
      {
        success: true,
        orderNumber: customOrder.orderNumber,
        message: "Your custom costume order has been submitted. We'll contact you within 24 hours.",
      },
      { status: 201 }
    );
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
 * GET /api/custom-orders
 * Lists all custom orders (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[API:GET /custom-orders] 📋 Fetching orders...");
    await connectDB();
    console.log("[API:GET /custom-orders] ✅ Connected to database");

    // TODO: Add admin authentication check
    
    const status = request.nextUrl.searchParams.get("status");

    const whereClause = status ? { status } : {};
    console.log("[API:GET /custom-orders] Query filter:", whereClause);

    const orders = await CustomOrder.find(whereClause).sort({ createdAt: -1 });
    console.log("[API:GET /custom-orders] ✅ Found orders:", orders.length);

    return NextResponse.json({ success: true, orders }, { status: 200 });
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

    // Only allow specific fields to be updated
    const allowedUpdates = ["status"];
    const updates: Record<string, any> = {};

    for (const key of Object.keys(body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ["pending", "quoted", "accepted", "rejected", "completed"];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          { message: "Invalid status value" },
          { status: 400 }
        );
      }
    }

    // Update the order
    const updatedOrder = await CustomOrder.findByIdAndUpdate(
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

    // Validate that id is a valid MongoDB ObjectId
    if (!id || id.length !== 24) {
      console.log(`[API:DELETE] ❌ Invalid order ID format: ${id}`);
      return NextResponse.json(
        { message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Get order before deleting (for email notification)
    const deletedOrder = await CustomOrder.findByIdAndDelete(id);

    if (!deletedOrder) {
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
