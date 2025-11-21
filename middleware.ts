import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
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
  ];

  // Check if current path requires admin authentication
  const isProtectedPath = adminPaths.some(path => pathname.startsWith(path));

  // Allow login page without authentication
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // If accessing protected path, check for admin session cookie
  if (isProtectedPath) {
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession) {
      // Redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
