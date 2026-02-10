const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateAdminCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Create the correct admin account
    const superAdmin = {
      email: 'admin@empicostumes.com',
      password: 'Mastercode@empicostumes',
      name: 'Super Admin',
      role: 'super_admin',
      isActive: true,
      permissions: ['all'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    superAdmin.password = await bcrypt.hash(superAdmin.password, salt);

    // Delete old wrong email admin
    await db.collection('admins').deleteOne({ email: 'admin@empi.com' });
    console.log('❌ Deleted incorrect admin: admin@empi.com');

    // Insert correct admin
    await db.collection('admins').insertOne(superAdmin);
    console.log('✅ Created correct Super Admin account\n');
    
    // Keep finance and logistics admins as they are
    console.log('📋 Updated Admin Credentials:');
    console.log('   Super Admin: admin@empicostumes.com');
    console.log('   Password: Mastercode@empicostumes\n');
    
    console.log('🔑 Other Admins (unchanged):');
    console.log('   Finance Admin: finance@empi.com');
    console.log('   Logistics Admin: logistics@empi.com\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connection closed');
  }
}

updateAdminCredentials();
