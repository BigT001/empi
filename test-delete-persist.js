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

    // Step 1: Find an active order
    console.log('\n📊 Step 1: Finding an active order...');
    const order = await ordersCollection.findOne({ isActive: true });
    
    if (!order) {
      console.log('❌ No active orders found to test with');
      process.exit(0);
    }

    const orderId = order._id.toString();
    console.log(`✅ Found order: ${order.orderNumber} (${orderId})`);
    console.log(`   - Current isActive: ${order.isActive}`);

    // Step 2: Simulate the DELETE operation
    console.log('\n📋 Step 2: Simulating DELETE operation...');
    console.log(`   - Finding order by ID: ${orderId}`);
    
    const found = await ordersCollection.findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    console.log(`   - Order found before delete: ${!!found}`);
    
    if (found) {
      console.log(`   - isActive before: ${found.isActive}`);
    }

    // Step 3: Perform update (like the API does)
    console.log('\n🔄 Step 3: Performing soft delete (isActive = false)...');
    const updateResult = await ordersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(orderId) },
      { 
        $set: { 
          isActive: false, 
          deletedAt: new Date() 
        } 
      }
    );
    console.log(`   - Update result:`, updateResult);
    console.log(`   - Modified count: ${updateResult.modifiedCount}`);

    if (updateResult.modifiedCount === 0) {
      console.log('❌ ERROR: No documents were modified!');
    } else {
      console.log('✅ Order updated successfully');
    }

    // Step 4: Verify it was deleted
    console.log('\n✅ Step 4: Verifying deletion...');
    const afterDelete = await ordersCollection.findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    console.log(`   - Order found after delete: ${!!afterDelete}`);
    if (afterDelete) {
      console.log(`   - isActive after: ${afterDelete.isActive}`);
      console.log(`   - deletedAt: ${afterDelete.deletedAt}`);
    }

    // Step 5: Verify GET won't return it
    console.log('\n📡 Step 5: Testing GET filter (isActive = true)...');
    const activeOrders = await ordersCollection.find({ isActive: true }).toArray();
    const stillVisible = activeOrders.find(o => o._id.toString() === orderId);
    
    if (stillVisible) {
      console.log('❌ ERROR: Deleted order STILL appears in GET results!');
      console.log('   - This means the delete did not persist correctly');
    } else {
      console.log('✅ Deleted order does NOT appear in GET results');
      console.log(`   - Total active orders now: ${activeOrders.length}`);
    }

    // Step 6: Restore for next test
    console.log('\n♻️ Step 6: Restoring order...');
    await ordersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(orderId) },
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
