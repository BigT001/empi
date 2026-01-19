import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

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

    // Find admin with this session token
    const admin = await Admin.findOne({
      'sessions.token': sessionToken,
    });

    if (!admin || !admin.isActive) {
      console.log('[Admin/Me API] ❌ Admin not found, or inactive - returning 401');
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    const session = admin.sessions.find((s: any) => s.token === sessionToken);
    if (!session) {
      console.log('[Admin/Me API] ❌ Session not found');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    // Check if session has expired
    if (new Date() > new Date(session.expiresAt)) {
      console.log('[Admin/Me API] ❌ Session expired');
      await Admin.updateOne(
        { _id: admin._id },
        { $pull: { sessions: { token: sessionToken } } }
      );
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Check inactivity timeout
    const inactivityDuration = new Date().getTime() - new Date(session.lastActivity).getTime();
    if (inactivityDuration > INACTIVITY_TIMEOUT) {
      console.log('[Admin/Me API] ❌ Session inactive for too long');
      await Admin.updateOne(
        { _id: admin._id },
        { $pull: { sessions: { token: sessionToken } } }
      );
      return NextResponse.json(
        { error: 'Session expired due to inactivity' },
        { status: 401 }
      );
    }

    // Update lastActivity to extend the session window
    await Admin.updateOne(
      { _id: admin._id, 'sessions.token': sessionToken },
      { $set: { 'sessions.$.lastActivity': new Date() } }
    );

    console.log('[Admin/Me API] ✅ Admin authenticated:', admin.email);

    const response = NextResponse.json({
      _id: admin._id,
      id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions,
      lastLogin: admin.lastLogin,
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
