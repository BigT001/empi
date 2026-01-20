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

    console.log('\n📊 Checking order images...\n');

    // Get orders with items
    const orders = await ordersCollection
      .find({ 'items.0': { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    console.log(`📈 Found ${orders.length} orders with items\n`);

    for (const order of orders) {
      console.log(`\n📦 Order ${order.orderNumber} (${order.orderType}):`);
      console.log(`   Status: ${order.status}`);
      if (order.items && Array.isArray(order.items)) {
        console.log(`   Items: ${order.items.length}`);
        order.items.forEach((item, idx) => {
          console.log(`\n   Item ${idx + 1}:`);
          console.log(`      - Name: ${item.name}`);
          console.log(`      - Price: ${item.price}`);
          console.log(`      - Qty: ${item.quantity}`);
          console.log(`      - Has image field: ${!!item.image}`);
          console.log(`      - Has imageUrl field: ${!!item.imageUrl}`);
          if (item.image) {
            const imagePreview = item.image.substring(0, 80);
            console.log(`      - Image (first 80 chars): ${imagePreview}...`);
          }
          if (item.imageUrl) {
            const imageUrlPreview = item.imageUrl.substring(0, 80);
            console.log(`      - ImageUrl (first 80 chars): ${imageUrlPreview}...`);
          }
        });
      }
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
