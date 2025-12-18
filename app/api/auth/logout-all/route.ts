import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';

/**
 * POST /api/auth/logout-all
 * Admin endpoint to logout all users globally
 * Clears all active sessions from the database
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Clear all active sessions
    const result = await Buyer.updateMany(
      { sessionToken: { $ne: null } },
      { 
        sessionToken: null, 
        sessionExpiry: null 
      }
    );

    console.log(`✅ Logged out all users - Updated ${result.modifiedCount} buyer sessions`);

    return NextResponse.json({
      success: true,
      message: `All ${result.modifiedCount} active sessions have been cleared`,
      clearedSessions: result.modifiedCount,
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error logging out all users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to logout all users' },
      { status: 500 }
    );
  }
}
