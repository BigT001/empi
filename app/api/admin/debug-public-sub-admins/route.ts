import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

// PUBLIC endpoint for debugging - NO AUTH REQUIRED
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    console.log('🧪 [Public Debug] Getting all sub-admins...');

    const subAdmins = await Admin.find({ role: { $ne: 'super_admin' } }, '-password -sessions -sessionToken -sessionExpiry').lean();
    console.log(`✅ [Public Debug] Found ${subAdmins.length} sub-admins`);

    return NextResponse.json({
      success: true,
      count: subAdmins.length,
      data: subAdmins.map((admin: any) => ({
        _id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        department: admin.department,
        isActive: admin.isActive,
      }))
    });
  } catch (error: any) {
    console.error('[Public Debug] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
