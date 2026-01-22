const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database collections...\n');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections:\n`);

    for (const collection of collections) {
      const collName = collection.name;
      const count = await db.collection(collName).countDocuments();
      console.log(`  • ${collName}: ${count} documents`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
