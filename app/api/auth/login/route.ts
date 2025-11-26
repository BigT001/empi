import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';
import crypto from 'crypto';

// Session store in MongoDB
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find buyer by email
    const buyer = await Buyer.findOne({ email: email.toLowerCase() });
    
    if (!buyer) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare password
    const isValidPassword = await buyer.comparePassword(password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + SESSION_EXPIRY);

    // Store session in buyer document
    buyer.lastLogin = new Date();
    buyer.sessionToken = sessionToken;
    buyer.sessionExpiry = sessionExpiry;
    await buyer.save();

    console.log(`✅ Session created for buyer: ${buyer.email}`);

    // Create response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      buyer: {
        id: buyer._id,
        email: buyer.email,
        fullName: buyer.fullName,
        phone: buyer.phone,
        address: buyer.address,
        city: buyer.city,
        state: buyer.state,
        postalCode: buyer.postalCode,
      }
    }, { status: 200 });

    // Set HTTP-only, secure cookie
    response.cookies.set({
      name: 'empi_session',
      value: sessionToken,
      httpOnly: true, // Can't be accessed by JavaScript
      secure: process.env.NODE_ENV === 'production', // Only over HTTPS in production
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000, // Convert to seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
