import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Invoice from "@/lib/models/Invoice";
import { generateProfessionalInvoiceHTML } from "@/lib/professionalInvoice";

/**
 * GET /api/invoices/[id]/download
 * Generate and return invoice as HTML (for download or viewing)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    console.log("[Invoice Download] Fetching invoice:", id);

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      console.error("[Invoice Download] Invoice not found:", id);
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    console.log("[Invoice Download] Invoice found:", invoice.invoiceNumber);

    // Format invoice data for HTML generation
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
      dueDate: invoice.dueDate?.toISOString().split("T")[0] || "",
      orderNumber: invoice.orderNumber,

      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone || "",
      customerAddress: invoice.customerAddress || "",
      customerCity: invoice.customerCity || "",
      customerState: invoice.customerState || "",
      customerPostalCode: invoice.customerPostalCode || "",

      items: invoice.items.map((item: any) => ({
        id: item.id || "",
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        mode: item.mode || "buy",
      })),

      subtotal: invoice.subtotal,
      shippingCost: invoice.shippingCost || 0,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,

      currency: invoice.currency || "NGN",
      currencySymbol: invoice.currencySymbol || "₦",
      taxRate: invoice.taxRate || 7.5,

      type: invoice.type || "automatic",
      status: invoice.status || "sent",

      // Company info
      companyName: "Empi Costumes",
      companyEmail: "support@empi.com",
      companyPhone: "+234 800 000 0000",
      companyAddress: "22 Ejire Street, Surulere",
      companyCity: "Lagos",
      companyCountry: "Nigeria",
    };

    // Generate HTML
    const html = generateProfessionalInvoiceHTML(invoiceData);

    // Return as HTML response
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("[Invoice Download] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
