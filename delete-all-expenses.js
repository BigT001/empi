#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function deleteAllExpenses() {
  try {
    console.log('🔗 Connecting to MongoDB...\n');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;

    // Delete from expenses collection
    const expensesCollection = db.collection('expenses');
    
    const countBefore = await expensesCollection.countDocuments();
    console.log(`📊 Daily Expenses found: ${countBefore}\n`);

    if (countBefore > 0) {
      console.log('🗑️  Deleting all daily expenses...\n');
      const result = await expensesCollection.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} daily expense records\n`);
    } else {
      console.log('ℹ️  No expenses to delete\n');
    }

    // Verify
    const countAfter = await expensesCollection.countDocuments();
    console.log(`🔍 Verification: ${countAfter} expenses remaining\n`);
    
    if (countAfter === 0) {
      console.log('🚀 Daily Expenses are now completely CLEAN!\n');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAllExpenses();
