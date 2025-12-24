import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import crypto from 'crypto';
import { isRateLimited, recordFailedAttempt, clearRateLimit, getRemainingAttempts, getLockoutRemainingTime } from '@/lib/rate-limit';

const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

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
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      recordFailedAttempt(clientIP);
      console.log(`[Admin Login] ❌ Admin not found: ${email}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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

    // Create secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + SESSION_EXPIRY);

    // Update admin with session info
    admin.lastLogin = new Date();
    admin.sessionToken = sessionToken;
    admin.sessionExpiry = sessionExpiry;
    await admin.save();

    console.log(`✅ Admin logged in with secure token: ${email} from IP: ${clientIP}`);

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000, // Convert to seconds
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
