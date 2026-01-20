require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

(async () => {
  try {
    console.log('[Check] Connecting to:', uri.substring(0, 50) + '...');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    // Check total orders
    const totalOrders = await db.collection('unifiedorders').countDocuments();
    console.log('\n📊 Database Status:');
    console.log('Total orders in DB:', totalOrders);
    
    // Check active orders
    const activeOrders = await db.collection('unifiedorders').countDocuments({ isActive: true });
    console.log('Active orders (isActive: true):', activeOrders);
    
    // Check deleted orders
    const deletedOrders = await db.collection('unifiedorders').countDocuments({ isActive: false });
    console.log('Deleted orders (isActive: false):', deletedOrders);
    
    // Show a few deleted orders
    if (deletedOrders > 0) {
      console.log('\n🗑️ Sample deleted orders:');
      const deleted = await db.collection('unifiedorders').find({ isActive: false }).limit(5).toArray();
      deleted.forEach(o => {
        console.log(`  - ${o.orderNumber} | isActive: ${o.isActive} | deletedAt: ${o.deletedAt}`);
      });
    }
    
    // Show most recent orders (both active and deleted)
    console.log('\n📝 Most recent orders (first 5):');
    const recent = await db.collection('unifiedorders').find({}).sort({ createdAt: -1 }).limit(5).toArray();
    recent.forEach(o => {
      console.log(`  - ${o.orderNumber} | status: ${o.status} | isActive: ${o.isActive}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
