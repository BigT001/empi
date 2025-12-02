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

    // Additional safety: Only allow in development or if explicitly enabled
    const isProduction = process.env.NODE_ENV === "production";
    const allowProductionReset = process.env.ALLOW_PRODUCTION_RESET === "true";
    
    if (isProduction && !allowProductionReset) {
      return NextResponse.json(
        { 
          error: "Database reset is disabled in production",
          hint: "Set ALLOW_PRODUCTION_RESET=true in environment to enable"
        },
        { status: 403 }
      );
    }

    // Parse request body to require confirmation token
    const body = await request.json().catch(() => ({}));
    const confirmationToken = body.confirmationToken;
    const expectedConfirmation = process.env.RESET_CONFIRMATION_TOKEN;

    if (!expectedConfirmation || confirmationToken !== expectedConfirmation) {
      return NextResponse.json(
        { 
          error: "Confirmation token required",
          hint: "Include confirmationToken in request body"
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Delete all buyers
    const buyersDeleted = await Buyer.deleteMany({});
    console.log(`[DATABASE RESET] Deleted ${buyersDeleted.deletedCount} buyers at ${new Date().toISOString()}`);

    // Delete all invoices (transaction histories)
    const invoicesDeleted = await Invoice.deleteMany({});
    console.log(`[DATABASE RESET] Deleted ${invoicesDeleted.deletedCount} invoices at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: "Database reset complete - All users and transaction histories deleted",
      deletedCounts: {
        buyers: buyersDeleted.deletedCount,
        invoices: invoicesDeleted.deletedCount,
      },
      timestamp: new Date().toISOString(),
      warning: "⚠️ This action deleted all user and transaction data and cannot be undone"
    });
  } catch (error) {
    console.error("[DATABASE RESET ERROR]", error);
    return NextResponse.json(
      { error: "Failed to reset database", details: String(error) },
      { status: 500 }
    );
  }
}
