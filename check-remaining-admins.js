const mongoose = require('mongoose');
require('dotenv').config();

async function checkAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/empi');
    console.log('✅ Connected to MongoDB');

    // Get the database connection
    const db = mongoose.connection.db;

    // Fetch all admins
    const admins = await db.collection('admins').find({}).toArray();
    
    console.log(`\n📋 Total Admins in Database: ${admins.length}\n`);
    
    if (admins.length === 0) {
      console.log('⚠️  No admins found in database!');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Name: ${admin.name || 'N/A'}`);
        console.log(`   Status: ${admin.isActive ? 'Active' : 'Inactive'}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('❌ Error checking admins:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkAdmins();
