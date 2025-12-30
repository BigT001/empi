const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

const customOrderSchema = new mongoose.Schema({}, { strict: false });
const CustomOrder = mongoose.model('CustomOrder', customOrderSchema, 'customorders');

async function deleteAllCustomOrders() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get count before deletion
    const customOrderCount = await CustomOrder.countDocuments();

    console.log(`\n📊 Data to be deleted:`);
    console.log(`  - Custom Orders: ${customOrderCount}`);

    if (customOrderCount === 0) {
      console.log('\n⚠️  No custom orders found to delete');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete all custom orders!');
    console.log('Run with --confirm flag to proceed: node cleanup-delete-all-custom-orders.js --confirm\n');

    if (process.argv[2] !== '--confirm') {
      console.log('❌ Deletion cancelled. Add --confirm flag to proceed.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Delete all custom orders
    console.log('\n🗑️  Deleting all custom orders...');
    const deleteResult = await CustomOrder.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} custom orders`);

    console.log('\n✅ All custom orders have been successfully deleted!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during deletion:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

deleteAllCustomOrders();
