// This script checks the orders in your MongoDB using the MONGODB_URI from .env
require('dotenv').config();
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';
  console.log('Connecting to:', uri.replace(/\/\/.*:.*@/, '//***:***@'));
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('empi');
    
    // Check total count
    const total = await db.collection('orders').countDocuments({});
    console.log('\n📊 Total orders:', total);
    
    // Check by email
    const byEmail = await db.collection('orders').aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📧 Orders by email:');
    byEmail.forEach(item => {
      console.log(`  ${item._id}: ${item.count} orders`);
    });
    
    // Check a sample order
    console.log('\n🔍 Sample order:');
    const sample = await db.collection('orders').findOne({});
    console.log(JSON.stringify(sample, null, 2).substring(0, 500) + '...');
    
  } finally {
    await client.close();
  }
})();
