// Check regular orders and their item images in database
const { MongoClient } = require('mongodb');

async function checkRegularOrderImages() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('empi');
    const ordersCollection = db.collection('orders');
    
    console.log('🔍 Checking regular orders and their item images...\n');
    
    const orders = await ordersCollection.find({
      $or: [
        { isCustomOrder: { $ne: true } },
        { isCustomOrder: { $exists: false } }
      ]
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log(`📊 Found ${orders.length} regular orders\n`);
    
    if (orders.length > 0) {
      orders.forEach((order, idx) => {
        console.log(`\n─────────────────────────────────────────`);
        console.log(`Order ${idx + 1}: ${order.orderNumber}`);
        console.log(`─────────────────────────────────────────`);
        console.log(`Customer: ${order.firstName} ${order.lastName} (${order.email})`);
        console.log(`Total: ₦${order.total}`);
        console.log(`Items: ${order.items?.length || 0} items`);
        
        if (order.items && order.items.length > 0) {
          order.items.forEach((item, i) => {
            console.log(`\n  Item ${i + 1}:`);
            console.log(`  - Name: ${item.name}`);
            console.log(`  - Quantity: ${item.quantity}`);
            console.log(`  - Price: ₦${item.price}`);
            console.log(`  - ProductId: ${item.productId || 'N/A'}`);
            console.log(`  - ImageUrl: ${item.imageUrl ? '✅ ' + item.imageUrl : '❌ MISSING'}`);
            console.log(`  - Mode: ${item.mode}`);
          });
        }
      });
    } else {
      console.log('❌ No regular orders found in database!');
      console.log('\nTo create test orders:');
      console.log('1. Go to /product page');
      console.log('2. Add items to cart');
      console.log('3. Complete checkout with Paystack payment');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkRegularOrderImages();
