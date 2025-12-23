const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

(async () => {
  const client = new MongoClient('mongodb://localhost:27017/empi');
  try {
    await client.connect();
    const db = client.db('empi');
    const count = await db.collection('orders').countDocuments({});
    console.log('Total orders in DB:', count);
    
    const groupedByEmail = await db.collection('orders').aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\nOrders by email (top 10):');
    groupedByEmail.slice(0, 10).forEach(item => {
      console.log(`  ${item._id}: ${item.count} orders`);
    });
  } finally {
    await client.close();
  }
})();
