// Check all orders in database
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function checkAllOrders() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 Checking ALL orders in database...\n');
    
    const ordersCollection = db.collection('orders');
    const allOrders = await ordersCollection.find({}).toArray();
    
    console.log(`Total orders: ${allOrders.length}`);
    
    if (allOrders.length > 0) {
      allOrders.forEach((order, i) => {
        console.log(`\n[${i+1}] Regular Order:`);
        console.log(`  ID: ${order._id}`);
        console.log(`  OrderNumber: ${order.orderNumber}`);
        console.log(`  FirstName: ${order.firstName}`);
        console.log(`  Email: ${order.email}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Created: ${order.createdAt}`);
      });
    }
    
    // Also check for the product with name "Samuel Stanley"
    console.log('\n\n🔍 Checking products...');
    const productsCollection = db.collection('products');
    const samuelProduct = await productsCollection.findOne({ name: 'Samuel Stanley' });
    
    if (samuelProduct) {
      console.log('\nFound product "Samuel Stanley":');
      console.log(`  ID: ${samuelProduct._id}`);
      console.log(`  Name: ${samuelProduct.name}`);
      console.log(`  Category: ${samuelProduct.category}`);
      console.log(`  CostumeType: ${samuelProduct.costumeType}`);
    } else {
      console.log('\nNo product found with name "Samuel Stanley"');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkAllOrders();
