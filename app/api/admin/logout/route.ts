import { NextRequest, NextResponse } from 'next/server';
import { invalidateSession } from '@/lib/invalidSessions';

export async function POST(request: NextRequest) {
  try {
    console.log('[Logout API] POST /api/admin/logout called');
    console.log('[Logout API] Current cookies:', request.cookies.getAll());
    
    // Get the session ID and invalidate it
    const sessionId = request.cookies.get('admin_session')?.value;
    if (sessionId) {
      invalidateSession(sessionId);
      console.log('[Logout API] Session ID invalidated:', sessionId);
    }
    
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear admin_session cookie - use maxAge: 0 to delete it
    console.log('[Logout API] Clearing admin_session cookie');
    response.cookies.set({
      name: 'admin_session',
      value: '',
      maxAge: 0, // This tells the browser to delete the cookie
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log('[Logout API] ✅ Admin session cleared');
    return response;
  } catch (error: any) {
    console.error('[Logout API] Logout error:', error);
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
