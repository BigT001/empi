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
      activeHomePage: settings?.activeHomePage || 'default',
      isPriceOptional: settings?.isPriceOptional || false
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

    const { activeHomePage, isPriceOptional } = await request.json();

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({
        bankAccounts: [],
      });
    }

    if (activeHomePage !== undefined) {
      if (!['default', 'costume-show'].includes(activeHomePage)) {
        return NextResponse.json(
          { error: 'Invalid activeHomePage value. Must be "default" or "costume-show"' },
          { status: 400 }
        );
      }
      settings.activeHomePage = activeHomePage;
      
      // Update public homepage settings memory cache
      const globalWithSettings = global as any;
      globalWithSettings.cachedHomepageSettings = { 
        ...globalWithSettings.cachedHomepageSettings,
        activeHomePage 
      };
    }

    if (isPriceOptional !== undefined) {
      settings.isPriceOptional = isPriceOptional === true;
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      activeHomePage: settings.activeHomePage,
      isPriceOptional: settings.isPriceOptional
    });
  } catch (error) {
    console.error('[Admin Homepage Settings POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
