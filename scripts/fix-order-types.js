/**
 * Fix missing orderType in unified orders collection
 * Sets orderType based on order characteristics
 */

const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

const UnifiedOrderSchema = new mongoose.Schema({}, { collection: 'unifiedorders' });

async function fixOrderTypes() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('unifiedorders');

    // Find orders without orderType field
    const ordersWithoutType = await collection
      .find({ orderType: { $exists: false } })
      .toArray();

    console.log(`Found ${ordersWithoutType.length} orders without orderType field`);

    if (ordersWithoutType.length === 0) {
      console.log('✅ All orders have orderType field set');
      await mongoose.connection.close();
      process.exit(0);
    }

    let updated = 0;
    for (const order of ordersWithoutType) {
      // Detect type: if has designImages or description -> custom, otherwise regular
      const isCustom = order.designImages || order.description || order.quantity;
      const orderType = isCustom ? 'custom' : 'regular';

      const result = await collection.updateOne(
        { _id: order._id },
        {
          $set: {
            orderType: orderType,
            updatedAt: new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        updated++;
        console.log(`  ✅ Order ${order.orderNumber} set to: ${orderType}`);
      }
    }

    console.log(`\n✅ Fixed ${updated}/${ordersWithoutType.length} orders`);
    
    // Verify the fix
    const customOrders = await collection.countDocuments({ orderType: 'custom', isActive: true });
    const regularOrders = await collection.countDocuments({ orderType: 'regular', isActive: true });
    const noType = await collection.countDocuments({ orderType: { $exists: false } });

    console.log(`\n📊 Final counts:`);
    console.log(`  - Custom orders: ${customOrders}`);
    console.log(`  - Regular orders: ${regularOrders}`);
    console.log(`  - Orders without type: ${noType}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixOrderTypes();
