import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const settings = await Settings.findOne({});
    
    const response = NextResponse.json({
      activeHomePage: settings?.activeHomePage || 'default'
    });
    
    // Add lightweight cache for public settings
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );
    
    return response;
  } catch (error) {
    console.error('[Public Homepage Settings GET] Error:', error);
    return NextResponse.json(
      { activeHomePage: 'default' },
      { status: 200 }
    );
  }
}
