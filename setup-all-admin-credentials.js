const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateAllAdminCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Define all admin accounts with correct credentials
    const adminAccounts = [
      {
        email: 'admin@empicostumes.com',
        password: 'Mastercode@empicostumes',
        name: 'Super Admin',
        role: 'super_admin',
        isActive: true,
        permissions: ['all']
      },
      {
        email: 'finance@empicostumes.com',
        password: 'Finance009206',
        name: 'Finance Admin',
        role: 'finance_admin',
        isActive: true,
        permissions: ['view_finance', 'view_invoices', 'view_orders']
      },
      {
        email: 'logistics@empicostumes.com',
        password: 'Logistics009206',
        name: 'Logistics Admin',
        role: 'logistics_admin',
        isActive: true,
        permissions: ['view_logistics', 'view_orders']
      }
    ];

    // Clear all admins first
    await db.collection('admins').deleteMany({});
    console.log('🗑️  Cleared all existing admins\n');

    // Hash passwords and insert
    for (const account of adminAccounts) {
      const salt = await bcrypt.genSalt(10);
      account.password = await bcrypt.hash(account.password, salt);
      account.createdAt = new Date();
      account.updatedAt = new Date();
    }

    const result = await db.collection('admins').insertMany(adminAccounts);
    console.log('✅ All admin accounts updated successfully!\n');
    
    console.log('📋 ADMIN CREDENTIALS:');
    console.log('═'.repeat(50));
    console.log('\n1️⃣  SUPER ADMIN');
    console.log('   Email: admin@empicostumes.com');
    console.log('   Password: Mastercode@empicostumes');
    console.log('   Access: Full Admin Access\n');
    
    console.log('2️⃣  FINANCE ADMIN');
    console.log('   Email: finance@empicostumes.com');
    console.log('   Password: Finance009206');
    console.log('   Access: Finance & Invoices\n');
    
    console.log('3️⃣  LOGISTICS ADMIN');
    console.log('   Email: logistics@empicostumes.com');
    console.log('   Password: Logistics009206');
    console.log('   Access: Logistics & Orders\n');
    
    console.log('═'.repeat(50));

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connection closed');
  }
}

updateAllAdminCredentials();
