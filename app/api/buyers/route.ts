import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Buyer from "@/lib/models/Buyer";
import { serializeDoc } from "@/lib/serializer";
import crypto from "crypto";

// Get admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').filter(e => e.trim());

/**
 * POST /api/buyers
 * Register a new buyer account
 * 🔒 Returns minimal info - full profile fetched via /api/auth/me
 */
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
/**
 * PUT /api/buyers
 * Login endpoint - validates credentials and sets HTTP-only session cookie
 * 🔒 Returns only confirmation - full profile fetched via /api/auth/me
 * Client should call /api/auth/me after successful login
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, phone, password } = body;

    console.log("🔐 Login attempt - body:", { email: email ? "provided" : "missing", phone: phone ? "provided" : "missing", password: password ? "provided" : "missing" });

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

    console.log("🔍 Searching for buyer with filters:", orFilters);

    const buyer = await Buyer.findOne({
      $or: orFilters,
    });

    if (!buyer) {
      console.log("❌ Buyer not found for:", { email, phone });
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    console.log("✅ Buyer found:", buyer.email);

    // Compare passwords
    const isPasswordValid = await buyer.comparePassword(password);

    if (!isPasswordValid) {
      console.log("❌ Password mismatch for buyer:", buyer.email);
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    console.log("✅ Password valid for buyer:", buyer.email);

    // Check if email is admin email (in case it wasn't set during registration)
    const isAdmin = ADMIN_EMAILS.includes(buyer.email.toLowerCase().trim());
    if (isAdmin && !buyer.isAdmin) {
      buyer.isAdmin = true;
      await buyer.save();
    }

    // 🔒 Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Update last login and set session
    buyer.lastLogin = new Date();
    buyer.sessionToken = sessionToken;
    buyer.sessionExpiry = sessionExpiry;
    await buyer.save();

    console.log(`✅ Buyer logged in: ${email || phone}${buyer.isAdmin ? ' (ADMIN)' : ''}`);
    console.log(`✅ Session token created for buyer: ${buyer.email}`);

    // Return buyer without password - properly serialized
    const buyerData = serializeDoc(buyer);
    delete (buyerData as any).password;

    // 🔒 Set HTTP-only session cookie (secure, can't be accessed by JS)
    const response = NextResponse.json(buyerData, { status: 200 });
    response.cookies.set('empi_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/',
    });

    console.log(`✅ Session cookie set for buyer: ${buyer.email}`);

    return response;
  } catch (error: any) {
    console.error("Error logging in buyer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/buyers
 * Update buyer profile information
 * 🔒 Requires valid session cookie
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { buyerId, updates } = body;

    if (!buyerId) {
      return NextResponse.json(
        { error: "buyerId is required" },
        { status: 400 }
      );
    }

    // Find and update buyer
    const buyer = await Buyer.findById(buyerId);
    
    if (!buyer) {
      return NextResponse.json(
        { error: "Buyer not found" },
        { status: 404 }
      );
    }

    // Update allowed fields only
    const allowedFields = ['fullName', 'phone', 'address', 'city', 'state', 'postalCode'];
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        (buyer as any)[key] = updates[key];
      }
    });

    await buyer.save();

    const buyerData = serializeDoc(buyer);
    delete (buyerData as any).password;

    console.log(`✅ Profile updated for buyer: ${buyer.email}`);

    return NextResponse.json(buyerData, { status: 200 });
  } catch (error: any) {
    console.error("Error updating buyer profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
