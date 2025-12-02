import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/lib/models/Product';

/**
 * POST /api/admin/migrate-product-availability
 * 
 * Migration endpoint to add availableForBuy and availableForRent fields to existing products
 * This should only be called once to backfill the database
 * 
 * Protected by admin token
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_RESET_SECRET;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Update all products that don't have availability flags
    const result = await Product.updateMany(
      {
        $or: [
          { availableForBuy: { $exists: false } },
          { availableForRent: { $exists: false } }
        ]
      },
      {
        $set: {
          availableForBuy: true,
          availableForRent: true
        }
      }
    );

    // Get breakdown of product availability
    const byAvailability = await Product.aggregate([
      {
        $group: {
          _id: {
            buy: '$availableForBuy',
            rent: '$availableForRent'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const breakdown: Record<string, number> = {};
    byAvailability.forEach((group: any) => {
      const { buy, rent, count } = group;
      if (buy && rent) {
        breakdown['both'] = count;
      } else if (buy && !rent) {
        breakdown['saleOnly'] = count;
      } else if (!buy && rent) {
        breakdown['rentalOnly'] = count;
      } else {
        breakdown['unavailable'] = count;
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product availability migration completed',
      modified: result.modifiedCount,
      matched: result.matchedCount,
      breakdown,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
