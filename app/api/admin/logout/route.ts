import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

export async function POST(request: NextRequest) {
  try {
    console.log('[Logout API] POST /api/admin/logout called');
    
    // Get the session token from cookie
    const sessionToken = request.cookies.get('admin_session')?.value;
    
    if (!sessionToken) {
      console.log('[Logout API] No session token found');
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find admin with this session token and clear it
    const admin = await Admin.findOneAndUpdate(
      { sessionToken },
      { sessionToken: null, sessionExpiry: null },
      { new: true }
    );

    if (!admin) {
      console.log('[Logout API] Session token not found in database');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    console.log('[Logout API] ✅ Session cleared for admin:', admin.email);

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear admin_session cookie
    response.cookies.set({
      name: 'admin_session',
      value: '',
      maxAge: 0, // This tells the browser to delete the cookie
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log('[Logout API] ✅ Cookie cleared');
    return response;
  } catch (error: any) {
    console.error('[Logout API] Logout error:', error);
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
