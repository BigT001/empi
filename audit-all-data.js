// Comprehensive database audit - check ALL collections
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function auditDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 COMPREHENSIVE DATABASE AUDIT - ALL COLLECTIONS');
    console.log('═'.repeat(80) + '\n');
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).sort();
    
    console.log(`Total Collections: ${collectionNames.length}\n`);
    
    let totalDocuments = 0;
    let transactionCollections = [];
    
    for (const collName of collectionNames) {
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      totalDocuments += count;
      
      console.log(`\n📋 Collection: ${collName}`);
      console.log('─'.repeat(80));
      console.log(`   Document Count: ${count}`);
      
      if (count > 0) {
        // Get sample documents
        const sample = await collection.findOne({});
        console.log(`   Sample Document (first 150 chars):`);
        console.log(`   ${JSON.stringify(sample).substring(0, 150)}...`);
        
        // Check if this is a transaction-related collection
        const transactionRelated = [
          'orders', 'invoices', 'cautionfeetransactions', 
          'customorders', 'custom_orders'
        ];
        
        if (transactionRelated.includes(collName.toLowerCase())) {
          transactionCollections.push({ name: collName, count });
          console.log(`   ⚠️  TRANSACTION COLLECTION (still has data)`);
        }
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total documents across all collections: ${totalDocuments}\n`);
    
    if (transactionCollections.length > 0) {
      console.log(`❌ TRANSACTION COLLECTIONS WITH DATA:`);
      transactionCollections.forEach(tc => {
        console.log(`   - ${tc.name}: ${tc.count} documents`);
      });
    } else {
      console.log(`✅ ALL TRANSACTION COLLECTIONS ARE EMPTY`);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 DETAILED VIEW - COLLECTIONS WITH DATA');
    console.log('═'.repeat(80) + '\n');
    
    for (const collName of collectionNames) {
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      
      if (count > 0) {
        console.log(`\n📌 ${collName.toUpperCase()} (${count} documents)`);
        console.log('─'.repeat(80));
        
        // Get sample documents
        const docs = await collection.find({}).limit(3).toArray();
        docs.forEach((doc, idx) => {
          console.log(`   [${idx + 1}] ${JSON.stringify(doc).substring(0, 200)}...`);
        });
      }
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    await client.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

auditDatabase();
