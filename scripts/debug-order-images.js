const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function debugOrderImages() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');

    // Fetch all products
    console.log('\n📦 Fetching all products...');
    const products = await productsCollection.find({}).toArray();
    console.log(`✅ Found ${products.length} products`);
    console.log('Product IDs:');
    products.forEach(p => console.log(`  - ${p._id.toString()}: ${p.name}`));

    // Fetch first order
    console.log('\n📋 Fetching first order...');
    const firstOrder = await ordersCollection.findOne({});
    if (firstOrder) {
      console.log(`Order: ${firstOrder.orderNumber}`);
      console.log(`Items:`);
      firstOrder.items.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (productId: ${item.productId})`);
        console.log(`     Has imageUrl: ${item.imageUrl ? '✅ Yes' : '❌ No'}`);
        // Check if this productId exists in products
        const found = products.find(p => p._id.toString() === item.productId?.toString());
        console.log(`     Product exists: ${found ? '✅ Yes' : '❌ No'}`);
        if (found) {
          console.log(`     Product image: ${found.imageUrl}`);
        }
      });
    }

    console.log('\n✨ Debug complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

debugOrderImages();
