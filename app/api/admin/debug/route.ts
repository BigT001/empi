import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Test with each email
    const testEmails = ['admin@empicostumes.com', 'finance@empicostumes.com', 'logistics@empicostumes.com'];
    const results = [];

    for (const email of testEmails) {
      const admin = await Admin.findOne({ email });
      if (admin) {
        results.push({
          email: admin.email,
          name: admin.fullName,
          role: admin.role,
          roleType: typeof admin.role,
          permissions: admin.permissions,
          schemaEnum: (Admin.schema.path('role') as any).enumValues || [],
        });
      }
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date(),
      admins: results,
      adminModel: Admin.modelName,
    });
  } catch (error: any) {
    console.error('[Debug Admin] Error:', error);
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
