import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('empi_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find buyer with this session token and clear it
    const buyer = await Buyer.findOneAndUpdate(
      { sessionToken },
      { sessionToken: null, sessionExpiry: null },
      { new: true }
    );

    if (!buyer) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    console.log(`✅ Session ended for buyer: ${buyer.email}`);

    // Clear the session cookie
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.set({
      name: 'empi_session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
