const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function clearBuyers() {
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI environment variable is not set!');
    process.exit(1);
  }

  try {
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const buyersCollection = db.collection('buyers');

    // Get count before deletion
    const countBefore = await buyersCollection.countDocuments();
    console.log(`📊 Current buyers in database: ${countBefore}`);

    if (countBefore === 0) {
      console.log('✅ Database is already empty. No users to delete.\n');
    } else {
      console.log('\n⚠️  Deleting all buyers...');
      const result = await buyersCollection.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} users from the database\n`);

      // Verify deletion
      const countAfter = await buyersCollection.countDocuments();
      console.log(`✅ Verification: ${countAfter} buyers remaining in database\n`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearBuyers();
