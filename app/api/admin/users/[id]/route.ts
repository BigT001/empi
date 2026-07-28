import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import { getRolePermissions, type AdminRole } from '@/lib/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adminIdParam } = await params;
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
    // Check both old and new session structures
    const requestingAdmin = await Admin.findOne({
      $or: [
        { 'sessions.token': sessionToken },
        { sessionToken }
      ]
    });

    if (!requestingAdmin) {
      return NextResponse.json(
        { error: 'Only super admins can update admins' },
        { status: 403 }
      );
    }

    if (requestingAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can update admins' },
        { status: 403 }
      );
    }

    const { isActive, permissions, fullName, role, department } = await request.json();

    // Prevent deactivating self
    if (adminIdParam === requestingAdmin._id.toString() && isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const admin = await Admin.findById(adminIdParam);

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Update admin
    if (isActive !== undefined) {
      admin.isActive = isActive;
    }
    if (permissions && Array.isArray(permissions)) {
      admin.permissions = permissions;
    }
    if (typeof fullName === 'string' && fullName.trim()) {
      admin.fullName = fullName.trim();
    }
    if (role !== undefined) {
      const allowedRoles: AdminRole[] = ['admin', 'finance_admin', 'logistics_admin', 'sales_admin'];
      if (!allowedRoles.includes(role as AdminRole)) {
        return NextResponse.json({ error: 'Invalid sub-admin role' }, { status: 400 });
      }
      admin.role = role;
      if (!permissions) admin.permissions = getRolePermissions(role as AdminRole);
    }
    if (department !== undefined) {
      if (!['general', 'finance', 'logistics', 'sales'].includes(department)) {
        return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
      }
      admin.department = department;
    }

    await admin.save();

    console.log(`✅ Admin updated: ${admin.email} by ${requestingAdmin.email}`);

    return NextResponse.json({
      _id: admin._id,
      id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions,
      department: admin.department,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (error: unknown) {
    console.error('Update admin error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update admin' },
      { status: 500 }
    );
  }
}

// Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adminIdParam } = await params;
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
    // Check both old and new session structures
    const requestingAdmin = await Admin.findOne({
      $or: [
        { 'sessions.token': sessionToken },
        { sessionToken }
      ]
    });

    if (!requestingAdmin) {
      return NextResponse.json(
        { error: 'Only super admins can delete admins' },
        { status: 403 }
      );
    }

    if (requestingAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can delete admins' },
        { status: 403 }
      );
    }

    // Prevent deleting self
    if (adminIdParam === requestingAdmin._id.toString()) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const admin = await Admin.findByIdAndDelete(adminIdParam);

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Admin deleted: ${admin.email} by ${requestingAdmin.email}`);

    return NextResponse.json({
      message: 'Admin deleted successfully',
      deletedAdmin: admin.email,
    });
  } catch (error: unknown) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
