const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function cleanDatabase() {
  try {
    console.log('🧹 Starting clean sweep of transaction data...\n');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    const collectionsToClean = [
      'unifiedorders',
      'orders',
      'customorders',
      'custom_orders',
      'expenses',
      'cautionfeetransactions',
      'invoices',
      'messages',
      'notifications',
      'buyers',
    ];

    console.log('🗑️  Deleting documents...\n');
    for (const collName of collectionsToClean) {
      try {
        const result = await db.collection(collName).deleteMany({});
        if (result.deletedCount > 0) {
          console.log(`  ✅ ${collName}: Deleted ${result.deletedCount} documents`);
        }
      } catch (e) {
        // Collection doesn't exist, skip
      }
    }

    console.log('\n✅ Clean sweep complete!');
    console.log('📊 All transaction data removed');
    console.log('🧪 Dashboard should now show ₦0 for all metrics\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
