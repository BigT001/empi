// Check specific custom orders in database
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function checkCustomOrders() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 Checking custom orders...\n');
    
    // Get all custom orders
    const customOrdersCollection = db.collection('customorders');
    const allCustomOrders = await customOrdersCollection.find({}).toArray();
    
    console.log(`Total custom orders: ${allCustomOrders.length}`);
    
    if (allCustomOrders.length > 0) {
      allCustomOrders.forEach((order, i) => {
        console.log(`\n[${i+1}] Custom Order:`);
        console.log(`  ID: ${order._id}`);
        console.log(`  OrderNumber: ${order.orderNumber}`);
        console.log(`  FullName: ${order.fullName}`);
        console.log(`  Email: ${order.email}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  ProductId: ${order.productId}`);
        console.log(`  Created: ${order.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkCustomOrders();
