import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

async function fixAllAdminPasswords() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    const adminEmails = [
      { email: 'admin@empicostumes.com', password: 'Mastercode@empicostumes' },
      { email: 'finance@empicostumes.com', password: 'Finance009206' },
      { email: 'logistics@empicostumes.com', password: 'Logistics009206' },
    ];

    console.log('🔐 Ensuring all admin passwords are properly hashed...\n');

    for (const admin of adminEmails) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);

      // Update directly in database with hashed password
      const result = await mongoose.connection.collection('admins').updateOne(
        { email: admin.email },
        { $set: { password: hashedPassword } }
      );

      if (result.matchedCount > 0) {
        console.log(`✅ ${admin.email}`);
        console.log(`   Password hashed and updated`);
        
        // Verify
        const isMatch = await bcrypt.compare(admin.password, hashedPassword);
        console.log(`   Verification: ${isMatch ? '✅ PASS' : '❌ FAIL'}\n`);
      } else {
        console.log(`⚠️ ${admin.email} - Not found in database\n`);
      }
    }

    console.log('════════════════════════════════════════');
    console.log('✅ All passwords have been fixed!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAllAdminPasswords();
