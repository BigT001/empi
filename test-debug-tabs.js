const fetch = require('node-fetch');

async function checkOrders() {
  try {
    console.log('Fetching custom orders...');
    const response = await fetch('http://localhost:3000/api/custom-orders?limit=200', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error('API returned:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    const orders = Array.isArray(data) ? data : (data.orders || []);

    console.log(`\n✅ Found ${orders.length} custom orders\n`);
    
    // Group by status
    const byStatus = {};
    orders.forEach(order => {
      const status = order.status || 'no-status';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(order);
    });

    console.log('Orders by status:');
    Object.entries(byStatus).forEach(([status, orders]) => {
      console.log(`  ${status}: ${orders.length} orders`);
      orders.slice(0, 2).forEach(o => {
        console.log(`    - ${o.orderNumber} (${o.email || o.fullName})`);
      });
    });

    // Check for in-progress orders specifically
    if (byStatus['in-progress']) {
      console.log(`\n🎯 In-progress orders (${byStatus['in-progress'].length}):`);
      byStatus['in-progress'].forEach(o => {
        console.log(`  - ${o.orderNumber}: ${o.fullName} (${o.email})`);
        console.log(`    Status: ${o.status}`);
      });
    } else {
      console.log('\n⚠️  No in-progress orders found!');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkOrders();
