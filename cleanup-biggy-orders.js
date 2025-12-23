require('dotenv').config();
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('empi');
    
    // Delete all orders for biggy@gmail.com
    const result = await db.collection('orders').deleteMany({ email: 'biggy@gmail.com' });
    console.log(`✅ Deleted ${result.deletedCount} orders for biggy@gmail.com`);
    
  } finally {
    await client.close();
  }
})();
