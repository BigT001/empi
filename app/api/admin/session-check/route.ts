import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * POST /api/admin/session-check
 * 
 * Activity-based session validation endpoint
 * Called every 5 minutes during active usage to reset the inactivity timer
 * 
 * Flow:
 * 1. Admin interacts with page (mouse, keyboard, scroll, etc)
 * 2. useActivityTracker detects activity and calls this endpoint every 5 minutes
 * 3. This endpoint validates the session and updates lastActivity timestamp
 * 4. If admin has been inactive > 30 mins, session is auto-logged out
 * 5. If session is valid, lastActivity is reset (sliding window)
 * 
 * Result: Admin stays logged in as long as active, logs out after 30 min inactivity
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { valid: false, error: 'No session token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find admin with this session token
    const admin = await Admin.findOne({
      'sessions.token': sessionToken,
    });

    if (!admin) {
      return NextResponse.json(
        { valid: false, error: 'Session not found' },
        { status: 401 }
      );
    }

    // Find the specific session
    const session = admin.sessions.find((s: any) => s.token === sessionToken);

    if (!session) {
      return NextResponse.json(
        { valid: false, error: 'Session not found' },
        { status: 401 }
      );
    }

    // Check if session has expired (manual expiry)
    if (new Date() > new Date(session.expiresAt)) {
      // Remove expired session
      await Admin.updateOne(
        { _id: admin._id },
        { $pull: { sessions: { token: sessionToken } } }
      );

      console.log('[Session Check] ❌ Session expired (manual logout)');
      return NextResponse.json(
        { valid: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Check inactivity timeout (30 minutes)
    const lastActivityTime = new Date(session.lastActivity).getTime();
    const currentTime = new Date().getTime();
    const inactivityDuration = currentTime - lastActivityTime;

    if (inactivityDuration > INACTIVITY_TIMEOUT) {
      // Session is inactive - auto-logout by removing the session
      await Admin.updateOne(
        { _id: admin._id },
        { $pull: { sessions: { token: sessionToken } } }
      );

      console.log(
        `[Session Check] ⏱️  AUTO-LOGOUT: Admin ${admin.email} was inactive for ${Math.round(
          inactivityDuration / 1000 / 60
        )} minutes - session removed`
      );

      return NextResponse.json(
        {
          valid: false,
          error: 'Session expired due to inactivity',
          inactivityMinutes: Math.round(inactivityDuration / 1000 / 60),
        },
        { status: 401 }
      );
    }

    // Session is valid - update lastActivity timestamp (sliding window)
    // This resets the 30-minute inactivity counter
    await Admin.updateOne(
      { _id: admin._id, 'sessions.token': sessionToken },
      { $set: { 'sessions.$.lastActivity': new Date() } }
    );

    const inactivityMinutes = Math.round(inactivityDuration / 1000 / 60);
    console.log(
      `[Session Check] ✅ Admin ${admin.email} active - last activity was ${inactivityMinutes} mins ago (session valid, timer reset)`
    );

    return NextResponse.json(
      {
        valid: true,
        admin: {
          _id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions,
        },
        sessionInfo: {
          createdAt: session.createdAt,
          lastActivity: new Date(),
          inactivityMinutes,
          message: 'Session active - inactivity timer reset due to user activity',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Session Check] Error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Session check failed' },
      { status: 500 }
    );
  }
}
