#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function deleteAllOrders() {
  try {
    console.log('🔗 Connecting to MongoDB...\n');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;

    // Delete from all possible order collections
    const collections = ['orders', 'unified_orders', 'unifiedorders', 'customorders', 'custom_orders'];
    
    console.log('🗑️  Deleting orders from all collections...\n');

    let totalDeleted = 0;

    for (const collName of collections) {
      try {
        const collection = db.collection(collName);
        const countBefore = await collection.countDocuments();
        
        if (countBefore > 0) {
          const result = await collection.deleteMany({});
          totalDeleted += result.deletedCount;
          console.log(`✅ "${collName}": Deleted ${result.deletedCount} documents (was ${countBefore})`);
        }
      } catch (e) {
        // Collection doesn't exist, skip
      }
    }

    console.log(`\n📊 TOTAL DELETED: ${totalDeleted} orders\n`);

    // Verify
    console.log('🔍 Verification:\n');
    for (const collName of collections) {
      try {
        const collection = db.collection(collName);
        const count = await collection.countDocuments();
        if (count >= 0) {
          console.log(`✓ "${collName}": ${count} documents remaining`);
        }
      } catch (e) {
        // Skip
      }
    }

    console.log('\n🚀 Database is now COMPLETELY CLEAN for production!\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAllOrders();
