// Delete all expenses and related financial records
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function deleteAllExpenses() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('\n' + '═'.repeat(80));
    console.log('🗑️  DELETING ALL EXPENSES AND FINANCIAL RECORDS');
    console.log('═'.repeat(80) + '\n');
    
    // Financial/expense collections to DELETE
    const financeCollections = [
      'expenses',
      'dailyexpenses',
      'daily_expenses',
      'vathistories',
      'vat_histories',
    ];
    
    console.log('📡 Connected to MongoDB\n');
    
    let totalDeleted = 0;
    
    for (const collName of financeCollections) {
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      
      if (count > 0) {
        console.log(`📋 ${collName}:`);
        console.log(`   Documents to delete: ${count}`);
        
        // Show sample before deletion
        const sample = await collection.findOne({});
        console.log(`   Sample: ${JSON.stringify(sample).substring(0, 120)}...`);
        
        // Delete all
        const result = await collection.deleteMany({});
        console.log(`   ✅ DELETED: ${result.deletedCount} documents\n`);
        totalDeleted += result.deletedCount;
      }
    }
    
    console.log('═'.repeat(80));
    console.log('✅ VERIFICATION');
    console.log('═'.repeat(80) + '\n');
    
    // Verify
    for (const collName of financeCollections) {
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      const status = count === 0 ? '✅ EMPTY' : `❌ ${count} documents left`;
      console.log(`${collName}: ${status}`);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log(`✅ Total deleted: ${totalDeleted} documents`);
    console.log(`✅ All expense and financial records removed`);
    console.log('═'.repeat(80) + '\n');
    
    await client.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

deleteAllExpenses();
