import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import crypto from 'crypto';
import { isRateLimited, recordFailedAttempt, clearRateLimit, getRemainingAttempts, getLockoutRemainingTime } from '@/lib/rate-limit';

// Session expires only on manual logout - set to 30 days (very long)
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : real || 'unknown';
  return ip;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    console.log(`[Admin Login] Login attempt from IP: ${clientIP}`);

    // Check if IP is rate limited
    if (isRateLimited(clientIP)) {
      const remainingMinutes = Math.ceil(getLockoutRemainingTime(clientIP) / 60000);
      console.log(`[Admin Login] ⚠️ Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`,
          remainingMinutes,
        },
        { status: 429 }
      );
    }

    try {
      await connectDB();
    } catch (dbError) {
      console.error('[Admin Login] ❌ Database connection failed:', dbError instanceof Error ? dbError.message : dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      recordFailedAttempt(clientIP);
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email
    let admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      recordFailedAttempt(clientIP);
      console.log(`[Admin Login] ❌ Admin not found: ${email}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Debug: Log the admin role
    console.log(`[Admin Login] Found admin: ${admin.email}, role: ${admin.role}`);

    // Check if admin is active
    if (!admin.isActive) {
      recordFailedAttempt(clientIP);
      console.log(`[Admin Login] ❌ Admin account disabled: ${email}`);
      return NextResponse.json(
        { error: 'This admin account has been disabled' },
        { status: 403 }
      );
    }

    // Compare passwords
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      recordFailedAttempt(clientIP);
      const remainingAttempts = getRemainingAttempts(clientIP);
      console.log(`[Admin Login] ❌ Invalid password for ${email} (${remainingAttempts} attempts left)`);
      return NextResponse.json(
        {
          error: `Invalid email or password (${remainingAttempts} attempts remaining)`,
          remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Password is valid - clear rate limit
    clearRateLimit(clientIP);

    // Create secure session token for THIS specific login
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + SESSION_EXPIRY);

    // Initialize sessions array if it doesn't exist (for legacy admins)
    let adminSessions = admin.sessions;
    if (!adminSessions || !Array.isArray(adminSessions)) {
      console.log(`[Admin Login] ⚠️ Initializing sessions array for admin: ${admin.email}`);
      await Admin.updateOne(
        { _id: admin._id },
        { $set: { sessions: [] } }
      );
      adminSessions = [];
    }

    // Add this session to the admin's sessions array (allows multiple concurrent logins)
    const newSession = {
      token: sessionToken,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: sessionExpiry,
    };

    const updateResult = await Admin.updateOne(
      { _id: admin._id },
      {
        lastLogin: new Date(),
        $push: {
          sessions: newSession
        }
      }
    );

    console.log(`[Admin Login] Session update result:`, {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    });

    if (updateResult.modifiedCount === 0) {
      console.error(`[Admin Login] ❌ Failed to update admin sessions for: ${email}`);
      return NextResponse.json(
        { error: 'Login failed - could not create session' },
        { status: 500 }
      );
    }

    // VERIFY the session was saved
    const verifyAdmin = await Admin.findOne({ _id: admin._id });
    const savedSession = verifyAdmin?.sessions?.find((s: any) => s.token === sessionToken);
    if (!savedSession) {
      console.error(`[Admin Login] ❌ Session not found after save - verification failed`);
      return NextResponse.json(
        { error: 'Login failed - session could not be verified' },
        { status: 500 }
      );
    }

    console.log(`✅ Admin logged in successfully: ${email} from IP: ${clientIP}`);
    console.log(`[Admin Login] Session verified in database - token: ${sessionToken.substring(0, 8)}...`);

    // Create response with admin data
    const response = NextResponse.json(
      {
        _id: admin._id,
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie with token
    response.cookies.set({
      name: 'admin_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https'),
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000, // Convert to seconds
      path: '/',
    });

    console.log(`[Admin Login] ✅ Session cookie set for: ${admin.email}, expires in ${SESSION_EXPIRY / (1000 * 60 * 60 * 24)} days`);

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
