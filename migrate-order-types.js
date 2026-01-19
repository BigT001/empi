/**
 * Migration Script: Set orderType for all existing orders
 * Analyzes order items and assigns correct orderType: 'rental', 'sales', or 'mixed'
 * Run this ONCE after deploying the orderType field
 */

import mongoose from 'mongoose';
import Order from './lib/models/Order.js';
import 'dotenv/config';

async function migrateOrderTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    // Find all orders without orderType (for safety, also include those with default)
    const orders = await Order.find({});
    console.log(`📋 Found ${orders.length} total orders to process\n`);

    let updated = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        const orderObj = order as any;

        // Determine type from items
        let hasRental = false;
        let hasSale = false;

        if (orderObj.items && Array.isArray(orderObj.items)) {
          orderObj.items.forEach((item: any) => {
            if (item.mode === 'rent') {
              hasRental = true;
            } else {
              hasSale = true;
            }
          });
        }

        // Determine final type
        const newOrderType: 'rental' | 'sales' | 'mixed' = hasRental && hasSale ? 'mixed' : hasRental ? 'rental' : 'sales';

        // Update only if different or not set
        const currentType = orderObj.orderType || 'sales';
        if (currentType !== newOrderType) {
          orderObj.orderType = newOrderType;
          await order.save();
          updated++;

          const itemCount = orderObj.items?.length || 0;
          const rentalCount = orderObj.items?.filter((i: any) => i.mode === 'rent').length || 0;
          const salesCount = itemCount - rentalCount;

          console.log(`  ✓ ${orderObj.orderNumber}: ${newOrderType.toUpperCase()} (${salesCount} sales + ${rentalCount} rental items)`);
        }
      } catch (err) {
        errors++;
        console.error(`  ✗ Error updating order:`, err instanceof Error ? err.message : String(err));
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Migration Complete!`);
    console.log(`  • Updated: ${updated}`);
    console.log(`  • Errors: ${errors}`);
    console.log(`  • Total processed: ${updated + (orders.length - updated)}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

migrateOrderTypes();
