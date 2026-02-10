const mongoose = require('mongoose');
require('dotenv').config();

async function deleteTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/empi');
    console.log('✅ Connected to MongoDB');

    // Get the database connection
    const db = mongoose.connection.db;

    // Delete all users (buyers collection)
    const buyersResult = await db.collection('buyers').deleteMany({});
    console.log(`✅ Deleted ${buyersResult.deletedCount} users from buyers collection`);

    // Delete all admins (if needed)
    const adminsResult = await db.collection('admins').deleteMany({});
    console.log(`✅ Deleted ${adminsResult.deletedCount} admins from admins collection`);

    console.log('\n✅ All test users have been successfully deleted!');
    console.log('📝 Database is now ready for fresh start.');

  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

deleteTestUsers();
