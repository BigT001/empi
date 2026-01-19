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
      default: [],
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    department: { type: String, enum: ['general', 'finance', 'logistics'], default: 'general' },
  },
  { timestamps: true }
);

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

async function checkAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all admins
    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admin(s) in database:\n`);

    if (admins.length === 0) {
      console.log('❌ No admins found! You need to run: node scripts/update-admin.js\n');
    } else {
      for (const admin of admins) {
        console.log('═'.repeat(60));
        console.log(`📧 Email: ${admin.email}`);
        console.log(`👤 Name: ${admin.fullName}`);
        console.log(`🔐 Role: ${admin.role}`);
        console.log(`🏢 Department: ${admin.department}`);
        console.log(`✅ Active: ${admin.isActive}`);
        console.log(`🛡️ Permissions: ${admin.permissions.join(', ') || 'None'}`);
        console.log(`🔑 Password Hash: ${admin.password.substring(0, 20)}...`);
        console.log(`📅 Created: ${admin.createdAt}`);
        console.log(`📅 Updated: ${admin.updatedAt}`);
        
        // Test password comparison
        console.log('\n🔐 Password Test:');
        
        // Determine expected password based on role
        let expectedPassword = '';
        if (admin.email === 'admin@empicostumes.com') {
          expectedPassword = process.env.ADMIN_PASSWORD || 'Mastercode@empicostumes';
        } else if (admin.email === 'finance@empicostumes.com') {
          expectedPassword = 'Finance009206';
        } else if (admin.email === 'logistics@empicostumes.com') {
          expectedPassword = 'Logistics009206';
        }
        
        if (expectedPassword) {
          const isMatch = await admin.comparePassword(expectedPassword);
          console.log(`   Trying password: "${expectedPassword}"`);
          console.log(`   Match result: ${isMatch ? '✅ PASSWORD CORRECT' : '❌ PASSWORD INCORRECT'}`);
        }
        
        console.log('');
      }
    }

    console.log('═'.repeat(60));
    console.log('\n📋 NEXT STEPS:\n');
    
    if (admins.length === 0) {
      console.log('1. Run: node scripts/update-admin.js');
      console.log('2. This will create all three admin users');
      console.log('3. Then run this diagnostic again: node check-admin-users.js\n');
    } else {
      console.log('1. Try logging in with one of the credentials above');
      console.log('2. Make sure the password matches exactly (case-sensitive)');
      console.log('3. If still failing, check the browser console for more details\n');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admins:', error.message);
    process.exit(1);
  }
}

checkAdmins();
