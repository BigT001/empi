require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 SCANNING ALL COLLECTIONS IN empi:');
    
    const allCollections = await db.listCollections().toArray();
    console.log(`Total collections: ${allCollections.length}\n`);
    
    for (const coll of allCollections) {
      const name = coll.name;
      const collection = db.collection(name);
      const count = await collection.countDocuments();
      
      console.log(`${name}: ${count} documents`);
      
      if (count > 0) {
        const sample = await collection.findOne({});
        console.log(`  └─ Sample keys: ${Object.keys(sample).join(', ')}`);
      }
    }
    
  } catch(err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.close();
  }
})();
