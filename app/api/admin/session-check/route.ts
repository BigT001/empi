import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Check and validate session, update lastActivity timestamp
 * Also auto-logout inactive sessions
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
        `[Session Check] ⚠️ Session auto-logged out due to inactivity (${Math.round(
          inactivityDuration / 1000 / 60
        )} minutes) for admin: ${admin.email}`
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

    // Session is valid - update lastActivity timestamp
    await Admin.updateOne(
      { _id: admin._id, 'sessions.token': sessionToken },
      { $set: { 'sessions.$.lastActivity': new Date() } }
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
          inactivityMinutes: Math.round(inactivityDuration / 1000 / 60),
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
