#!/usr/bin/env node

/**
 * Test: Check what the analytics calculates for the test orders
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testAnalytics() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('empi');
    const ordersCollection = db.collection('orders');

    console.log('📊 Analyzing orders for dashboard metrics...\n');

    // Get all orders
    const allOrders = await ordersCollection.find({}).toArray();
    console.log(`Total orders: ${allOrders.length}\n`);

    let totalRevenue = 0;
    let totalSalesRevenue = 0;
    let totalRentalRevenue = 0;
    let salesOrderCount = 0;
    let rentalOrderCount = 0;

    allOrders.forEach((order) => {
      const total = order.total || 0;
      totalRevenue += total;

      const oType = (order.orderType || 'sales').toLowerCase();
      const hasRental = oType === 'rental' || oType === 'mixed';
      const hasSale = oType === 'sales' || oType === 'mixed';

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const itemRevenue = (item.price || 0) * (item.quantity || 1);

          if (item.mode === 'rent' || item.rentalDays) {
            totalRentalRevenue += itemRevenue;
          } else {
            totalSalesRevenue += itemRevenue;
          }
        });
      }

      if (hasRental) rentalOrderCount++;
      if (hasSale) salesOrderCount++;
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📈 DASHBOARD METRICS:\n');
    console.log(`  Total Revenue:          ₦${totalRevenue.toLocaleString()}`);
    console.log(`  Sales Revenue:          ₦${totalSalesRevenue.toLocaleString()}`);
    console.log(`  Rental Revenue:         ₦${totalRentalRevenue.toLocaleString()}`);
    console.log(`\n  Sales Orders:           ${salesOrderCount}`);
    console.log(`  Rental Orders:          ${rentalOrderCount}`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (totalSalesRevenue > 0 && totalRentalRevenue > 0) {
      console.log('✅ SYSTEM WORKING CORRECTLY');
      console.log('   Both sales and rental revenues are being tracked!');
    } else if (totalSalesRevenue > 0) {
      console.log('⚠️  Only sales revenue detected');
    } else if (totalRentalRevenue > 0) {
      console.log('❌ PROBLEM: Only rental revenue, no sales detected');
    } else {
      console.log('❌ PROBLEM: No revenue detected at all');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Show detailed breakdown
    console.log('📋 DETAILED ORDER BREAKDOWN:\n');
    allOrders.forEach((order) => {
      console.log(`Order: ${order.orderNumber}`);
      console.log(`  Type: ${order.orderType || 'unknown'}`);
      console.log(`  Total: ₦${order.total}`);
      console.log(`  Items:`);
      if (order.items) {
        order.items.forEach((item) => {
          console.log(
            `    - ${item.name} (mode: ${item.mode}, qty: ${item.quantity}, price: ₦${item.price})`
          );
        });
      }
      console.log('');
    });

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testAnalytics();
