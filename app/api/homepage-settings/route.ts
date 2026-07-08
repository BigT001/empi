import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

let globalWithSettings = global as typeof globalThis & {
  cachedHomepageSettings: { activeHomePage: string } | null;
};

if (!globalWithSettings.cachedHomepageSettings) {
  globalWithSettings.cachedHomepageSettings = null;
}

export async function GET(request: NextRequest) {
  try {
    if (globalWithSettings.cachedHomepageSettings) {
      const response = NextResponse.json(globalWithSettings.cachedHomepageSettings);
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=120"
      );
      return response;
    }

    await connectDB();
    const settings = await Settings.findOne({});
    
    const result = {
      activeHomePage: settings?.activeHomePage || 'default'
    };
    
    globalWithSettings.cachedHomepageSettings = result;
    
    const response = NextResponse.json(result);
    
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
