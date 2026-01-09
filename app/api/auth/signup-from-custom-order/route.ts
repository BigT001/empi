import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Buyer from "@/lib/models/Buyer";
import CustomOrder from "@/lib/models/CustomOrder";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { fullName, email, phone, password, customOrderNumber, address, city, state, postalCode } = body;

    // Validate required fields
    if (!fullName || !email || !password || !customOrderNumber) {
      return NextResponse.json(
        { message: "Full name, email, password, and order number are required" },
        { status: 400 }
      );
    }

    // Check if buyer already exists (not User model)
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + SESSION_EXPIRY);

    // Create new buyer (not User model)
    const newBuyer = new Buyer({
      fullName,
      email,
      phone: phone || "",
      address: address || "",
      city: city || "",
      state: state || "",
      postalCode: postalCode || "",
      password: hashedPassword,
      isVerified: false,
      lastLogin: new Date(),
      sessionToken,
      sessionExpiry,
      createdAt: new Date(),
    });

    await newBuyer.save();

    // Update custom order with buyerId
    await CustomOrder.updateOne(
      { orderNumber: customOrderNumber },
      { buyerId: newBuyer._id, email: email }
    );

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

    // Set HTTP-only session cookie
    response.cookies.set({
      name: 'empi_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Signup from custom order error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Signup failed" },
      { status: 500 }
    );
  }
}
