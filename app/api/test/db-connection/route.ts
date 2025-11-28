import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VATHistory from '@/lib/models/VATHistory';

/**
 * GET /api/test/db-connection
 * Test database connectivity and VATHistory collection
 */
export async function GET() {
  try {
    await connectDB();
    
    const count = await VATHistory.countDocuments();
    const latestRecord = await VATHistory.findOne({}).sort({ createdAt: -1 });
    const allRecords = await VATHistory.find({}).lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Database connected successfully',
        database: {
          connected: true,
          collection: 'VATHistory',
          totalRecords: count,
          records: allRecords,
          latestRecord: latestRecord,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DB Connection Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
