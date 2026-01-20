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

    // Find an active order
    const order = await ordersCollection.findOne({ isActive: true });
    if (!order) {
      console.log('❌ No active orders found');
      process.exit(1);
    }

    console.log('\n📊 Testing DELETE with actual order ID...\n');
    console.log('Order to test:', order.orderNumber);
    console.log('Order ID:', order._id);
    console.log('Order ID type:', typeof order._id);
    console.log('Order ID string:', String(order._id));

    // Test with the string version (as would come from API)
    const idString = String(order._id);
    console.log('\n🧪 Testing with ID as string from API...\n');
    console.log('ID string to use:', idString);

    // Convert back to ObjectId
    const idAsObjectId = new mongoose.Types.ObjectId(idString);
    console.log('ID as ObjectId:', idAsObjectId);

    // Test the update
    const result = await ordersCollection.updateOne(
      { _id: idAsObjectId },
      { 
        $set: {
          isActive: false, 
          deletedAt: new Date()
        }
      }
    );

    console.log('\nUpdate result:', result);
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully soft-deleted order');
      
      // Verify
      const updated = await ordersCollection.findOne({ _id: idAsObjectId });
      console.log('isActive:', updated.isActive);
      console.log('deletedAt:', updated.deletedAt);
      
      // Restore it
      console.log('\n♻️ Restoring order...');
      await ordersCollection.updateOne(
        { _id: idAsObjectId },
        { 
          $set: { isActive: true },
          $unset: { deletedAt: 1 }
        }
      );
      console.log('✅ Order restored');
    } else {
      console.log('❌ Update failed - no documents modified');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

main();
