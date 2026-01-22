require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    console.log('📊 AVAILABLE DATABASES:');
    databases.databases.forEach(db => console.log('  -', db.name));
    
    // Check empi database
    const empiDb = client.db('empi');
    const colls = await empiDb.listCollections().toArray();
    
    console.log('\n📦 COLLECTIONS IN empi DATABASE:');
    colls.forEach(c => console.log('  -', c.name));
    
    console.log('\n📈 DOCUMENT COUNTS:');
    for (const c of colls) {
      const count = await empiDb.collection(c.name).countDocuments();
      console.log(`  ${c.name}: ${count} documents`);
    }
    
    // Also check system collections
    console.log('\n🔍 CHECKING FOR DATA IN TOP COLLECTIONS:');
    const topColls = ['orders', 'customorders', 'unifiedorders', 'invoices', 'expenses', 'cautionfeetransactions'];
    for (const collName of topColls) {
      const coll = empiDb.collection(collName);
      const count = await coll.countDocuments();
      if (count > 0) {
        console.log(`  ⚠️ ${collName}: ${count} documents`);
        const sample = await coll.findOne({});
        console.log(`     Sample: ${JSON.stringify(sample).substring(0, 100)}...`);
      }
    }
    
  } catch(err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await client.close();
  }
})();
