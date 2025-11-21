import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import { isSessionInvalid } from '@/lib/invalidSessions';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get admin_session cookie
    const adminId = request.cookies.get('admin_session')?.value;
    
    console.log('[Admin/Me API] GET /api/admin/me called');
    console.log('[Admin/Me API] admin_session cookie value:', adminId || 'NOT FOUND');

    if (!adminId) {
      console.log('[Admin/Me API] ❌ No session cookie found - returning 401');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if session has been invalidated
    if (isSessionInvalid(adminId)) {
      console.log('[Admin/Me API] ❌ Session has been invalidated (logged out) - returning 401');
      return NextResponse.json(
        { error: 'Session invalidated' },
        { status: 401 }
      );
    }

    // Find admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin || !admin.isActive) {
      console.log('[Admin/Me API] ❌ Admin not found or inactive - returning 401');
      return NextResponse.json(
        { error: 'Admin not found or inactive' },
        { status: 401 }
      );
    }

    console.log('[Admin/Me API] ✅ Admin authenticated:', admin.email);
    return NextResponse.json({
      _id: admin._id,
      id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions,
      lastLogin: admin.lastLogin,
    });
  } catch (error: any) {
    console.error('[Admin/Me API] Auth check error:', error);
    return NextResponse.json(
      { error: error.message || 'Auth check failed' },
      { status: 500 }
    );
  }
}
