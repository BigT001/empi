require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    
    // List ALL databases
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    console.log('🗄️ ALL MONGODB DATABASES:\n');
    
    for (const db of databases.databases) {
      console.log(`📦 Database: "${db.name}"`);
      
      // List all collections in this database
      const dbClient = client.db(db.name);
      const collections = await dbClient.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('   └─ (empty)');
      } else {
        for (const col of collections) {
          const count = await dbClient.collection(col.name).countDocuments();
          if (count > 0) {
            console.log(`   ├─ ${col.name}: ${count} documents`);
          }
        }
      }
      console.log('');
    }
    
  } catch(err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
})();
