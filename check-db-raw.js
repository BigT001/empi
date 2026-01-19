import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

async function checkDatabase() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Get raw admins from database (no model validation)
    const admins = await mongoose.connection.collection('admins').find({}).toArray();
    
    console.log(`📊 Raw database records (${admins.length} total):\n`);

    for (const admin of admins) {
      console.log('═'.repeat(60));
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Name: ${admin.fullName}`);
      console.log(`🔐 Role stored in DB: "${admin.role}" (type: ${typeof admin.role})`);
      console.log(`🏢 Department: ${admin.department}`);
      console.log(`✅ Active: ${admin.isActive}`);
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('\nℹ️ If you see roles like "finance_admin", "logistics_admin" above,');
    console.log('the data is correct. The issue is with the model schema.\n');

    // Now check what the current model thinks are valid roles
    const { default: Admin } = await import('./lib/models/Admin.ts', { assert: { type: 'module' } });
    const schema = Admin.schema;
    const roleEnumValues = schema.path('role').enumValues;

    console.log('✅ Current Model Enum Values for "role":');
    console.log(`   ${JSON.stringify(roleEnumValues)}\n`);

    if (roleEnumValues.includes('finance_admin') && roleEnumValues.includes('logistics_admin')) {
      console.log('✅ Model correctly includes finance_admin and logistics_admin\n');
    } else {
      console.log('❌ Model is missing finance_admin and/or logistics_admin\n');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
