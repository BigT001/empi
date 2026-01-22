require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🧹 CLEANING UP ALL TRANSACTIONS AND DATA...\n');
    
    const collections = [
      'orders',
      'customorders', 
      'unifiedorders',
      'invoices',
      'expenses',
      'cautionfeetransactions'
    ];
    
    for (const collName of collections) {
      const coll = db.collection(collName);
      const count = await coll.countDocuments();
      
      if (count > 0) {
        const result = await coll.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} documents from '${collName}'`);
      } else {
        console.log(`ℹ️ Collection '${collName}' was already empty`);
      }
    }
    
    console.log('\n✅ DATABASE COMPLETELY CLEANED UP - READY FOR NEW TRANSACTIONS');
    
  } catch(err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
})();
