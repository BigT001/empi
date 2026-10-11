import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Invoice from "@/lib/models/Invoice";
import { serializeDoc } from "@/lib/serializer";
import { recordInvoiceAsOrder, syncOrderFromInvoice } from "@/lib/invoiceOrders";

// Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeDoc(invoice), { status: 200 });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Invoice updated: ${updatedInvoice.invoiceNumber}`);

    // Keep the order recorded from this manual invoice in step (creates it if it was never recorded)
    if (updatedInvoice.type === 'manual') {
      try {
        const inv = updatedInvoice.toObject();
        const recorded = await recordInvoiceAsOrder(inv);
        if (recorded.status === 'exists') await syncOrderFromInvoice(inv);
      } catch (orderError) {
        console.error('⚠️ Could not sync order for manual invoice:', orderError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Invoice updated successfully",
        invoice: serializeDoc(updatedInvoice),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const invoice = await Invoice.findByIdAndDelete(id);

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Invoice deleted: ${invoice.invoiceNumber}`);

    return NextResponse.json(
      {
        success: true,
        message: "Invoice deleted successfully",
        invoiceNumber: invoice.invoiceNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
