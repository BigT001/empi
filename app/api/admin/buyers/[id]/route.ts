import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';
import Admin from '@/lib/models/Admin';
import crypto from 'crypto';

async function findBuyerByFlexibleLookup(lookup: string | undefined) {
  if (!lookup) return null;
  lookup = String(lookup).trim();
  // strip surrounding quotes
  lookup = lookup.replace(/^"|"$/g, '');

  // try by id
  try {
    const byId = await Buyer.findById(lookup).exec();
    if (byId) return byId;
  } catch (e) {
    // ignore
  }

  // try by _id field
  try {
    const byId2 = await Buyer.findOne({ _id: lookup }).exec();
    if (byId2) return byId2;
  } catch (e) {
    // ignore
  }

  // try by email
  try {
    const byEmail = await Buyer.findOne({ email: String(lookup).toLowerCase() }).exec();
    if (byEmail) return byEmail;
  } catch (e) {
    // ignore
  }

  return null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const requestingAdmin = await Admin.findById(adminId);
    if (!requestingAdmin || !['admin', 'super_admin'].includes(requestingAdmin.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const lookup = String(id || '').trim();
    const buyer = await findBuyerByFlexibleLookup(lookup);
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    await Buyer.deleteOne({ _id: buyer._id });

    console.log(`✅ Buyer deleted: ${buyer.email} by ${requestingAdmin.email}`);
    return NextResponse.json({ message: 'Buyer deleted' });
  } catch (err: any) {
    console.error('Delete buyer error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete buyer' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { newPassword } = body as { newPassword?: string };

    await connectDB();

    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const requestingAdmin = await Admin.findById(adminId);
    if (!requestingAdmin || !['admin', 'super_admin'].includes(requestingAdmin.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const lookup = String(id || '').trim();
    const buyer = await findBuyerByFlexibleLookup(lookup);
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    // Generate password if not provided or too short
    const generated = newPassword && String(newPassword).length >= 6 ? String(newPassword) : crypto.randomBytes(8).toString('hex');

    // assign and save (pre-save hook will hash)
    buyer.password = generated;
    await buyer.save();

    console.log(`🔐 Buyer password reset for ${buyer.email} by ${requestingAdmin.email}`);
    return NextResponse.json({ message: 'Password reset', password: generated });
  } catch (err: any) {
    console.error('Reset buyer password error:', err);
    return NextResponse.json({ error: err.message || 'Failed to reset password' }, { status: 500 });
  }
}
