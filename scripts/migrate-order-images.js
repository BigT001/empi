const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function migrateOrderImages() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

    // Fetch all products and create a map of productId -> imageUrl
    console.log('📦 Fetching all products...');
    const products = await productsCollection.find({}).toArray();
    const productImageMap = {};
    products.forEach(product => {
      productImageMap[product._id.toString()] = {
        imageUrl: product.imageUrl,
        name: product.name,
      };
    });
    console.log(`✅ Loaded ${products.length} products`);

    // Fetch all orders
    console.log('📋 Fetching all orders...');
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📊 Found ${orders.length} orders to process`);

    let updatedCount = 0;
    let noImageCount = 0;

    // Update each order's items with imageUrl
    for (const order of orders) {
      if (!order.items || order.items.length === 0) continue;

      let hasChanges = false;
      const updatedItems = order.items.map(item => {
        // Only update if imageUrl doesn't already exist
        if (!item.imageUrl && item.productId) {
          const productInfo = productImageMap[item.productId.toString()];
          if (productInfo) {
            item.imageUrl = productInfo.imageUrl;
            hasChanges = true;
            return item;
          }
        }
        return item;
      });

      if (hasChanges) {
        try {
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { items: updatedItems } }
          );
          updatedCount++;
          console.log(`✅ Updated order ${order.orderNumber || order._id}`);
        } catch (err) {
          console.error(`❌ Failed to update order ${order.orderNumber || order._id}:`, err.message);
        }
      } else {
        noImageCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} orders`);
    console.log(`   ⏭️  Skipped: ${noImageCount} orders (already have images or no products)`);
    console.log(`   📦 Total: ${orders.length} orders`);

    console.log('✨ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateOrderImages();
