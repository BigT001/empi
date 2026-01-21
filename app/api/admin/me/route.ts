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
    console.log('[Admin/Me API] admin_session cookie value:', sessionToken ? `present (${sessionToken.substring(0, 8)}...)` : 'NOT FOUND');

    if (!sessionToken) {
      console.log('[Admin/Me API] ❌ No session cookie found - returning 401');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find admin with this session token
    console.log('[Admin/Me API] Searching for admin with session token...');
    const admin = await Admin.findOne({
      'sessions.token': sessionToken,
    });

    if (!admin) {
      console.log('[Admin/Me API] ❌ Admin not found with this session token');
      console.log('[Admin/Me API] Total admins in DB:', await Admin.countDocuments({}));
      
      // Check if ANY admin has any sessions to debug
      const adminsWithSessions = await Admin.countDocuments({ sessions: { $exists: true, $ne: [] } });
      console.log('[Admin/Me API] Admins with sessions:', adminsWithSessions);
      
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      console.log('[Admin/Me API] ❌ Admin account inactive');
      return NextResponse.json(
        { error: 'Admin account has been disabled' },
        { status: 403 }
      );
    }

    console.log('[Admin/Me API] ✅ Found admin:', admin.email, '- Session count:', admin.sessions?.length || 0);

    // Handle case where sessions array doesn't exist (legacy admin)
    if (!admin.sessions || !Array.isArray(admin.sessions)) {
      console.log('[Admin/Me API] ⚠️ Admin has no sessions array - reinitializing');
      await Admin.updateOne(
        { _id: admin._id },
        { sessions: [] }
      );
      return NextResponse.json(
        { error: 'Session not found - please log in again' },
        { status: 401 }
      );
    }

    const session = admin.sessions.find((s: any) => s.token === sessionToken);
    if (!session) {
      console.log('[Admin/Me API] ❌ Session token not found in sessions array');
      console.log('[Admin/Me API] Sessions in document:', admin.sessions.map((s: any) => ({ token: s.token?.substring(0, 8) + '...', createdAt: s.createdAt })));
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    console.log('[Admin/Me API] ✅ Session found - Created:', session.createdAt, 'Expires:', session.expiresAt);

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

    // Check inactivity timeout (30 minutes of inactivity)
    const inactivityDuration = new Date().getTime() - new Date(session.lastActivity).getTime();
    if (inactivityDuration > INACTIVITY_TIMEOUT) {
      console.log(`[Admin/Me API] ⏱️  AUTO-LOGOUT: Admin ${admin.email} inactive for ${Math.round(inactivityDuration / 1000 / 60)} minutes - session removed`);
      await Admin.updateOne(
        { _id: admin._id },
        { $pull: { sessions: { token: sessionToken } } }
      );
      return NextResponse.json(
        { error: 'Session expired due to inactivity (no activity for 30 minutes)' },
        { status: 401 }
      );
    }

    // Update lastActivity to extend the session window
    await Admin.updateOne(
      { _id: admin._id, 'sessions.token': sessionToken },
      { $set: { 'sessions.$.lastActivity': new Date() } }
    );

    const inactivityMinutes = Math.round(inactivityDuration / 1000 / 60);
    console.log(`[Admin/Me API] ✅ Admin authenticated: ${admin.email} (inactive for ${inactivityMinutes} mins - session valid, timer reset)`);

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
