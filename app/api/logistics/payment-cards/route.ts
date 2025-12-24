import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

// GET - Fetch logistics team payment cards
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Import model inside the function to avoid static import issues
    const mongoose = require('mongoose');
    const db = mongoose.connection;
    
    // Query the database directly
    const collection = db.collection('logisticspaymentcards');
    const paymentCards = await collection
      .find({ active: true })
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray();

    return NextResponse.json({
      success: true,
      paymentCards: paymentCards || [],
      count: paymentCards.length,
    });
  } catch (error) {
    console.error('[Logistics Payment Cards] Error fetching payment cards:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment cards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
