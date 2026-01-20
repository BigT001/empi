import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Buyer from "@/lib/models/Buyer";
import { serializeDoc } from "@/lib/serializer";

/**
 * GET /api/buyers/[id]
 * Fetch buyer details by ID or email
 * Query params: ?type=email (default: id)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const queryType = request.nextUrl.searchParams.get('type') || 'id'; // 'id' or 'email'

    if (!id) {
      return NextResponse.json(
        { error: "Buyer ID or email is required" },
        { status: 400 }
      );
    }

    let buyer;

    if (queryType === 'email') {
      // Search by email
      buyer = await Buyer.findOne({ email: id.toLowerCase() });
    } else {
      // Search by ID (default)
      buyer = await Buyer.findById(id);
    }

    if (!buyer) {
      return NextResponse.json(
        { error: "Buyer not found" },
        { status: 404 }
      );
    }

    // Serialize and remove password
    const buyerData = serializeDoc(buyer);
    delete (buyerData as any).password;

    return NextResponse.json(buyerData, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching buyer details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch buyer details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/buyers/[id]
 * Update buyer profile information
 * Allows updating: fullName, phone, address, city, state, postalCode
 * Especially useful for populating missing profile fields from custom order forms
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { fullName, phone, address, city, state, postalCode } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Buyer ID is required" },
        { status: 400 }
      );
    }

    // Find buyer
    const buyer = await Buyer.findById(id);
    if (!buyer) {
      return NextResponse.json(
        { error: "Buyer not found" },
        { status: 404 }
      );
    }

    // Update only provided fields (preserves existing data)
    if (fullName !== undefined) buyer.fullName = fullName;
    if (phone !== undefined) buyer.phone = phone;
    if (address !== undefined) buyer.address = address;
    if (city !== undefined) buyer.city = city;
    if (state !== undefined) buyer.state = state;
    if (postalCode !== undefined) buyer.postalCode = postalCode;

    await buyer.save();

    console.log(`✅ Buyer profile updated: ${buyer.email}`);

    // Serialize and remove password
    const buyerData = serializeDoc(buyer);
    delete (buyerData as any).password;

    return NextResponse.json(buyerData, { status: 200 });
  } catch (error: any) {
    console.error("Error updating buyer profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update buyer profile" },
      { status: 500 }
    );
  }
}
