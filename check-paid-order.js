const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function checkOrderStatuses() {
  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    
    // Get all orders and their statuses
    const orders = await db.collection('unifiedorders')
      .find({})
      .project({ orderNumber: 1, status: 1, items: 1, isOffline: 1, orderType: 1, total: 1, vat: 1 })
      .toArray();
    
    console.log(`\nTotal Orders: ${orders.length}\n`);
    
    // Group by status
    const byStatus = {};
    orders.forEach(order => {
      const status = order.status || 'NONE';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(order);
    });
    
    console.log('Orders by Status:');
    Object.keys(byStatus).forEach(status => {
      console.log(`  ${status}: ${byStatus[status].length} orders`);
    });
    
    console.log('\n===== SAMPLE ORDERS =====');
    orders.slice(0, 3).forEach((order, idx) => {
      console.log(`\n[${idx}] ${order.orderNumber || 'N/A'}`);
      console.log(`  status: '${order.status}'`);
      console.log(`  isOffline: ${order.isOffline}`);
      console.log(`  orderType: '${order.orderType}'`);
      console.log(`  items: ${order.items ? order.items.length : 0}`);
      if (order.items && order.items.length > 0) {
        order.items.slice(0, 1).forEach((item, i) => {
          console.log(`    [${i}] mode: '${item.mode}', rentalDays: ${item.rentalDays}`);
        });
      }
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkOrderStatuses();
