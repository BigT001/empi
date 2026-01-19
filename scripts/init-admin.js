const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
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
    lastLogin: Date,
  },
  { timestamps: true }
);

const Admin = mongoose.model('Admin', adminSchema);

async function initializeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    // Check if super_admin already exists
    const existingAdmin = await Admin.findOne({ role: 'super_admin' });

    if (existingAdmin) {
      console.log('✅ Super admin already exists:', existingAdmin.email);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create super admin using raw bcrypt
    const bcrypt = require('bcryptjs');
    const adminPassword = process.env.ADMIN_PASSWORD || 'Mastercode@empicostumes';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@empicostumes.com';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const superAdmin = new Admin({
      email: adminEmail,
      password: hashedPassword,
      fullName: 'Admin',
      role: 'super_admin',
      permissions: [
        'view_dashboard',
        'view_products',
        'view_orders',
        'view_finance',
        'view_invoices',
        'view_settings',
        'manage_admins',
        'manage_permissions',
      ],
      isActive: true,
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error.message);
    process.exit(1);
  }
}

initializeAdmin();
