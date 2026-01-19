import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

async function clearModelCache() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Delete the old Admin model from Mongoose cache if it exists
    if (mongoose.models.Admin) {
      delete mongoose.models.Admin;
      console.log('🗑️ Cleared cached Admin model from Mongoose\n');
    }

    // Now get a fresh instance
    const { default: Admin } = await import('./lib/models/Admin.ts', { assert: { type: 'module' } });
    
    console.log('📋 Testing fresh Admin model...\n');

    // Test creating a new admin with finance_admin role
    const testAdmin = new Admin({
      email: 'test-finance@empicostumes.com',
      fullName: 'Test Finance',
      password: 'TestPassword123!',
      role: 'finance_admin',
      department: 'finance',
      permissions: ['view_dashboard', 'view_finance'],
      isActive: true,
    });

    console.log('✅ Created admin object with role: finance_admin');
    console.log(`   Email: ${testAdmin.email}`);
    console.log(`   Role: ${testAdmin.role}`);
    console.log(`   Department: ${testAdmin.department}`);
    console.log(`   Permissions: ${testAdmin.permissions.join(', ')}\n`);

    // Try to validate
    const validationError = testAdmin.validateSync();
    if (validationError) {
      console.log('❌ Validation Error:', validationError.message);
    } else {
      console.log('✅ Validation passed!\n');
    }

    // Check the schema
    const schema = Admin.schema;
    console.log('📊 Schema role enum values:');
    console.log(`   ${JSON.stringify(schema.path('role').enumValues)}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearModelCache();
