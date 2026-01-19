const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDb() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('empi');

    console.log('📊 Database Collections:\n');

    // List all collections
    const collections = await db.listCollections().toArray();
    
    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check specific collections
    const orders = await db.collection('orders').find({}).limit(1).toArray();
    const customOrders = await db.collection('customorders').find({}).limit(1).toArray();

    if (orders.length > 0) {
      console.log('\n✓ Sample Order found:');
      console.log(JSON.stringify(orders[0], null, 2).substring(0, 800));
    } else {
      console.log('\n❌ NO ORDERS FOUND');
    }

    if (customOrders.length > 0) {
      console.log('\n✓ Sample Custom Order found:');
      console.log(JSON.stringify(customOrders[0], null, 2).substring(0, 500));
    }

    await client.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkDb();
