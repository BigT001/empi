import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Invoice from "@/lib/models/Invoice";
import { serializeDoc, serializeDocs } from "@/lib/serializer";

// Save invoice with items
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
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
      orderNumber,
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
      invoiceDate: new Date(),
    });

    await invoice.save();
    console.log(`✅ Invoice saved: ${invoiceNumber} for buyer: ${buyerId || "guest"}`);

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
    console.error("Error in invoice endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process invoice" },
      { status: 500 }
    );
  }
}

// Get invoices for a buyer
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const buyerId = request.nextUrl.searchParams.get("buyerId");

    if (!buyerId) {
      return NextResponse.json(
        { error: "buyerId is required" },
        { status: 400 }
      );
    }

    const invoices = await Invoice.find({ buyerId });
    return NextResponse.json(serializeDocs(invoices), { status: 200 });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
