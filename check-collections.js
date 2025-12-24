// List all collections and check for stuck data
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function checkDB() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 Database Collections:\n');
    
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkDB();
