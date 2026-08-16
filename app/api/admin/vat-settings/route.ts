import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';
import Admin from '@/lib/models/Admin';

// GET admin VAT settings
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate admin
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let admin = await Admin.findOne({ sessionToken });
    if (!admin) {
      admin = await Admin.findOne({ 'sessions.token': sessionToken });
    }
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await Settings.findOne({});
    const isVatDisabled = Boolean(settings?.isVatDisabled);
    
    return NextResponse.json({
      isVatDisabled,
      vatRate: isVatDisabled ? 0 : 0.075,
    });
  } catch (error) {
    console.error('[Admin VAT Settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve VAT settings' },
      { status: 500 }
    );
  }
}

// POST/PATCH update admin VAT settings
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate admin
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let admin = await Admin.findOne({ sessionToken });
    if (!admin) {
      admin = await Admin.findOne({ 'sessions.token': sessionToken });
    }
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check permissions
    const canManage = admin.role === 'super_admin' ||
      admin.permissions?.includes('access_all_features') ||
      admin.permissions?.includes('manage_store_settings') ||
      admin.permissions?.includes('view_settings');

    if (!canManage) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { isVatDisabled } = body;

    if (typeof isVatDisabled !== 'boolean') {
      return NextResponse.json({ error: 'isVatDisabled must be a boolean' }, { status: 400 });
    }

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({ bankAccounts: [] });
    }

    settings.isVatDisabled = isVatDisabled;
    await settings.save();

    // Invalidate public/global memory cache
    const globalWithVatSettings = global as typeof globalThis & {
      cachedVatSettings: { isVatDisabled: boolean; vatRate: number } | null;
    };
    globalWithVatSettings.cachedVatSettings = {
      isVatDisabled,
      vatRate: isVatDisabled ? 0 : 0.075,
    };

    return NextResponse.json({
      success: true,
      message: `VAT has been ${isVatDisabled ? 'disabled' : 'enabled'} successfully.`,
      isVatDisabled: settings.isVatDisabled,
      vatRate: settings.isVatDisabled ? 0 : 0.075,
    });
  } catch (error) {
    console.error('[Admin VAT Settings POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update VAT settings' },
      { status: 500 }
    );
  }
}
