// Delete ALL transaction records with full logging
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function deleteAllTransactions() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('\n═'.repeat(70));
    console.log('🗑️  DELETING ALL TRANSACTION RECORDS - CLEAN SLATE');
    console.log('═'.repeat(70));
    
    console.log('\n📡 Connected to MongoDB');
    console.log(`🔗 Database: ${db.name}\n`);
    
    // Show current state
    console.log('📊 CURRENT DATABASE STATE:');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).sort();
    
    for (const collName of collectionNames) {
      const count = await db.collection(collName).countDocuments();
      console.log(`   ${collName}: ${count} documents`);
    }
    
    // Transaction collections to DELETE
    const transactionCollections = [
      'orders',
      'invoices',
      'cautionfeetransactions',
      'customorders',
      'custom_orders',
    ];
    
    console.log('\n' + '═'.repeat(70));
    console.log('🚨 STARTING DELETION PROCESS');
    console.log('═'.repeat(70));
    
    let totalDeleted = 0;
    
    for (const collName of transactionCollections) {
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      
      if (count > 0) {
        // Show sample documents before deletion
        const sample = await collection.findOne({});
        console.log(`\n📋 ${collName}:`);
        console.log(`   Documents to delete: ${count}`);
        console.log(`   Sample: ${JSON.stringify(sample).substring(0, 100)}...`);
        
        // Delete all
        const result = await collection.deleteMany({});
        console.log(`   ✅ DELETED: ${result.deletedCount} documents`);
        totalDeleted += result.deletedCount;
      } else {
        console.log(`\n📋 ${collName}: Already empty (0 documents)`);
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ DELETION COMPLETE - VERIFYING');
    console.log('═'.repeat(70));
    
    // Verify deletion
    console.log('\n📊 FINAL DATABASE STATE:');
    const finalCollections = await db.listCollections().toArray();
    
    for (const collName of transactionCollections) {
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      const status = count === 0 ? '✅ EMPTY' : `❌ STILL HAS ${count} DOCUMENTS`;
      console.log(`   ${collName}: ${status}`);
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('📈 SUMMARY');
    console.log('═'.repeat(70));
    console.log(`✅ Total documents deleted: ${totalDeleted}`);
    console.log(`✅ All transaction records removed`);
    console.log(`✅ Database ready for fresh production data\n`);
    
    await client.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

deleteAllTransactions();
