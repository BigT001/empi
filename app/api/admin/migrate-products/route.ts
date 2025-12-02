import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';

/**
 * Migration endpoint to update all existing products with availability flags
 * This ensures backward compatibility with products uploaded before the feature was added
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Starting product migration...");
    
    await connectDB();

    // Update all products that don't have availableForBuy or availableForRent set
    const result = await Product.updateMany(
      {
        $or: [
          { availableForBuy: { $exists: false } },
          { availableForRent: { $exists: false } },
        ]
      },
      {
        $set: {
          availableForBuy: true,
          availableForRent: true,
        }
      }
    );

    console.log("✅ Migration completed");
    console.log(`📊 Modified ${result.modifiedCount} products`);
    console.log(`📊 Matched ${result.matchedCount} products`);

    // Fetch a sample to verify
    const sample = await Product.findOne({}).lean() as any;
    console.log("📋 Sample product after migration:", {
      name: sample?.name,
      availableForBuy: sample?.availableForBuy,
      availableForRent: sample?.availableForRent,
    });

    return NextResponse.json({
      success: true,
      message: "✅ All products migrated successfully",
      stats: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        upsertedCount: result.upsertedCount,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Migration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json({
      error: "Migration failed",
      details: errorMessage,
    }, { status: 500 });
  }
}
