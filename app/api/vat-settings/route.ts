import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

let globalWithVatSettings = global as typeof globalThis & {
  cachedVatSettings: { isVatDisabled: boolean; vatRate: number } | null;
};

if (!globalWithVatSettings.cachedVatSettings) {
  globalWithVatSettings.cachedVatSettings = null;
}

export async function GET(request: NextRequest) {
  try {
    if (globalWithVatSettings.cachedVatSettings) {
      const response = NextResponse.json(globalWithVatSettings.cachedVatSettings);
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=30, stale-while-revalidate=60"
      );
      return response;
    }

    await connectDB();
    const settings = await Settings.findOne({});
    
    const isVatDisabled = Boolean(settings?.isVatDisabled);
    const result = {
      isVatDisabled,
      vatRate: isVatDisabled ? 0 : 0.075,
    };
    
    globalWithVatSettings.cachedVatSettings = result;
    
    const response = NextResponse.json(result);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60"
    );
    
    return response;
  } catch (error) {
    console.error('[Public VAT Settings GET] Error:', error);
    return NextResponse.json(
      { isVatDisabled: false, vatRate: 0.075 },
      { status: 200 }
    );
  }
}
