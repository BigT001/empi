require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 DIAGNOSTIC SCAN - FINDING ALL DATA\n');
    
    // Get ALL collections
    const allCollections = await db.listCollections().toArray();
    
    console.log(`Total collections found: ${allCollections.length}\n`);
    
    for (const col of allCollections) {
      const collName = col.name;
      const coll = db.collection(collName);
      const count = await coll.countDocuments();
      
      if (count > 0) {
        console.log(`📊 ${collName}: ${count} documents`);
        
        // Get first document to see structure
        const sample = await coll.findOne({});
        if (sample) {
          console.log(`   Keys: ${Object.keys(sample).join(', ')}`);
          console.log(`   Sample: ${JSON.stringify(sample).substring(0, 150)}...`);
        }
        
        // Special checks for offline data
        if (collName === 'orders') {
          const offline = await coll.countDocuments({ isOffline: true });
          const online = await coll.countDocuments({ isOffline: false });
          const noFlag = await coll.countDocuments({ isOffline: { $exists: false } });
          console.log(`   ├─ isOffline=true: ${offline}`);
          console.log(`   ├─ isOffline=false: ${online}`);
          console.log(`   └─ No isOffline flag: ${noFlag}`);
        }
        console.log('');
      }
    }
    
    // Also check for any collection with "offline" in name
    console.log('\n🔎 Searching for collections with "offline" in name:');
    const offlineColls = allCollections.filter(c => c.name.toLowerCase().includes('offline'));
    if (offlineColls.length > 0) {
      for (const col of offlineColls) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  Found: ${col.name} (${count} documents)`);
      }
    } else {
      console.log('  None found');
    }
    
  } catch(err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
})();
