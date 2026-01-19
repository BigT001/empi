import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require admin authentication
  const adminPaths = [
    '/admin',
    '/admin/dashboard',
    '/admin/upload',
    '/admin/products',
    '/admin/finance',
    '/admin/invoices',
    '/admin/settings',
    '/admin/custom-orders',
  ];

  // Check if current path requires admin authentication
  const isProtectedPath = adminPaths.some(path => pathname.startsWith(path));

  // Allow login page without authentication
  if (pathname === '/admin/login') {
    console.log('[Middleware] ✅ Allowing access to /admin/login');
    return NextResponse.next();
  }

  // If accessing protected path, check for admin session cookie
  if (isProtectedPath) {
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession || !adminSession.value) {
      // No valid session - redirect to admin login
      console.log('[Middleware] ❌ No admin session found, redirecting to /admin/login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Validate session in database (check expiry, inactivity, and update lastActivity)
    try {
      await connectDB();

      const sessionToken = adminSession.value;
      const admin = await Admin.findOne({
        'sessions.token': sessionToken,
      });

      if (!admin) {
        console.log('[Middleware] ❌ Session token not found in database');
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      const session = admin.sessions.find((s: any) => s.token === sessionToken);

      if (!session) {
        console.log('[Middleware] ❌ Session not found for this admin');
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Check if session has expired (manual expiry)
      if (new Date() > new Date(session.expiresAt)) {
        console.log(
          `[Middleware] ❌ Session expired for admin: ${admin.email}`
        );
        // Remove expired session
        await Admin.updateOne(
          { _id: admin._id },
          { $pull: { sessions: { token: sessionToken } } }
        );
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Check inactivity timeout (30 minutes)
      const lastActivityTime = new Date(session.lastActivity).getTime();
      const currentTime = new Date().getTime();
      const inactivityDuration = currentTime - lastActivityTime;

      if (inactivityDuration > INACTIVITY_TIMEOUT) {
        console.log(
          `[Middleware] ⚠️ Session auto-logout due to inactivity (${Math.round(
            inactivityDuration / 1000 / 60
          )} minutes) for admin: ${admin.email}`
        );
        // Session is inactive - remove it
        await Admin.updateOne(
          { _id: admin._id },
          { $pull: { sessions: { token: sessionToken } } }
        );
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Session is valid - update lastActivity timestamp
      await Admin.updateOne(
        { _id: admin._id, 'sessions.token': sessionToken },
        { $set: { 'sessions.$.lastActivity': new Date() } }
      );

      console.log(
        `[Middleware] ✅ Valid admin session found, allowing access to: ${pathname}`
      );
      return NextResponse.next();
    } catch (error: any) {
      console.error('[Middleware] ❌ Error validating session:', error);
      // On error, allow request to proceed (API will handle detailed validation)
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
