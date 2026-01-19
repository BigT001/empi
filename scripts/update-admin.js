import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'admin', 'finance_admin', 'logistics_admin'], default: 'admin' },
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
    department: { type: String, enum: ['general', 'finance', 'logistics'], default: 'general' },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

// Permission sets for each role
const PERMISSION_SETS = {
  super_admin: [
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
  ],
  finance_admin: [
    'view_dashboard',
    'view_finance',
    'view_invoices',
    'view_orders',
  ],
  logistics_admin: [
    'view_dashboard',
    'view_logistics',
    'view_orders',
  ],
};

async function setupAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');

    // Admin users to create/update
    const adminsToSetup = [
      {
        email: process.env.ADMIN_EMAIL || 'admin@empicostumes.com',
        fullName: 'Super Admin',
        password: process.env.ADMIN_PASSWORD || 'Mastercode@empicostumes',
        role: 'super_admin',
        department: 'general',
      },
      {
        email: 'finance@empicostumes.com',
        fullName: 'Finance Team Lead',
        password: 'Finance009206',
        role: 'finance_admin',
        department: 'finance',
      },
      {
        email: 'logistics@empicostumes.com',
        fullName: 'Logistics Team Lead',
        password: 'Logistics009206',
        role: 'logistics_admin',
        department: 'logistics',
      },
    ];

    console.log('\n📋 Setting up admin users...\n');

    for (const adminData of adminsToSetup) {
      try {
        const existingAdmin = await Admin.findOne({ email: adminData.email });
        const permissions = PERMISSION_SETS[adminData.role] || [];

        if (existingAdmin) {
          // Update existing admin - set isModified to ensure password hashing
          existingAdmin.fullName = adminData.fullName;
          existingAdmin.password = adminData.password;  // This will trigger pre-save hook
          existingAdmin.role = adminData.role;
          existingAdmin.department = adminData.department;
          existingAdmin.permissions = permissions;
          existingAdmin.isActive = true;

          await existingAdmin.save();

          console.log(`✅ Updated ${adminData.role}`);
          console.log(`   📧 Email: ${adminData.email}`);
          console.log(`   🔑 Password: ${adminData.password}`);
          console.log(`   👤 Name: ${existingAdmin.fullName}`);
          console.log(`   🔐 Role: ${existingAdmin.role}`);
          console.log(`   🛡️ Permissions: ${existingAdmin.permissions.join(', ')}`);
        } else {
          // Create new admin
          const newAdmin = new Admin({
            email: adminData.email,
            fullName: adminData.fullName,
            password: adminData.password,
            role: adminData.role,
            department: adminData.department,
            permissions: permissions,
            isActive: true,
          });

          await newAdmin.save();

          console.log(`✅ Created ${adminData.role}`);
          console.log(`   📧 Email: ${adminData.email}`);
          console.log(`   🔑 Password: ${adminData.password}`);
          console.log(`   👤 Name: ${newAdmin.fullName}`);
          console.log(`   🔐 Role: ${newAdmin.role}`);
          console.log(`   🛡️ Permissions: ${newAdmin.permissions.join(', ')}`);
        }
        console.log('');
      } catch (error) {
        console.error(`❌ Error setting up ${adminData.email}:`, error.message);
      }
    }

    console.log('=====================================');
    console.log('✅ Admin setup completed successfully!');
    console.log('=====================================');
    console.log('\n📝 Login Credentials:\n');
    console.log('Super Admin:');
    console.log('  Email: admin@empicostumes.com');
    console.log('  Password: Mastercode@empicostumes');
    console.log('  Access: All features\n');
    console.log('Finance Admin:');
    console.log('  Email: finance@empicostumes.com');
    console.log('  Password: Finance009206');
    console.log('  Access: Finance dashboard only\n');
    console.log('Logistics Admin:');
    console.log('  Email: logistics@empicostumes.com');
    console.log('  Password: Logistics009206');
    console.log('  Access: Logistics dashboard only\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admins:', error.message);
    process.exit(1);
  }
}

setupAdmins();
