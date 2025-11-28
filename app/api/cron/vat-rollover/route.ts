import { NextRequest, NextResponse } from 'next/server';
import { vatRolloverCronJob, monthlyReconciliationCronJob } from '@/lib/utils/cronJobs';

/**
 * GET /api/cron/vat-rollover
 * Triggered automatically on the 21st of each month (via Vercel Crons or similar)
 * Manual trigger also supported for testing/admin purposes
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authorization header check for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require it for external requests
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow localhost for testing
      const host = request.headers.get('host') || '';
      if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const result = await vatRolloverCronJob();

    return NextResponse.json(
      {
        success: true,
        message: 'VAT rollover cron job executed',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VAT Cron Job API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute VAT rollover cron job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/monthly-reconciliation
 * Manual reconciliation endpoint to recalculate all monthly VAT data
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const host = request.headers.get('host') || '';
      if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const result = await monthlyReconciliationCronJob();

    return NextResponse.json(
      {
        success: true,
        message: 'Monthly reconciliation executed',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Monthly Reconciliation API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute monthly reconciliation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
