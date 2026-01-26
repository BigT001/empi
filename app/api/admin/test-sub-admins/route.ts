import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    console.log('🧪 TEST ENDPOINT - Getting all sub-admins');

    // Get all admins
    const allAdmins = await Admin.find({}, '-password').lean();
    console.log(`Total admins: ${allAdmins.length}`);
    
    // Get sub-admins (excluding super_admin)
    const subAdmins = await Admin.find({ role: { $ne: 'super_admin' } }, '-password').lean();
    console.log(`Sub-admins (excluding super_admin): ${subAdmins.length}`);

    return NextResponse.json({
      allAdmins: allAdmins.length,
      subAdmins: subAdmins.length,
      data: subAdmins,
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch' },
      { status: 500 }
    );
  }
}
