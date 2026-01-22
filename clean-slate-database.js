const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function cleanAllData() {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Collections to COMPLETELY DELETE (clean slate)
    const collectionsToDelete = [
      'unifiedorders',           // ✅ Delete all 3 orders
      'orders',                  // ✅ Delete legacy orders (empty but clean)
      'invoices',                // ✅ Delete all invoices
      'cautionfeetransactions',  // ✅ Delete caution fee records
      'expenses',                // ✅ Delete expense records
      'vathistories',            // ✅ Delete VAT history
      'custom_orders',           // ✅ Delete custom orders
      'customorders',            // ✅ Delete custom orders (other collection)
      'messages',                // ✅ Delete messages
      'notifications',           // ✅ Delete notifications
      'errorlogs',               // ✅ Delete error logs
      'logisticssettings',       // ✅ Delete logistics settings
    ];

    console.log('🗑️  DELETING ALL TRANSACTION & ORDER DATA:\n');

    let totalDeleted = 0;

    for (const collectionName of collectionsToDelete) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`✅ ${collectionName.padEnd(25)} - Deleted ${result.deletedCount} documents`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`✅ ${collectionName.padEnd(25)} - Already empty (0 docs)`);
        }
      } catch (error) {
        if (error.codeName === 'NamespaceNotFound') {
          console.log(`⏭️  ${collectionName.padEnd(25)} - Collection doesn't exist (skip)`);
        } else {
          console.log(`⚠️  ${collectionName.padEnd(25)} - Error: ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 CLEANUP SUMMARY:`);
    console.log(`   Total documents deleted: ${totalDeleted}`);
    console.log(`   Collections cleaned: ${collectionsToDelete.length}`);

    // Show remaining data
    console.log('\n\n📋 REMAINING DATA (Kept for new start):\n');
    
    const keepCollections = ['admins', 'buyers', 'products', 'users', 'settings'];
    
    for (const collectionName of keepCollections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`   ✓ ${collectionName.padEnd(20)} - ${count} documents (kept)`);
      } catch (error) {
        // Skip if collection doesn't exist
      }
    }

    console.log('\n\n✨ DATABASE CLEANED - FRESH START READY!');
    console.log('\n🎯 What was deleted:');
    console.log('   ✓ All UnifiedOrders (3 orders)');
    console.log('   ✓ All Invoices');
    console.log('   ✓ All Caution Fee transactions');
    console.log('   ✓ All Expense records');
    console.log('   ✓ All VAT history');
    console.log('   ✓ All Messages & Notifications');
    console.log('\n✅ What remains (reference data):');
    console.log('   ✓ Admin accounts (for login)');
    console.log('   ✓ Products (for shopping)');
    console.log('   ✓ Buyers (customer accounts)');
    console.log('   ✓ Settings & Configuration');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

cleanAllData();
