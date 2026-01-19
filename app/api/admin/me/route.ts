import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

// Session extension time - extends on each request (sliding window)
const SESSION_EXTENSION = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get admin_session cookie with secure token
    const sessionToken = request.cookies.get('admin_session')?.value;
    
    console.log('[Admin/Me API] GET /api/admin/me called');
    console.log('[Admin/Me API] admin_session cookie value:', sessionToken ? 'present' : 'NOT FOUND');

    if (!sessionToken) {
      console.log('[Admin/Me API] ❌ No session cookie found - returning 401');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find admin with valid session token
    const admin = await Admin.findOne({
      sessionToken,
      sessionExpiry: { $gt: new Date() } // Session not expired
    });

    if (!admin || !admin.isActive) {
      console.log('[Admin/Me API] ❌ Admin not found, session expired, or inactive - returning 401');
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    console.log('[Admin/Me API] ✅ Admin authenticated:', admin.email);
    
    // Extend session expiry on each request (sliding window pattern)
    const newSessionExpiry = new Date(Date.now() + SESSION_EXTENSION);
    await Admin.updateOne(
      { _id: admin._id },
      { sessionExpiry: newSessionExpiry }
    );

    const response = NextResponse.json({
      _id: admin._id,
      id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions,
      lastLogin: admin.lastLogin,
    });

    // Refresh the session cookie to extend expiry
    response.cookies.set({
      name: 'admin_session',
      value: admin.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXTENSION / 1000, // Convert to seconds
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Admin/Me API] Auth check error:', error);
    return NextResponse.json(
      { error: error.message || 'Auth check failed' },
      { status: 500 }
    );
  }
}
