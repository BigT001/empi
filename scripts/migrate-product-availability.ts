/**
 * Migration script to add availableForBuy and availableForRent fields to existing products
 * Run this once to backfill the database with the new fields
 */

import mongoose from 'mongoose';
import Product from '@/lib/models/Product';

async function migrateProductAvailability() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all products that don't have these fields
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

    console.log(`✅ Migration complete!`);
    console.log(`   - Modified: ${result.modifiedCount} products`);
    console.log(`   - Matched: ${result.matchedCount} products`);

    // Show some stats
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

    console.log('\n📊 Product availability breakdown:');
    byAvailability.forEach((group) => {
      const { buy, rent, count } = group;
      if (buy && rent) {
        console.log(`   ✅ Available for both BUY & RENT: ${count}`);
      } else if (buy && !rent) {
        console.log(`   🛒 For Sale Only: ${count}`);
      } else if (!buy && rent) {
        console.log(`   🎪 Rental Only: ${count}`);
      } else {
        console.log(`   ❌ Not Available: ${count}`);
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Migration finished and disconnected');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProductAvailability();
