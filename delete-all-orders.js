#!/usr/bin/env node

/**
 * Simple script to delete ALL orders from database
 * Cleans up all test data for production ready state
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function deleteAllOrders() {
  try {
    console.log('🔗 Connecting to MongoDB...\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('unified_orders');

    // Get total count before deletion
    const totalBefore = await ordersCollection.countDocuments();
    console.log(`📊 Total orders in database: ${totalBefore}\n`);

    // Delete ALL orders regardless of status
    console.log('🗑️  Deleting all orders...');
    const result = await ordersCollection.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} orders!\n`);

    // Verify deletion
    const totalAfter = await ordersCollection.countDocuments();
    console.log(`📊 Orders remaining: ${totalAfter}`);
    console.log('\n🚀 Database is now clean for production!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

// Run it
deleteAllOrders();
