import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Buyer from "@/lib/models/Buyer";
import CustomOrder from "@/lib/models/CustomOrder";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { fullName, email, phone, password, customOrderNumber, address, city, state, postalCode } = await request.json();

    // Validation
    if (!fullName || !email || !phone || !password || !customOrderNumber) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if buyer already exists
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return NextResponse.json(
        { message: "Email already registered. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create session token and expiry
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionExpiry = new Date(Date.now() + SESSION_EXPIRY);

    // Create new buyer account with session
    const newBuyer = new Buyer({
      fullName,
      email,
      phone,
      address: address || "",
      city: city || "",
      state: state || "",
      postalCode: postalCode || "",
      password: hashedPassword,
      isVerified: false, // Email verification pending
      sessionToken,
      sessionExpiry,
      lastLogin: new Date(),
      createdAt: new Date(),
    });

    await newBuyer.save();
    console.log(`✅ New buyer created from custom order: ${email}`);

    // Update custom order with buyerId
    const customOrder = await CustomOrder.findOne({ orderNumber: customOrderNumber });
    if (customOrder) {
      customOrder.buyerId = newBuyer._id.toString();
      await customOrder.save();
      console.log(`✅ Custom order ${customOrderNumber} linked to buyer ${newBuyer._id}`);
    } else {
      console.warn(`⚠️ Custom order ${customOrderNumber} not found for linking`);
    }

    // TODO: Send verification email to buyer

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully! Logging you in...",
        buyer: {
          id: newBuyer._id,
          email: newBuyer.email,
          fullName: newBuyer.fullName,
          phone: newBuyer.phone,
          address: newBuyer.address,
          city: newBuyer.city,
          state: newBuyer.state,
          postalCode: newBuyer.postalCode,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only, secure cookie with session token
    response.cookies.set({
      name: 'empi_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000, // Convert to seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("❌ Error creating account from custom order:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
