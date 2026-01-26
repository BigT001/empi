#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function checkAllCollections() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    console.log('\n📋 Collections in database:\n');
    
    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(c => console.log(`  - ${c.name}`));

    // Check multiple possible order collections
    const orderCollections = ['unified_orders', 'orders', 'customorders', 'rental_orders', 'Orders'];
    
    console.log('\n\n🔍 Checking all possible order collections:\n');

    for (const collName of orderCollections) {
      try {
        const collection = db.collection(collName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`✅ Found ${count} orders in "${collName}" collection:`);
          const orders = await collection.find({}).limit(10).toArray();
          orders.forEach((order, i) => {
            console.log(`   ${i+1}. ${order.orderNumber || order._id} - Status: ${order.status || 'N/A'}`);
          });
          console.log('');
        }
      } catch (e) {
        // Collection doesn't exist, skip
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllCollections();
