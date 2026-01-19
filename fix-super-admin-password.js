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

const Admin = mongoose.model('Admin', adminSchema);

async function fixSuperAdminPassword() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    const plainPassword = process.env.ADMIN_PASSWORD || 'Mastercode@empicostumes';
    
    // Hash the password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('🔐 Hashing Super Admin password...');
    console.log(`   Plain password: ${plainPassword}`);
    console.log(`   Hashed: ${hashedPassword}\n`);

    // Update the super admin with properly hashed password
    const result = await Admin.findOneAndUpdate(
      { email: 'admin@empicostumes.com' },
      { password: hashedPassword },
      { new: true }
    );

    if (!result) {
      console.log('❌ Super Admin not found!');
      process.exit(1);
    }

    console.log('✅ Super Admin password updated successfully!');
    console.log(`📧 Email: ${result.email}`);
    console.log(`👤 Name: ${result.fullName}`);
    console.log(`🔐 Role: ${result.role}`);
    console.log(`🛡️ Permissions: ${result.permissions.join(', ')}`);

    // Verify it works
    const verifyAdmin = await Admin.findOne({ email: 'admin@empicostumes.com' });
    const isPasswordCorrect = await bcrypt.compare(plainPassword, verifyAdmin.password);
    
    console.log('\n🔐 Password Verification:');
    console.log(`   Match result: ${isPasswordCorrect ? '✅ PASSWORD CORRECT' : '❌ PASSWORD INCORRECT'}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSuperAdminPassword();
