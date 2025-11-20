import { NextRequest, NextResponse } from "next/server";

// In-memory store for buyers
const buyersStore: Map<string, any> = new Map();

// Register a new buyer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, phone, address, city, state, postalCode } = body;

    if (!email || !fullName || !phone) {
      return NextResponse.json(
        { error: "Email, fullName, and phone are required" },
        { status: 400 }
      );
    }

    // Check if buyer already exists
    if (buyersStore.has(email)) {
      const existingBuyer = buyersStore.get(email);
      return NextResponse.json(
        { error: "Buyer already exists", buyer: existingBuyer },
        { status: 200 }
      );
    }

    // Create new buyer
    const buyer = {
      id: `BUYER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      email,
      fullName,
      phone,
      address: address || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    buyersStore.set(email, buyer);
    console.log(`✅ Buyer registered: ${email}`);

    return NextResponse.json(buyer, { status: 201 });
  } catch (error) {
    console.error("Error registering buyer:", error);
    return NextResponse.json(
      { error: "Failed to register buyer" },
      { status: 500 }
    );
  }
}

// Get buyer by email (login) and update lastLogin
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find buyer
    const buyer = buyersStore.get(email);

    if (!buyer) {
      return NextResponse.json(
        { error: "Buyer not found" },
        { status: 404 }
      );
    }

    // Update last login
    buyer.lastLogin = new Date().toISOString();
    buyersStore.set(email, buyer);

    console.log(`✅ Buyer login updated: ${email}`);

    return NextResponse.json(buyer, { status: 200 });
  } catch (error) {
    console.error("Error fetching buyer:", error);
    return NextResponse.json(
      { error: "Buyer not found" },
      { status: 404 }
    );
  }
}
