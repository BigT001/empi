import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('empi_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find buyer with valid session
    const buyer = await Buyer.findOne({
      sessionToken,
      sessionExpiry: { $gt: new Date() } // Session not expired
    });

    if (!buyer) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    console.log(`✅ Session valid for buyer: ${buyer.email}`);

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
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 500 }
    );
  }
}
