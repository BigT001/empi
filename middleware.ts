import { NextRequest, NextResponse } from 'next/server';

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

    // Session cookie exists - let API routes validate the session fully
    // This avoids database connection issues in middleware
    console.log(
      `[Middleware] ✅ Valid admin session cookie found, allowing access to: ${pathname}`
    );
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
