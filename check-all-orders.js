// Check all orders in database
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function checkAllOrders() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 Checking all orders in database...\n');
    
    // Check custom orders
    const customOrdersCollection = db.collection('customorders');
    const customCount = await customOrdersCollection.countDocuments();
    console.log(`📋 Custom Orders: ${customCount}`);
    
    if (customCount > 0) {
      const customOrders = await customOrdersCollection.find({}).limit(3).toArray();
      customOrders.forEach((order, i) => {
        console.log(`  [${i+1}] ${order.orderNumber} - ${order.email} - Images: ${order.designUrls?.length || 0}`);
      });
    }
    
    // Check regular orders
    const ordersCollection = db.collection('orders');
    const orderCount = await ordersCollection.countDocuments();
    console.log(`\n📦 Regular Orders: ${orderCount}`);
    
    if (orderCount > 0) {
      const orders = await ordersCollection.find({}).limit(3).toArray();
      orders.forEach((order, i) => {
        console.log(`  [${i+1}] ${order.orderNumber} - ${order.email}`);
      });
    }
    
    // Check buyers
    const buyersCollection = db.collection('buyers');
    const buyerCount = await buyersCollection.countDocuments();
    console.log(`\n👥 Buyers: ${buyerCount}`);
    
    // Check invoices
    const invoicesCollection = db.collection('invoices');
    const invoiceCount = await invoicesCollection.countDocuments();
    console.log(`\n📄 Invoices: ${invoiceCount}`);
    
    if (invoiceCount > 0) {
      const invoices = await invoicesCollection.find({}).limit(3).toArray();
      invoices.forEach((inv, i) => {
        console.log(`  [${i+1}] ${inv.orderNumber} - Status: ${inv.paymentVerified ? '✅ Verified' : '❌ Not Verified'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkAllOrders();
