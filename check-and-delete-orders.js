// Check and delete all custom orders with status
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function findAndDeleteOrders() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🔍 Searching for orders with status...\n');
    
    // Check customorders collection for orders with "ready" or "in-progress" status
    const customOrdersCollection = db.collection('customorders');
    
    const readyOrders = await customOrdersCollection.find({ status: "ready" }).toArray();
    const inProgressOrders = await customOrdersCollection.find({ status: "in-progress" }).toArray();
    
    console.log(`Found ${readyOrders.length} orders with status "ready"`);
    console.log(`Found ${inProgressOrders.length} orders with status "in-progress"`);
    
    if (readyOrders.length > 0) {
      console.log('\nReady orders:');
      readyOrders.forEach((order, i) => {
        console.log(`  ${i + 1}. ${order.orderNumber} - ${order.fullName}`);
      });
    }
    
    if (inProgressOrders.length > 0) {
      console.log('\nIn Progress orders:');
      inProgressOrders.forEach((order, i) => {
        console.log(`  ${i + 1}. ${order.orderNumber} - ${order.fullName}`);
      });
    }
    
    if (readyOrders.length > 0 || inProgressOrders.length > 0) {
      // Delete all of them
      console.log('\n🗑️  Deleting all orders...');
      const deleteResult = await customOrdersCollection.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} total orders`);
      
      // Also clean up associated data
      const messagesCollection = db.collection('messages');
      const messagesDeleted = await messagesCollection.deleteMany({});
      console.log(`✅ Deleted ${messagesDeleted.deletedCount} messages`);
    }
    
    console.log('\n✨ Complete cleanup done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

findAndDeleteOrders();
