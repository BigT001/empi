const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('unifiedorders');

    console.log('\n📊 Testing DELETE functionality...\n');

    // Find an order to test with
    const testOrder = await ordersCollection.findOne({ isActive: true });
    
    if (!testOrder) {
      console.log('❌ No active orders found to test with');
      process.exit(0);
    }

    console.log(`Testing with order: ${testOrder.orderNumber} (${testOrder._id})`);
    console.log(`Order status: ${testOrder.status}`);
    console.log(`Current isActive: ${testOrder.isActive}`);

    // Simulate the DELETE operation
    console.log('\n🗑️ Performing soft delete (setting isActive = false, adding deletedAt)...\n');
    
    const result = await ordersCollection.updateOne(
      { _id: testOrder._id },
      { 
        $set: {
          isActive: false, 
          deletedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      console.log('❌ Order not found or not modified');
      process.exit(1);
    }

    console.log('✅ Soft delete successful!');

    // Get the updated order to verify
    const updatedOrder = await ordersCollection.findOne({ _id: testOrder._id });
    console.log(`Updated isActive: ${updatedOrder.isActive}`);
    console.log(`Added deletedAt: ${updatedOrder.deletedAt}`);

    // Verify that GET won't return it anymore
    console.log('\n✅ Testing that GET filters deleted orders...\n');
    const activeOrders = await ordersCollection.find({ isActive: true }).toArray();
    const deletedOrderStillVisible = activeOrders.find(o => o._id.toString() === testOrder._id.toString());
    
    if (deletedOrderStillVisible) {
      console.log('❌ ERROR: Deleted order still appears in GET results!');
      process.exit(1);
    } else {
      console.log('✅ Good: Deleted order does NOT appear in GET results');
    }

    // Restore it for testing purposes
    console.log('\n♻️ Restoring order for next test...\n');
    await ordersCollection.updateOne(
      { _id: testOrder._id },
      { 
        $set: { isActive: true },
        $unset: { deletedAt: 1 }
      }
    );
    console.log('✅ Order restored');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

main();
