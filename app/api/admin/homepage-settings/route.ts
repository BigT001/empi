import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';
import Admin from '@/lib/models/Admin';

// GET homepage settings for admin
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
    return NextResponse.json({
      activeHomePage: settings?.activeHomePage || 'default'
    });
  } catch (error) {
    console.error('[Admin Homepage Settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

// POST update homepage settings
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

    const { activeHomePage } = await request.json();

    if (!activeHomePage || !['default', 'costume-show'].includes(activeHomePage)) {
      return NextResponse.json(
        { error: 'Invalid activeHomePage value. Must be "default" or "costume-show"' },
        { status: 400 }
      );
    }

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({
        bankAccounts: [],
      });
    }

    settings.activeHomePage = activeHomePage;
    await settings.save();

    // Update public homepage settings memory cache
    const globalWithSettings = global as any;
    globalWithSettings.cachedHomepageSettings = { activeHomePage };

    return NextResponse.json({
      success: true,
      activeHomePage: settings.activeHomePage
    });
  } catch (error) {
    console.error('[Admin Homepage Settings POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
