#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function checkOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('unified_orders');

    const allOrders = await ordersCollection.find({}).toArray();
    
    console.log(`\n📦 Total orders in database: ${allOrders.length}\n`);
    
    if (allOrders.length > 0) {
      console.log('Orders by status:');
      const byStatus = {};
      allOrders.forEach(order => {
        byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      });
      
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });

      console.log('\nAll Orders:');
      allOrders.forEach((order, i) => {
        console.log(`  ${i+1}. ${order.orderNumber} (${order.firstName || 'N/A'}) - Status: ${order.status}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkOrders();
