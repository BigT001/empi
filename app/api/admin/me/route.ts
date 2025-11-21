import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get admin_session cookie
    const adminId = request.cookies.get('admin_session')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Admin not found or inactive' },
        { status: 401 }
      );
    }

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
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: error.message || 'Auth check failed' },
      { status: 500 }
    );
  }
}
