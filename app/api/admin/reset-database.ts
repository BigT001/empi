import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Buyer from "@/lib/models/Buyer";
import Invoice from "@/lib/models/Invoice";

export async function POST(request: NextRequest) {
  try {
    // Security: Check for admin auth token or secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.ADMIN_RESET_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing admin secret" },
        { status: 401 }
      );
    }

    await connectDB();

    // Delete all buyers
    const buyersDeleted = await Buyer.deleteMany({});
    console.log(`Deleted ${buyersDeleted.deletedCount} buyers`);

    // Delete all invoices (transaction histories)
    const invoicesDeleted = await Invoice.deleteMany({});
    console.log(`Deleted ${invoicesDeleted.deletedCount} invoices`);

    return NextResponse.json({
      success: true,
      message: "Database reset complete",
      deletedCounts: {
        buyers: buyersDeleted.deletedCount,
        invoices: invoicesDeleted.deletedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset database", details: String(error) },
      { status: 500 }
    );
  }
}
