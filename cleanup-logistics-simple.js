const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanupOrders() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';
  console.log('🔗 Using MongoDB URI:', mongoUri.substring(0, 50) + '...');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('📦 Connected to MongoDB');

    // Delete all orders
    const orderCollection = db.collection('orders');
    const orderResult = await orderCollection.deleteMany({});
    console.log(`✅ Deleted ${orderResult.deletedCount} orders from orders collection`);

    // Delete all custom orders
    const customOrderCollection = db.collection('customorders');
    const customOrderResult = await customOrderCollection.deleteMany({});
    console.log(`✅ Deleted ${customOrderResult.deletedCount} custom orders from customorders collection`);

    console.log('🎉 All orders have been deleted successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

cleanupOrders();
