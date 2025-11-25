import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CustomOrder from "@/lib/models/CustomOrder";
import { v2 as cloudinary } from "cloudinary";

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
    const costumeType = formData.get("costumeType") as string;
    const description = formData.get("description") as string;
    const budget = formData.get("budget") as string;
    const deliveryDate = formData.get("deliveryDate") as string;
    const file = formData.get("file") as File | null;

    // Validate required fields
    if (!fullName || !email || !phone || !city || !costumeType || !description) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    let designUrl: string | null = null;

    // Upload file to Cloudinary if provided
    if (file) {
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

        designUrl = uploadResult.secure_url;
        console.log("✅ Design uploaded to Cloudinary:", designUrl);
      } catch (uploadError) {
        console.error("⚠️ Failed to upload design to Cloudinary:", uploadError);
        // Continue even if upload fails - we'll still create the order without the image
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
      costumeType,
      description,
      designUrl,
      budget: budget ? parseFloat(budget.split("-")[0]) : undefined,
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
    await connectDB();

    // TODO: Add admin authentication check
    
    const status = request.nextUrl.searchParams.get("status");

    const whereClause = status ? { status } : {};

    const orders = await CustomOrder.find(whereClause).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching custom orders:", error);

    return NextResponse.json(
      { message: "Failed to fetch custom orders" },
      { status: 500 }
    );
  }
}
