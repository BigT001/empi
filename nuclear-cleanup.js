require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔥 COMPLETE NUCLEAR CLEANUP - DELETING ALL DATA FROM ALL COLLECTIONS\n');
    
    // Get ALL collections
    const allCollections = await db.listCollections().toArray();
    
    console.log(`Found ${allCollections.length} total collections\n`);
    console.log('Deleting from ALL collections...\n');
    
    let totalDeleted = 0;
    
    for (const col of allCollections) {
      const collName = col.name;
      
      // Skip system collections
      if (collName.startsWith('system.')) {
        console.log(`⏭️ Skipping system collection: ${collName}`);
        continue;
      }
      
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        
        if (count > 0) {
          const result = await coll.deleteMany({});
          console.log(`✅ ${collName}: deleted ${result.deletedCount} documents`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`ℹ️ ${collName}: already empty`);
        }
      } catch (err) {
        console.log(`⚠️ ${collName}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 VERIFICATION - FINAL STATE:\n`);
    
    const finalCollections = await db.listCollections().toArray();
    let remainingDocs = 0;
    
    for (const col of finalCollections) {
      if (!col.name.startsWith('system.')) {
        const count = await db.collection(col.name).countDocuments();
        if (count > 0) {
          console.log(`⚠️ ${col.name}: ${count} documents remaining`);
          remainingDocs += count;
        } else {
          console.log(`✅ ${col.name}: 0 documents`);
        }
      }
    }
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`  Total documents deleted: ${totalDeleted}`);
    console.log(`  Documents remaining: ${remainingDocs}`);
    console.log(`\n✅ DATABASE COMPLETELY WIPED - ALL DATA DESTROYED`);
    
  } catch(err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
})();
