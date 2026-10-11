import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';
import Admin from '@/lib/models/Admin';
import { normalizeVatPercent, resolveVatConfig } from '@/lib/vat';
import { setCachedVatConfig } from '@/lib/vatSettings';

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
    return NextResponse.json(resolveVatConfig(settings));
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
    const { isVatDisabled, vatPercent } = body;

    if (isVatDisabled !== undefined && typeof isVatDisabled !== 'boolean') {
      return NextResponse.json({ error: 'isVatDisabled must be a boolean' }, { status: 400 });
    }

    const parsedPercent = vatPercent === undefined ? undefined : Number(vatPercent);
    if (parsedPercent !== undefined && (!Number.isFinite(parsedPercent) || parsedPercent < 0 || parsedPercent > 100)) {
      return NextResponse.json({ error: 'vatPercent must be a number between 0 and 100' }, { status: 400 });
    }

    if (isVatDisabled === undefined && parsedPercent === undefined) {
      return NextResponse.json({ error: 'Provide isVatDisabled and/or vatPercent' }, { status: 400 });
    }

    // Only the VAT fields are touched; every other setting is left exactly as it is
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({ bankAccounts: [] });
    }

    if (isVatDisabled !== undefined) settings.isVatDisabled = isVatDisabled;
    if (parsedPercent !== undefined) settings.vatPercent = normalizeVatPercent(parsedPercent);
    await settings.save();

    const config = resolveVatConfig(settings);
    setCachedVatConfig(config);

    const message = isVatDisabled !== undefined && parsedPercent === undefined
      ? `VAT has been ${config.isVatDisabled ? 'disabled' : 'enabled'} successfully.`
      : `VAT rate set to ${config.vatPercent}%${config.isVatDisabled ? ' (VAT is currently turned off)' : ''}.`;

    return NextResponse.json({ success: true, message, ...config });
  } catch (error) {
    console.error('[Admin VAT Settings POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update VAT settings' },
      { status: 500 }
    );
  }
}
