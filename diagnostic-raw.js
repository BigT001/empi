#!/usr/bin/env node

/**
 * Direct MongoDB diagnostic
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function diagnoseOrders() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('empi');
    const ordersCollection = db.collection('orders');

    console.log('✅ Connected to MongoDB\n');

    // Get 5 most recent orders
    const recentOrders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    if (recentOrders.length === 0) {
      console.log('❌ No orders found in database');
      process.exit(0);
    }

    console.log(`📋 Found ${recentOrders.length} recent orders\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    recentOrders.forEach((order, idx) => {
      console.log(`[${idx + 1}] Order: ${order.orderNumber}`);
      console.log(`    Email: ${order.email}`);
      console.log(`    Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log(`    Status: ${order.status}`);
      
      // Check orderType
      const orderType = order.orderType || '❌ MISSING';
      console.log(`    ├─ orderType: ${orderType}`);
      
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
      console.log(`    └─ Total: ₦${order.total}\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ANALYSIS
    console.log('🔍 ANALYSIS:\n');
    
    let missingOrderType = 0;
    let missingItemMode = 0;
    let correctType = 0;
    let itemsWithMode = 0;

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
          } else {
            itemsWithMode++;
          }
        });
      }
    });

    console.log(`✓ Orders with orderType: ${correctType}/${recentOrders.length}`);
    console.log(`❌ Orders without orderType: ${missingOrderType}/${recentOrders.length}`);
    console.log(`✓ Items with mode field: ${itemsWithMode}`);
    console.log(`❌ Items without mode: ${missingItemMode}`);

    if (missingOrderType > 0) {
      console.log('\n⚠️  PROBLEM #1: orderType not being set on new orders');
      console.log('   → New orders created without orderType field');
    }
    
    if (missingItemMode > 0) {
      console.log('\n⚠️  PROBLEM #2: Items missing mode field');
      console.log('   → Checkout not setting mode on items properly');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

diagnoseOrders();
