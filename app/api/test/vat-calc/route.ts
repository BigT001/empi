import { NextResponse } from 'next/server';
import { getCurrentMonthVAT, getCurrentVATPeriod, calculateVATForPeriod } from '@/lib/utils/vatCalculations';

/**
 * GET /api/test/vat-calc
 * Test VAT calculation logic and return detailed breakdown
 */
export async function GET() {
  try {
    const period = getCurrentVATPeriod();
    const currentVAT = await getCurrentMonthVAT();
    const calcDetails = await calculateVATForPeriod(period.startDate, period.endDate);

    return NextResponse.json(
      {
        success: true,
        message: 'VAT calculations successful',
        data: {
          period: {
            startDate: period.startDate,
            endDate: period.endDate,
            month: period.month,
            year: period.year,
          },
          currentMonthVAT: currentVAT,
          calculationDetails: calcDetails,
          monthName: new Date(period.year, period.month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VAT Calculation Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'VAT calculation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
