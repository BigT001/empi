import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';

/**
 * GET /api/auth/me
 * 🔒 SECURE ENDPOINT - Returns authenticated buyer profile
 * Validates HTTP-only session cookie and returns full profile from database
 * This is the single source of truth for buyer data
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 Extract session from HTTP-only cookie (secure, can't be stolen by JS)
    const sessionToken = request.cookies.get('empi_session')?.value;

    if (!sessionToken) {
      console.log('[Auth/Me] ❌ No session token found');
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    await connectDB();

    // 🔒 Validate session exists and is not expired
    const buyer = await Buyer.findOne({
      sessionToken,
      sessionExpiry: { $gt: new Date() } // Session not expired
    });

    if (!buyer) {
      console.log('[Auth/Me] ❌ Invalid or expired session');
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    console.log(`[Auth/Me] ✅ Session valid for buyer: ${buyer.email}`);

    // 🔒 Return full profile - server is source of truth
    // Client gets fresh data every time (no stale data from localStorage)
    return NextResponse.json({
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
        isAdmin: buyer.isAdmin,
        preferredCurrency: buyer.preferredCurrency || 'NGN',
        createdAt: buyer.createdAt,
        lastLogin: buyer.lastLogin,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('[Auth/Me] ❌ Session validation error:', error);
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 500 }
    );
  }
}
