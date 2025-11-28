import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

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
  const clientIP = getClientIP(request);
  
  try {
    console.log(`[Logout API] POST /api/admin/logout called from IP: ${clientIP}`);
    
    // Get the session token from cookie
    const sessionToken = request.cookies.get('admin_session')?.value;
    
    if (!sessionToken) {
      console.log(`[Logout API] ⚠️ No session token found from IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find admin with this session token and clear it
    const admin = await Admin.findOneAndUpdate(
      { sessionToken },
      { 
        sessionToken: null, 
        sessionExpiry: null,
        lastLogout: new Date(), // Track logout timestamp for audit
      },
      { new: true }
    );

    if (!admin) {
      console.log(`[Logout API] ⚠️ Session token not found in database from IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    console.log(`[Logout API] ✅ Session cleared for admin: ${admin.email} from IP: ${clientIP}`);
    console.log(`[Logout API] 📊 Last login: ${admin.lastLogin?.toISOString()}`);
    console.log(`[Logout API] 📊 Session duration: ${admin.lastLogin && admin.lastLogout ? 
      Math.round((new Date(admin.lastLogout).getTime() - new Date(admin.lastLogin).getTime()) / 1000) + ' seconds' : 
      'N/A'}`);

    const response = NextResponse.json(
      { message: 'Logged out successfully', timestamp: new Date().toISOString() },
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

    console.log(`[Logout API] ✅ Cookie cleared`);
    return response;
  } catch (error: any) {
    console.error(`[Logout API] ❌ Logout error from IP: ${clientIP}:`, error);
    return NextResponse.json(
      { error: error.message || 'Logout failed', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
