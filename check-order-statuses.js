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

    console.log('\n📊 Checking order statuses...\n');

    // Get status breakdown
    const statuses = await ordersCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          orders: { $push: { orderNumber: '$orderNumber', createdAt: '$createdAt' } }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('📈 Orders by Status:');
    for (const status of statuses) {
      console.log(`\n${status._id.toUpperCase()}: ${status.count} orders`);
      status.orders.forEach(o => {
        console.log(`   - ${o.orderNumber} (${new Date(o.createdAt).toLocaleDateString()})`);
      });
    }

    // Get the 5 most recent orders to check their initial status
    const recentOrders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log('\n\n📋 5 Most Recent Orders:');
    for (const order of recentOrders) {
      console.log(`\n${order.orderNumber}:`);
      console.log(`  - Status: ${order.status}`);
      console.log(`  - Type: ${order.orderType}`);
      console.log(`  - Created: ${new Date(order.createdAt).toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n\n🔌 Database connection closed');
  }
}

main();
