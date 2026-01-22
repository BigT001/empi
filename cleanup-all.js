const mongoose = require('mongoose');
const path = require('path');

// MongoDB connection
const mongoUri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database\n');

    const collections = [
      'Order',
      'UnifiedOrder',
      'CustomOrder',
      'Expense',
      'CautionFeeTransaction',
      'Message',
      'offlineorder',
    ];

    for (const collectionName of collections) {
      try {
        const result = await mongoose.connection.collection(collectionName).deleteMany({});
        console.log(`🗑️  ${collectionName}: Deleted ${result.deletedCount} records`);
      } catch (error) {
        console.log(`⚠️  ${collectionName}: Skipped (collection may not exist or be empty)`);
      }
    }

    console.log('\n✅ Database cleanup complete!');
    console.log('📊 Dashboard should now show ₦0 for all metrics');
    console.log('🧪 Ready for fresh testing\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

cleanupDatabase();
