import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get admin_session cookie
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify requesting admin is super_admin
    const requestingAdmin = await Admin.findOne({ sessionToken, sessionExpiry: { $gt: new Date() } });

    if (!requestingAdmin || requestingAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can add new admins' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, fullName, password, role, permissions } = body;

    // Validation
    if (!email || !fullName || !password || !role) {
      return NextResponse.json(
        { error: 'Email, fullName, password, and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or super_admin' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 409 }
      );
    }

    // Get all admins to check count (max 5)
    const adminCount = await Admin.countDocuments();

    if (adminCount >= 5 && role === 'admin') {
      return NextResponse.json(
        { error: 'Maximum of 5 admin accounts reached. You can only create super admins now.' },
        { status: 400 }
      );
    }

    // Set default permissions
    const defaultPermissions = [
      'view_dashboard',
      'view_products',
      'view_orders',
      'view_finance',
      'view_invoices',
      'view_settings',
    ];

    // Create new admin
    const newAdmin = new Admin({
      email: email.toLowerCase(),
      fullName,
      password,
      role,
      permissions: permissions || defaultPermissions,
      isActive: true,
    });

    await newAdmin.save();

    console.log(`✅ New admin created: ${email} by ${requestingAdmin.email}`);

    return NextResponse.json(
      {
        _id: newAdmin._id,
        id: newAdmin._id,
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
        isActive: newAdmin.isActive,
        createdAt: newAdmin.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add admin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add admin' },
      { status: 500 }
    );
  }
}

// Get all admins or sub-admins based on query parameter
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get admin_session cookie
    const sessionToken = request.cookies.get('admin_session')?.value;

    console.log('\n=== 🔍 GET /api/admin/users ===');
    if (!sessionToken) {
      console.log('❌ No session token in cookie');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ Session token found:', sessionToken.substring(0, 20) + '...');

    // Find admin with this session token - first try legacy field, then sessions array
    let requestingAdmin = await Admin.findOne({ sessionToken });
    
    if (!requestingAdmin) {
      // Try finding in sessions array
      requestingAdmin = await Admin.findOne({
        'sessions.token': sessionToken
      });
    }

    if (!requestingAdmin) {
      console.log('❌ Admin not found with token');
      const totalAdmins = await Admin.countDocuments();
      const superAdmins = await Admin.countDocuments({ role: 'super_admin' });
      console.log(`Total admins: ${totalAdmins}, Super admins: ${superAdmins}`);
      
      return NextResponse.json(
        { error: 'Not authenticated or session expired' },
        { status: 401 }
      );
    }

    console.log('✅ Found admin:', requestingAdmin.email, '| Role:', requestingAdmin.role);

    if (requestingAdmin.role !== 'super_admin') {
      console.log('❌ User is not super_admin, role:', requestingAdmin.role);
      return NextResponse.json(
        { error: 'Only super admins can view all admins' },
        { status: 403 }
      );
    }

    console.log('✅✅✅ Authentication PASSED! User IS super_admin');

    // Check if requesting only sub-admins (exclude super_admin)
    const { searchParams } = new URL(request.url);
    const subAdminsOnly = searchParams.get('subAdminsOnly') === 'true';

    let query = {};
    if (subAdminsOnly) {
      query = { role: { $ne: 'super_admin' } };
      console.log('📋 Fetching: sub-admins only (role !== super_admin)');
    } else {
      console.log('📋 Fetching: all admins');
    }

    // Get admins (exclude passwords)
    const admins = await Admin.find(query, '-password').lean();
    console.log(`✅ Returning ${admins.length} admins`);

    return NextResponse.json(admins);
  } catch (error: any) {
    console.error('❌ Get admins error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}
