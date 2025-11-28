import { NextRequest, NextResponse } from 'next/server';
import { rolloverVAT, getCurrentMonthVAT } from '@/lib/utils/vatCalculations';

/**
 * GET /api/admin/vat/rollover - Manually trigger VAT rollover
 * POST /api/admin/vat/rollover - Same as GET (for consistency)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    const result = await rolloverVAT();

    return NextResponse.json(
      {
        success: true,
        message: 'VAT rollover processed',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VAT Rollover API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process VAT rollover',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
