import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Buyer from "@/lib/models/Buyer";
import { serializeDoc } from "@/lib/serializer";

// Get admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').filter(e => e.trim());

// Register a new buyer with password
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, phone, password, fullName, address, city, state, postalCode } = body;

    // Validation
    if (!email || !phone || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, phone, password, and fullName are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if buyer already exists
    const existingBuyer = await Buyer.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone }] 
    });

    if (existingBuyer) {
      return NextResponse.json(
        { error: "Email or phone already registered. Please login instead." },
        { status: 409 }
      );
    }

    // Check if email is admin email
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());

    // Create new buyer
    const buyer = new Buyer({
      email: email.toLowerCase(),
      phone,
      password,
      fullName,
      address: address || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      isAdmin,
      lastLogin: new Date(),
    });

    await buyer.save();
    console.log(`✅ Buyer registered: ${email}${isAdmin ? ' (ADMIN)' : ''}`);

    // Return buyer without password - properly serialized
    const buyerData = serializeDoc(buyer);
    delete (buyerData as any).password;

    return NextResponse.json(buyerData, { status: 201 });
  } catch (error: any) {
    console.error("Error registering buyer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register buyer" },
      { status: 500 }
    );
  }
}

// Login with email/phone and password
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, phone, password } = body;

    // Validation
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    // Find buyer by email or phone
    const orFilters: any[] = [];
    if (email) orFilters.push({ email: email.toLowerCase() });
    if (phone) orFilters.push({ phone });

    if (orFilters.length === 0) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    const buyer = await Buyer.findOne({
      $or: orFilters,
    });

    if (!buyer) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordValid = await buyer.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    // Check if email is admin email (in case it wasn't set during registration)
    const isAdmin = ADMIN_EMAILS.includes(buyer.email.toLowerCase().trim());
    if (isAdmin && !buyer.isAdmin) {
      buyer.isAdmin = true;
      await buyer.save();
    }

    // Update last login
    buyer.lastLogin = new Date();
    await buyer.save();

    console.log(`✅ Buyer logged in: ${email || phone}${buyer.isAdmin ? ' (ADMIN)' : ''}`);

    // Return buyer without password - properly serialized
    const buyerData = serializeDoc(buyer);
    delete (buyerData as any).password;

    return NextResponse.json(buyerData, { status: 200 });
  } catch (error: any) {
    console.error("Error logging in buyer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 500 }
    );
  }
}
