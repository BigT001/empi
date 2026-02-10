const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'finance_admin', 'logistics_admin'],
    default: 'admin',
    required: true,
  },
  permissions: {
    type: [String],
    default: [
      'view_dashboard',
      'view_products',
      'view_orders',
      'view_finance',
      'view_invoices',
      'view_settings',
    ],
  },
  isActive: { type: Boolean, default: true },
  department: {
    type: String,
    enum: ['general', 'finance', 'logistics'],
    default: 'general',
  },
  lastLogin: Date,
  lastLogout: Date,
  sessions: [
    {
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      lastActivity: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
    },
  ],
});

const Admin = mongoose.model('Admin', adminSchema);

// FULL permissions for super admin
const SUPER_ADMIN_PERMISSIONS = [
  'view_dashboard',
  'view_products',
  'view_orders',
  'view_finance',
  'view_invoices',
  'view_settings',
  'view_logistics',
  'manage_admins',
  'manage_store_settings',
  'access_all_features',
];

async function fixSuperAdminAccess() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    const email = 'admin@empicostumes.com';
    const password = 'Mastercode@empicostumes';

    // Find or create super admin
    let superAdmin = await Admin.findOne({ email });

    if (!superAdmin) {
      console.log('❌ Super admin not found. Creating new one...\n');
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      superAdmin = new Admin({
        email,
        password: hashedPassword,
        fullName: 'Super Admin',
        role: 'super_admin',
        permissions: SUPER_ADMIN_PERMISSIONS,
        isActive: true,
        department: 'general',
      });

      await superAdmin.save();
      console.log('✅ Super Admin Created!\n');
    } else {
      // Update existing super admin with FULL permissions
      console.log('📝 Updating existing super admin with full permissions...\n');

      const oldPermissions = superAdmin.permissions || [];
      superAdmin.permissions = SUPER_ADMIN_PERMISSIONS;
      superAdmin.role = 'super_admin';
      superAdmin.fullName = superAdmin.fullName || 'Super Admin'; // Ensure fullName is set
      superAdmin.isActive = true;

      await superAdmin.save();
      console.log('✅ Super Admin Updated!\n');

      console.log('📊 Permission Changes:');
      console.log('Before:', oldPermissions.join(', '));
      console.log('After: ', SUPER_ADMIN_PERMISSIONS.join(', '));
    }

    // Verify the update
    const verifiedAdmin = await Admin.findOne({ email });
    console.log('\n✅ Verification:');
    console.log('📧 Email:', verifiedAdmin.email);
    console.log('👤 Name:', verifiedAdmin.fullName);
    console.log('🔐 Role:', verifiedAdmin.role);
    console.log('🛡️  Permissions:', verifiedAdmin.permissions.join(', '));
    console.log('✔️  Active:', verifiedAdmin.isActive);

    console.log('\n🎯 Super Admin Now Has Access To:');
    console.log('  ✓ Dashboard');
    console.log('  ✓ Products Management');
    console.log('  ✓ Orders Management');
    console.log('  ✓ Finance Dashboard');
    console.log('  ✓ Invoices');
    console.log('  ✓ Settings');
    console.log('  ✓ Logistics');
    console.log('  ✓ Admin Management');
    console.log('  ✓ Store Settings');
    console.log('  ✓ All Features');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSuperAdminAccess();
