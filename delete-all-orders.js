// Delete all orders from the database
require('dotenv').config();
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';
  console.log('Connecting to MongoDB...');
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('empi');
    
    // Check current count
    const countBefore = await db.collection('orders').countDocuments({});
    console.log(`\n📊 Current orders: ${countBefore}`);
    
    if (countBefore > 0) {
      // Delete all orders
      const result = await db.collection('orders').deleteMany({});
      console.log(`\n🗑️  Deleted ${result.deletedCount} orders`);
      
      // Verify deletion
      const countAfter = await db.collection('orders').countDocuments({});
      console.log(`✅ Orders remaining: ${countAfter}`);
    } else {
      console.log('No orders to delete');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
})();
