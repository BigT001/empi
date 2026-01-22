require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🧹 COMPLETE DATABASE CLEANUP - ALL COLLECTIONS\n');
    
    const collectionsToDelete = [
      'orders',
      'customorders', 
      'unifiedorders',
      'invoices',
      'expenses',
      'cautionfeetransactions',
      'vatrecords',
      'transactions',
      'dailyexpenses'
    ];
    
    for (const collName of collectionsToDelete) {
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        
        if (count > 0) {
          const result = await coll.deleteMany({});
          console.log(`✅ Deleted ${result.deletedCount} documents from '${collName}'`);
        } else {
          console.log(`ℹ️ Collection '${collName}' was already empty`);
        }
      } catch (err) {
        // Collection might not exist, that's fine
        console.log(`ℹ️ Collection '${collName}' does not exist or error: ${err.message}`);
      }
    }
    
    console.log('\n📊 FINAL DATABASE STATE:\n');
    
    // Verify all collections are empty
    const allCollections = await db.listCollections().toArray();
    for (const col of allCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }
    
    console.log('\n✅ DATABASE COMPLETELY CLEARED - ALL FINANCIAL DATA REMOVED');
    
  } catch(err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
})();
