import { NextRequest, NextResponse } from "next/server";

// Save invoice with items (fast endpoint - just acknowledge, client uses localStorage)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoiceNumber,
      orderNumber,
      buyerId,
      customerName,
      customerEmail,
      customerPhone,
      items,
    } = body;

    if (
      !invoiceNumber ||
      !orderNumber ||
      !customerName ||
      !customerEmail ||
      !customerPhone
    ) {
      return NextResponse.json(
        {
          error:
            "invoiceNumber, orderNumber, customerName, customerEmail, and customerPhone are required",
        },
        { status: 400 }
      );
    }

    // For now, just acknowledge the request
    // Client is using localStorage as primary storage via invoiceStorage.ts
    console.log(
      `✅ Invoice received: ${invoiceNumber} for buyer: ${buyerId || "guest"} (stored in localStorage)`
    );

    return NextResponse.json(
      { 
        success: true, 
        message: "Invoice acknowledged", 
        invoiceNumber 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in invoice endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process invoice" },
      { status: 500 }
    );
  }
}
