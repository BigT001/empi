const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Create main admin accounts
    const adminAccounts = [
      {
        email: 'admin@empi.com',
        password: 'Admin@123456', // Change this to secure password
        name: 'Super Admin',
        role: 'super_admin',
        isActive: true,
        permissions: ['all']
      },
      {
        email: 'finance@empi.com',
        password: 'Finance@123456', // Change this to secure password
        name: 'Finance Admin',
        role: 'finance_admin',
        isActive: true,
        permissions: ['view_finance', 'view_invoices', 'view_orders']
      },
      {
        email: 'logistics@empi.com',
        password: 'Logistics@123456', // Change this to secure password
        name: 'Logistics Admin',
        role: 'logistics_admin',
        isActive: true,
        permissions: ['view_logistics', 'view_orders']
      }
    ];

    // Hash passwords and insert
    for (const account of adminAccounts) {
      const salt = await bcrypt.genSalt(10);
      account.password = await bcrypt.hash(account.password, salt);
      account.createdAt = new Date();
      account.updatedAt = new Date();
    }

    // Insert into database
    const result = await db.collection('admins').insertMany(adminAccounts);
    
    console.log('✅ Admin accounts created successfully!\n');
    console.log('📋 Created Admins:');
    adminAccounts.forEach((admin, i) => {
      console.log(`${i+1}. ${admin.email} (${admin.role})`);
    });
    
    console.log('\n⚠️  IMPORTANT - Save these credentials securely:');
    console.log('   Super Admin: admin@empi.com');
    console.log('   Finance Admin: finance@empi.com');
    console.log('   Logistics Admin: logistics@empi.com');
    console.log('\n💡 Remember to change passwords in production!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connection closed');
  }
}

initializeAdmins();
