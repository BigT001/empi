// List ALL collections with their document counts
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function listAllCollections() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('\n' + '═'.repeat(80));
    console.log('📊 ALL COLLECTIONS IN DATABASE');
    console.log('═'.repeat(80) + '\n');
    
    const collections = await db.listCollections().toArray();
    
    console.log(`Total collections: ${collections.length}\n`);
    
    for (const coll of collections) {
      const collection = db.collection(coll.name);
      const count = await collection.countDocuments();
      
      if (count > 0) {
        console.log(`📌 ${coll.name}: ${count} documents`);
        const sample = await collection.findOne({});
        console.log(`   ${JSON.stringify(sample).substring(0, 150)}...\n`);
      } else {
        console.log(`⊘ ${coll.name}: empty`);
      }
    }
    
    await client.close();
    process.exit(0);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

listAllCollections();
