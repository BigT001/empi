// Comprehensive data cleanup script
// This script deletes all test orders for biggy@gmail.com
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function cleanupData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🗑️  Starting data cleanup...\n');
    
    // Delete all orders for biggy@gmail.com
    const ordersCollection = db.collection('orders');
    const orderDeleteResult = await ordersCollection.deleteMany({ email: 'biggy@gmail.com' });
    console.log(`✅ Deleted ${orderDeleteResult.deletedCount} orders for biggy@gmail.com`);
    
    // Verify deletion
    const remainingOrders = await ordersCollection.countDocuments({ email: 'biggy@gmail.com' });
    console.log(`📊 Remaining orders for biggy@gmail.com: ${remainingOrders}`);
    
    // Show total orders in database
    const totalOrders = await ordersCollection.countDocuments({});
    console.log(`\n📈 Total orders in database: ${totalOrders}`);
    
    console.log('\n✨ Cleanup complete! Orders tab will be empty when you refresh.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupData();
