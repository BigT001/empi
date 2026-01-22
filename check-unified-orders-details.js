const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function checkUnifiedOrders() {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Check UnifiedOrder collection
    const unifiedOrdersCol = db.collection('unifiedorders');
    const count = await unifiedOrdersCol.countDocuments();
    
    console.log(`📋 UnifiedOrders Collection: ${count} documents\n`);
    
    if (count > 0) {
      const orders = await unifiedOrdersCol.find({}).toArray();
      
      console.log('📊 ALL UNIFIED ORDERS:\n');
      orders.forEach((order, idx) => {
        console.log(`[${idx + 1}] Order Details:`);
        console.log(`    Order Number: ${order.orderNumber}`);
        console.log(`    Total: ₦${order.total}`);
        console.log(`    Status: ${order.status}`);
        console.log(`    Items: ${order.items?.length || 0}`);
        if (order.items && order.items.length > 0) {
          order.items.forEach((item, i) => {
            console.log(`      Item ${i + 1}: ${item.name} (${item.quantity} @ ₦${item.price}) - Mode: ${item.mode}`);
          });
        }
        console.log(`    Created: ${order.createdAt}`);
        console.log('');
      });

      // Summary
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
      
      console.log('📈 SUMMARY:');
      console.log(`   Total Orders: ${count}`);
      console.log(`   Total Revenue: ₦${totalRevenue}`);
      console.log(`   Total Items: ${totalItems}`);
      console.log(`   Avg Order Value: ₦${Math.round(totalRevenue / count)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUnifiedOrders();
