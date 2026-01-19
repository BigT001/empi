/**
 * DIAGNOSTIC SCRIPT: Check actual order data
 * Examines recent orders to debug sales vs rentals categorization
 */

import mongoose from 'mongoose';
import Order from './lib/models/Order.js';
import 'dotenv/config';

async function diagnoseOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    // Get the 5 most recent orders
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (recentOrders.length === 0) {
      console.log('❌ No orders found in database');
      process.exit(0);
    }

    console.log(`📋 Found ${recentOrders.length} recent orders\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    recentOrders.forEach((order, idx) => {
      console.log(`\n[${idx + 1}] Order: ${order.orderNumber}`);
      console.log(`    Email: ${order.email}`);
      console.log(`    Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log(`    Status: ${order.status}`);
      
      // Check orderType
      console.log(`    ├─ orderType: ${order.orderType || '❌ MISSING'}`);
      
      // Check items
      if (order.items && Array.isArray(order.items)) {
        console.log(`    ├─ Items (${order.items.length}):`);
        order.items.forEach((item, i) => {
          const mode = item.mode || '❌ MISSING';
          const modeEmoji = mode === 'rent' ? '🔄' : mode === 'buy' ? '🛍️' : '❓';
          console.log(`    │  [${i + 1}] ${item.name || 'Unknown'}`);
          console.log(`    │      mode: ${modeEmoji} ${mode}`);
          console.log(`    │      qty: ${item.quantity} × ₦${item.price}`);
          console.log(`    │      rentalDays: ${item.rentalDays || 0}`);
        });
      } else {
        console.log(`    ├─ Items: ❌ MISSING`);
      }

      // Check rental details
      console.log(`    ├─ Rental Fields:`);
      console.log(`    │  rentalSchedule: ${order.rentalSchedule ? '✓ Present' : '❌ Missing'}`);
      console.log(`    │  cautionFee: ${order.cautionFee || 'None'}`);

      // Check total
      console.log(`    └─ Total: ₦${order.total}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ANALYSIS
    console.log('🔍 ANALYSIS:\n');
    
    let missingOrderType = 0;
    let missingItemMode = 0;
    let correctType = 0;

    recentOrders.forEach((order) => {
      if (!order.orderType) {
        missingOrderType++;
      } else {
        correctType++;
      }

      if (order.items) {
        order.items.forEach((item) => {
          if (!item.mode) {
            missingItemMode++;
          }
        });
      }
    });

    console.log(`✓ Orders with orderType: ${correctType}/${recentOrders.length}`);
    console.log(`❌ Orders without orderType: ${missingOrderType}/${recentOrders.length}`);
    console.log(`❌ Items without mode: ${missingItemMode}`);

    if (missingOrderType > 0) {
      console.log('\n⚠️  PROBLEM FOUND: orderType not being set on new orders');
    }
    
    if (missingItemMode > 0) {
      console.log('⚠️  PROBLEM FOUND: Items missing mode field');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

diagnoseOrders();
