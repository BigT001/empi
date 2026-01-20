/**
 * Fix missing images in unified orders
 * Fetches product images from products collection and updates order items
 */

const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function fixOrderImages() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('unifiedorders');
    const productsCollection = db.collection('products');

    // Get all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📦 Found ${orders.length} orders`);

    let updated = 0;
    const productCache = {};

    for (const order of orders) {
      if (!order.items || order.items.length === 0) continue;

      let orderModified = false;
      const updatedItems = [];

      for (const item of order.items) {
        // If item already has image, keep it
        if (item.image) {
          updatedItems.push(item);
          continue;
        }

        // Try to find product by name
        let product = null;
        
        // Check cache first
        if (productCache[item.name]) {
          product = productCache[item.name];
        } else {
          // Search in products collection by name
          product = await productsCollection.findOne({
            $or: [
              { name: item.name },
              { title: item.name },
            ]
          });
          
          if (product) {
            productCache[item.name] = product;
          }
        }

        // Add image to item if found
        if (product && product.image) {
          updatedItems.push({
            ...item,
            image: product.image
          });
          orderModified = true;
        } else if (product && product.images && product.images.length > 0) {
          updatedItems.push({
            ...item,
            image: product.images[0]
          });
          orderModified = true;
        } else if (product && product.imageUrl) {
          updatedItems.push({
            ...item,
            image: product.imageUrl
          });
          orderModified = true;
        } else {
          // Keep item as-is if no image found
          updatedItems.push(item);
        }
      }

      // Update order if any items were modified
      if (orderModified) {
        const result = await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { items: updatedItems, updatedAt: new Date() } }
        );

        if (result.modifiedCount > 0) {
          updated++;
          console.log(`✅ Updated order ${order.orderNumber}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`Total orders processed: ${orders.length}`);
    console.log(`Orders updated with images: ${updated}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing order images:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixOrderImages();
