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
      console.error("📋 Received fields:", {invoiceNumber, customerName, customerEmail, customerPhone});
      return NextResponse.json(
        {
          error:
            "invoiceNumber, customerName, customerEmail, and customerPhone are required",
          received: {invoiceNumber, customerName, customerEmail, customerPhone}
        },
        { status: 400 }
      );
    }

    // Check if invoice already exists
    let existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      console.log("⚠️ Invoice already exists:", invoiceNumber);
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
    console.log("🔨 Creating new invoice with data:", {
      invoiceNumber,
      orderNumber: orderNumber || invoiceNumber,
      buyerId: buyerId || null,
      customerName,
      customerEmail,
      customerPhone,
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount
    });

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

    console.log("💾 Saving invoice to database...", {
      invoiceNumber,
      customerName,
      customerEmail,
      totalAmount
    });
    
    await invoice.save();
    const savedInvoice = await Invoice.findOne({ invoiceNumber });
    console.log(`✅ Invoice saved: ${invoiceNumber} (${type}) for buyer: ${buyerId || "guest"}`);
    console.log(`📋 Verified saved invoice:`, {
      _id: savedInvoice?._id,
      invoiceNumber: savedInvoice?.invoiceNumber,
      customerEmail: savedInvoice?.customerEmail,
      totalAmount: savedInvoice?.totalAmount,
    });

    const serialized = serializeDoc(savedInvoice || invoice);
    console.log(`🔄 Serialized invoice:`, serialized);

    return NextResponse.json(
      { 
        success: true, 
        message: "Invoice saved successfully", 
        invoiceNumber,
        invoice: serialized
      }, 
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("❌ CRITICAL Error in invoice endpoint:", {
      message: errorMessage,
      stack: errorStack,
      fullError: error
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
    console.log("🔍 GET /api/invoices called with query:", Object.fromEntries(request.nextUrl.searchParams));
    await connectDB();
    const buyerId = request.nextUrl.searchParams.get("buyerId");
    const email = request.nextUrl.searchParams.get("email");
    const type = request.nextUrl.searchParams.get("type"); // 'automatic', 'manual', or all
    const status = request.nextUrl.searchParams.get("status");

    const query: any = {};

    if (buyerId) {
      query.buyerId = buyerId;
      console.log(`🔎 Searching by buyerId: ${buyerId}`);
    } else if (email) {
      // For guest users, search by email
      query.customerEmail = email.toLowerCase();
      console.log(`🔎 Searching by email: ${email.toLowerCase()}`);
    } else {
      console.log(`🔎 Fetching all invoices`);
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    console.log(`📋 Query object:`, query);

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    console.log(`📋 Found ${invoices.length} invoices with query:`, query);
    
    if (invoices.length > 0) {
      console.log(`📄 First invoice:`, {
        invoiceNumber: invoices[0].invoiceNumber,
        customerEmail: invoices[0].customerEmail,
        totalAmount: invoices[0].totalAmount,
      });
    }

    const serialized = serializeDocs(invoices);
    console.log(`✅ Returning ${serialized.length} serialized invoices`);
    
    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// DELETE - Delete all invoices
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Delete all invoices
    const result = await Invoice.deleteMany({});

    console.log(`✅ Deleted ${result.deletedCount} invoices`);

    return NextResponse.json(
      { 
        message: `Successfully deleted ${result.deletedCount} invoices`,
        deletedCount: result.deletedCount 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting invoices:", error);
    return NextResponse.json(
      { error: "Failed to delete invoices" },
      { status: 500 }
    );
  }
}
