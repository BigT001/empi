import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Invoice from "@/lib/models/Invoice";
import { serializeDoc, serializeDocs } from "@/lib/serializer";

// Save invoice with items
export async function POST(request: NextRequest) {
  try {
    console.log("🔷 Invoice POST endpoint called");
    await connectDB();
    const body = await request.json();
    console.log("📥 Invoice request body:", body);
    
    const {
      invoiceNumber,
      orderNumber,
      buyerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerPostalCode,
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount,
      items,
      dueDate,
      currency,
      currencySymbol,
      taxRate,
      type = 'automatic',
      status = 'sent',
    } = body;

    console.log("📋 Extracted fields:", {invoiceNumber, customerName, customerEmail, customerPhone});

    if (
      !invoiceNumber ||
      !customerName ||
      !customerEmail ||
      !customerPhone
    ) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        {
          error:
            "invoiceNumber, customerName, customerEmail, and customerPhone are required",
        },
        { status: 400 }
      );
    }

    // Check if invoice already exists
    let existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      return NextResponse.json(
        { 
          success: true, 
          message: "Invoice already exists", 
          invoiceNumber,
          invoice: serializeDoc(existingInvoice)
        }, 
        { status: 200 }
      );
    }

    // Create new invoice
    const invoice = new Invoice({
      invoiceNumber,
      orderNumber: orderNumber || invoiceNumber,  // Use invoice number as order number
      buyerId: buyerId || null,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress: customerAddress || null,
      customerCity: customerCity || null,
      customerState: customerState || null,
      customerPostalCode: customerPostalCode || null,
      subtotal: subtotal || 0,
      shippingCost: shippingCost || 0,
      taxAmount: taxAmount || 0,
      totalAmount: totalAmount || 0,
      items: items || [],
      invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      currency: currency || 'NGN',
      currencySymbol: currencySymbol || '₦',
      taxRate: taxRate || 7.5,
      type,
      status,
    });

    await invoice.save();
    console.log(`✅ Invoice saved: ${invoiceNumber} (${type}) for buyer: ${buyerId || "guest"}`);

    return NextResponse.json(
      { 
        success: true, 
        message: "Invoice saved successfully", 
        invoiceNumber,
        invoice: serializeDoc(invoice)
      }, 
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("❌ Error in invoice endpoint:", {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    return NextResponse.json(
      { 
        error: "Failed to process invoice",
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

// Get invoices for a buyer or all invoices
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const buyerId = request.nextUrl.searchParams.get("buyerId");
    const type = request.nextUrl.searchParams.get("type"); // 'automatic', 'manual', or all
    const status = request.nextUrl.searchParams.get("status");

    const query: any = {};

    if (buyerId) {
      query.buyerId = buyerId;
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    return NextResponse.json(serializeDocs(invoices), { status: 200 });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
