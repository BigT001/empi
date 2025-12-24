// Complete data cleanup script - deletes ALL orders
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function cleanupData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🗑️  Starting complete data cleanup...\n');
    
    // Delete ALL orders
    const ordersCollection = db.collection('orders');
    const orderDeleteResult = await ordersCollection.deleteMany({});
    console.log(`✅ Deleted ${orderDeleteResult.deletedCount} orders`);
    
    // Delete ALL custom orders
    const customOrdersCollection = db.collection('customorders');
    const customOrderDeleteResult = await customOrdersCollection.deleteMany({});
    console.log(`✅ Deleted ${customOrderDeleteResult.deletedCount} custom orders`);
    
    // Verify deletion
    const remainingOrders = await ordersCollection.countDocuments({});
    const remainingCustomOrders = await customOrdersCollection.countDocuments({});
    console.log(`\n📊 Remaining orders: ${remainingOrders}`);
    console.log(`📊 Remaining custom orders: ${remainingCustomOrders}`);
    
    console.log('\n✨ Cleanup complete! Database is clean - ready for fresh test.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupData();
