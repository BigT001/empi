const mongoose = require('mongoose');
require('dotenv').config();

async function checkAdminStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const admins = await db.collection('admins').find({}).toArray();
    console.log('\n===== ADMIN STATUS =====');
    console.log(`Total admins: ${admins.length}\n`);
    
    if (admins.length > 0) {
      admins.forEach((admin, i) => {
        console.log(`${i+1}. ${admin.email} (${admin.role})`);
      });
    } else {
      console.log('❌ NO ADMINS FOUND - Database is empty!');
    }
    
    console.log('========================\n');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdminStatus();
