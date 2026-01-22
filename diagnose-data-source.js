const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function diagnoseDataSource() {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get list of ALL collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 ALL COLLECTIONS IN DATABASE:');
    collections.forEach(c => console.log(`  - ${c.name}`));

    // Check each collection for document count and sample data
    console.log('\n🔍 CHECKING EACH COLLECTION FOR DATA:\n');

    for (const collection of collections) {
      const col = db.collection(collection.name);
      const count = await col.countDocuments();
      console.log(`📋 Collection: ${collection.name}`);
      console.log(`   Document Count: ${count}`);
      
      if (count > 0) {
        const sample = await col.findOne();
        console.log(`   Sample Doc ID: ${sample._id}`);
        console.log(`   Sample Keys: ${Object.keys(sample).join(', ')}`);
        
        // For orders collections, show key fields
        if (collection.name.includes('order')) {
          console.log(`   Sample Fields:`);
          console.log(`     - orderNumber: ${sample.orderNumber || 'N/A'}`);
          console.log(`     - total: ${sample.total || 'N/A'}`);
          console.log(`     - status: ${sample.status || 'N/A'}`);
          console.log(`     - createdAt: ${sample.createdAt || 'N/A'}`);
        }
        
        // For caution fees
        if (collection.name.includes('caution')) {
          console.log(`   Sample Fields:`);
          console.log(`     - amount: ${sample.amount || 'N/A'}`);
          console.log(`     - status: ${sample.status || 'N/A'}`);
        }
      }
      console.log('');
    }

    // Specific deep checks on important collections
    console.log('\n🔎 DEEP ANALYSIS OF KEY COLLECTIONS:\n');

    const ordersCol = db.collection('orders');
    const unifiedOrdersCol = db.collection('unifiedorders');
    const customOrdersCol = db.collection('customorders');
    const cautionFeesCol = db.collection('cautionfeetransactions');

    const counts = {
      orders: await ordersCol.countDocuments(),
      unifiedorders: await unifiedOrdersCol.countDocuments(),
      customorders: await customOrdersCol.countDocuments(),
      cautionfeetransactions: await cautionFeesCol.countDocuments(),
    };

    console.log('Collection Sizes:');
    Object.entries(counts).forEach(([name, count]) => {
      console.log(`  ${name}: ${count} documents`);
    });

    // If caution fees exist, show details
    if (counts.cautionfeetransactions > 0) {
      console.log('\n⚠️ CAUTION FEE DOCUMENTS FOUND:');
      const cautionFees = await cautionFeesCol.find({}).limit(5).toArray();
      cautionFees.forEach((fee, idx) => {
        console.log(`  [${idx + 1}] Amount: ₦${fee.amount}, Status: ${fee.status}, Date: ${fee.createdAt}`);
      });
    }

    // Check for hidden/system collections
    console.log('\n🔐 CHECKING FOR HIDDEN COLLECTIONS:');
    const allCollections = await db.listCollections().toArray();
    const systemCollections = allCollections.filter(c => c.name.startsWith('system.'));
    const indexCollections = allCollections.filter(c => c.name.includes('_index'));
    
    if (systemCollections.length > 0) {
      console.log('  System Collections:', systemCollections.map(c => c.name).join(', '));
    }
    if (indexCollections.length > 0) {
      console.log('  Index Collections:', indexCollections.map(c => c.name).join(', '));
    }

    console.log('\n✅ DIAGNOSTIC COMPLETE');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

diagnoseDataSource();
