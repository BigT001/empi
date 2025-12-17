import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CustomOrder from "@/lib/models/CustomOrder";
import { sendOrderDeclinedEmail, sendOrderDeletedEmail } from "@/lib/email";

/**
 * GET /api/custom-orders/:id
 * Fetch a custom order by ID (for checkout quote display)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    let id: string;
    try {
      const resolvedParams = await params;
      id = resolvedParams.id;
    } catch (paramError) {
      console.error('[API:GET /custom-orders/:id] ❌ Error resolving params:', paramError);
      return NextResponse.json(
        { message: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    console.log(`[API:GET /custom-orders/:id] 📖 Fetching order ${id}`);

    // Validate that id is a valid MongoDB ObjectId
    if (!id || id.length !== 24) {
      console.log(`[API:GET /custom-orders/:id] ❌ Invalid order ID format: ${id}`);
      return NextResponse.json(
        { message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Fetch the order
    const order = await CustomOrder.findById(id).lean();

    if (!order) {
      console.log(`[API:GET /custom-orders/:id] ❌ Order not found: ${id}`);
      return NextResponse.json(
        { message: "Custom order not found" },
        { status: 404 }
      );
    }

    console.log(`[API:GET /custom-orders/:id] ✅ Order fetched successfully:`, {
      _id: (order as any)._id,
      orderNumber: (order as any).orderNumber,
      status: (order as any).status,
    });

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching custom order:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch custom order";

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/custom-orders/:id
 * Updates a custom order (e.g., status change to "rejected")
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    let id: string;
    try {
      const resolvedParams = await params;
      id = resolvedParams.id;
    } catch (paramError) {
      console.error('[API:PATCH /custom-orders/:id] ❌ Error resolving params:', paramError);
      return NextResponse.json(
        { message: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const body = await request.json();

    console.log(`[API:PATCH /custom-orders/:id] 📝 Updating order ${id} with:`, body);

    // Validate that id is a valid MongoDB ObjectId
    if (!id || id.length !== 24) {
      console.log(`[API:PATCH /custom-orders/:id] ❌ Invalid order ID format: ${id}`);
      return NextResponse.json(
        { message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Only allow specific fields to be updated
    const allowedUpdates = ["status", "paymentReference", "buyerAgreedToDate", "deliveryDate"];
    const updates: Record<string, any> = {};

    for (const key of Object.keys(body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ["pending", "quoted", "accepted", "approved", "in-progress", "rejected", "completed"];
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
      { new: true } // Return updated document
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
        // Don't block the API response if email fails
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
 * DELETE /api/custom-orders/:id
 * Permanently deletes a custom order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    console.log(`[API:DELETE /custom-orders/:id] 🗑️ Deleting order ${id}`);

    // Validate that id is a valid MongoDB ObjectId
    if (!id || id.length !== 24) {
      console.log(`[API:DELETE] ❌ Invalid order ID format: ${id}`);
      return NextResponse.json(
        { message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Delete the order
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
      // Don't block the API response if email fails
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
