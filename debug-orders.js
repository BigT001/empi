const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function debugOrders() {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const unifiedCol = db.collection('unifiedorders');

    // Get ALL orders regardless of status
    const allOrders = await unifiedCol.find({}).toArray();

    console.log(`📊 TOTAL ORDERS IN DATABASE: ${allOrders.length}\n`);
    console.log('='.repeat(80) + '\n');

    if (allOrders.length === 0) {
      console.log('❌ No orders found in database');
    } else {
      allOrders.forEach((order, index) => {
        console.log(`ORDER #${index + 1}:`);
        console.log(`  Order Number: ${order.orderNumber}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Payment Status: ${order.paymentStatus || 'N/A'}`);
        console.log(`  Total: ${order.total}`);
        console.log(`  Items Count: ${order.items?.length || 0}`);
        
        if (order.items && order.items.length > 0) {
          console.log(`  Item Details:`);
          order.items.forEach((item, i) => {
            console.log(`    [${i}] Mode: ${item.mode}, Name: ${item.name}, Price: ${item.price}, Qty: ${item.quantity}`);
          });
        }
        
        console.log(`  Created: ${new Date(order.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}`);
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('\n📋 ORDER STATUS BREAKDOWN:\n');

    const statusBreakdown = {};
    allOrders.forEach(order => {
      const status = order.status || 'unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n💰 REVENUE CALCULATION TEST:\n');

    // Simulate Finance API logic with UPDATED filter
    const completedOrders = allOrders.filter(
      (order) =>
        order.status === 'confirmed' ||
        order.status === 'approved' ||
        order.status === 'processing' ||
        order.status === 'ready_for_delivery' ||
        order.status === 'packed' ||
        order.status === 'shipped' ||
        order.status === 'delivered' ||
        order.status === 'completed' ||
        order.paymentStatus === 'confirmed'
    );

    const pendingOrders = allOrders.filter(
      (order) =>
        (order.status === 'pending' || order.status === 'processing' || order.status === 'awaiting_payment') &&
        order.paymentStatus !== 'confirmed'
    );

    const completedRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const pendingRevenue = pendingOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalRevenue = completedRevenue + pendingRevenue;

    console.log(`Completed Orders (revenue recognized): ${completedOrders.length}`);
    console.log(`  Statuses: ${completedOrders.map(o => o.status).join(', ')}`);
    console.log(`  Revenue: ₦${completedRevenue.toLocaleString('en-NG')}`);
    console.log('');

    console.log(`Pending Orders (awaiting approval): ${pendingOrders.length}`);
    console.log(`  Statuses: ${pendingOrders.map(o => o.status).join(', ')}`);
    console.log(`  Revenue: ₦${pendingRevenue.toLocaleString('en-NG')}`);
    console.log('');

    console.log(`TOTAL REVENUE: ₦${totalRevenue.toLocaleString('en-NG')}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

debugOrders();
