// Check for any remaining orders in database
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function checkOrders() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 Checking database for remaining orders...\n');
    
    // Check all orders
    const ordersCollection = db.collection('orders');
    const allOrders = await ordersCollection.find({}).toArray();
    console.log(`📋 Total orders in database: ${allOrders.length}`);
    if (allOrders.length > 0) {
      console.log('Orders found:');
      allOrders.forEach(order => {
        console.log(`  - ID: ${order._id}, Email: ${order.email}, Status: ${order.status}, OrderNumber: ${order.orderNumber}`);
      });
    }
    
    console.log('\n');
    
    // Check all custom orders
    const customOrdersCollection = db.collection('customorders');
    const allCustomOrders = await customOrdersCollection.find({}).toArray();
    console.log(`📋 Total custom orders in database: ${allCustomOrders.length}`);
    if (allCustomOrders.length > 0) {
      console.log('Custom orders found:');
      allCustomOrders.forEach(order => {
        console.log(`  - ID: ${order._id}, Email: ${order.email}, Status: ${order.status}, OrderNumber: ${order.orderNumber}`);
      });
    }
    
    // Specific check for sta99175@gmail.com
    console.log('\n');
    console.log('🔎 Checking specifically for sta99175@gmail.com...');
    const userOrders = await ordersCollection.find({ email: 'sta99175@gmail.com' }).toArray();
    const userCustomOrders = await customOrdersCollection.find({ email: 'sta99175@gmail.com' }).toArray();
    
    console.log(`  Orders: ${userOrders.length}`);
    console.log(`  Custom Orders: ${userCustomOrders.length}`);
    
    if (userOrders.length > 0) {
      console.log('\n  Regular Orders:');
      userOrders.forEach(o => console.log(`    - ${o.orderNumber} (${o.status})`));
    }
    
    if (userCustomOrders.length > 0) {
      console.log('\n  Custom Orders:');
      userCustomOrders.forEach(o => console.log(`    - ${o.orderNumber} (${o.status})`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkOrders();
