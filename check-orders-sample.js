const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function checkOrders() {
  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    
    console.log('🔍 Checking UnifiedOrders sample data:\n');
    
    const orders = await db.collection('unifiedorders').find({}).limit(3).toArray();
    
    orders.forEach((order, idx) => {
      console.log(`\n📋 Order ${idx + 1}:`);
      console.log(`  - orderNumber: ${order.orderNumber}`);
      console.log(`  - isOffline: ${order.isOffline}`);
      console.log(`  - orderType: ${order.orderType}`);
      console.log(`  - total: ${order.total}`);
      console.log(`  - vat: ${order.vat}`);
      console.log(`  - items count: ${order.items?.length || 0}`);
      if (order.items && order.items.length > 0) {
        console.log(`  - first item mode: ${order.items[0].mode}`);
      }
      console.log(`  - status: ${order.status}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrders();
