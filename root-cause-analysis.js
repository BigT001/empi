#!/usr/bin/env node

/**
 * ROOT CAUSE ANALYSIS
 * Identifies why user's purchase might be wrongly categorized
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function rootCauseAnalysis() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('empi');
    const ordersCollection = db.collection('orders');

    console.log('\n🔍 ROOT CAUSE ANALYSIS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get all orders sorted by date
    const allOrders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    if (allOrders.length === 0) {
      console.log('❌ NO ORDERS FOUND IN DATABASE\n');
      console.log('This means your purchase was NOT saved at all.');
      console.log('Possible causes:');
      console.log('  1. Payment verification failed');
      console.log('  2. Order save request failed');
      console.log('  3. Network error after checkout');
      console.log('\nCheck browser console for error messages during checkout\n');
      process.exit(0);
    }

    console.log(`📋 Found ${allOrders.length} orders\n`);

    let problemsFound = 0;

    allOrders.forEach((order, idx) => {
      console.log(`[${idx + 1}] ${order.orderNumber}`);
      console.log(`    Type: ${order.orderType || '❌ MISSING'}`);

      // Check for problems
      if (!order.orderType) {
        console.log(`    ❌ PROBLEM: No orderType field!`);
        problemsFound++;
      }

      if (!order.items || order.items.length === 0) {
        console.log(`    ❌ PROBLEM: No items!`);
        problemsFound++;
      } else {
        let itemProblems = 0;
        order.items.forEach((item, i) => {
          if (!item.mode) {
            console.log(`    ❌ PROBLEM: Item ${i + 1} ("${item.name}") has NO mode field!`);
            itemProblems++;
            problemsFound++;
          }
        });

        if (itemProblems === 0) {
          console.log(`    ✓ ${order.items.length} items with modes: ${order.items.map(i => i.mode).join(', ')}`);
        }
      }

      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (problemsFound === 0) {
      console.log('✅ NO PROBLEMS FOUND');
      console.log('All orders have proper orderType and item modes.\n');
      console.log('The system is working correctly!');
      console.log('Check the dashboard - it should show sales/rental breakdown.\n');
    } else {
      console.log(`❌ PROBLEMS FOUND: ${problemsFound}\n`);
      console.log('Likely causes:');
      console.log('  1. Old orders created before orderType field was added');
      console.log('  2. Checkout not sending mode field in items');
      console.log('  3. Order creation API not preserving mode field\n');
      console.log('SOLUTION: Run the migration script:');
      console.log('  npx ts-node migrate-order-types.js\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

rootCauseAnalysis();
