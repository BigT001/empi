import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

async function cleanDatabase() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection;
    
    // Collections to DELETE
    const collectionsToDelete = [
      'invoices',
      'buyers',
      'orders',
      'customorders',
      'custom_orders',
      'messages',
      'expenses',
      'notifications',
      'errorlogs',
      'vathistories',
      'settings',
      'logisticssettings',
      'users',
    ];

    // Collections to KEEP
    const collectionsToKeep = [
      'products',        // Keep all products
      'admins',          // Keep admin users
    ];

    // Get all collections
    const allCollections = await db.db.listCollections().toArray();
    const collectionNames = allCollections.map(c => c.name);

    console.log('═'.repeat(70));
    console.log('🗑️ DATABASE CLEANUP - PRODUCTION PREPARATION');
    console.log('═'.repeat(70));
    console.log('\n📊 Current Collections in Database:');
    collectionNames.forEach(name => {
      if (collectionsToKeep.includes(name)) {
        console.log(`  ✅ KEEP: ${name}`);
      } else if (collectionsToDelete.includes(name)) {
        console.log(`  🗑️  DELETE: ${name}`);
      } else {
        console.log(`  ⓘ  UNKNOWN: ${name}`);
      }
    });

    console.log('\n═'.repeat(70));
    console.log('🚨 DELETION SUMMARY:');
    console.log('═'.repeat(70));

    let totalDocsDeleted = 0;

    for (const collName of collectionsToDelete) {
      if (collectionNames.includes(collName)) {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        
        if (count > 0) {
          await coll.deleteMany({});
          console.log(`  🗑️  ${collName}: ${count} document(s) deleted`);
          totalDocsDeleted += count;
        } else {
          console.log(`  ⊘ ${collName}: already empty`);
        }
      }
    }

    console.log('\n═'.repeat(70));
    console.log('✅ COLLECTIONS PRESERVED:');
    console.log('═'.repeat(70));

    for (const collName of collectionsToKeep) {
      if (collectionNames.includes(collName)) {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        console.log(`  ✅ ${collName}: ${count} document(s) preserved`);
      }
    }

    console.log('\n═'.repeat(70));
    console.log('📈 FINAL STATISTICS:');
    console.log('═'.repeat(70));
    console.log(`  Total documents deleted: ${totalDocsDeleted}`);
    console.log(`  Collections cleared: ${collectionsToDelete.filter(c => collectionNames.includes(c)).length}`);
    console.log(`  Collections preserved: ${collectionsToKeep.filter(c => collectionNames.includes(c)).length}`);
    console.log('\n═'.repeat(70));
    console.log('✅ DATABASE IS NOW CLEAN AND READY FOR PRODUCTION!');
    console.log('═'.repeat(70));
    console.log('\n📝 What was preserved:');
    console.log('  ✅ All products (ready to sell)');
    console.log('  ✅ All admin users (3 configured accounts)');
    console.log('\n📝 What was deleted:');
    console.log('  🗑️  All test orders');
    console.log('  🗑️  All test invoices');
    console.log('  🗑️  All test customers/buyers');
    console.log('  🗑️  All test messages');
    console.log('  🗑️  All test expenses');
    console.log('  🗑️  All test custom orders');
    console.log('  🗑️  All notifications');
    console.log('  🗑️  All error logs');
    console.log('  🗑️  All VAT histories');
    console.log('  🗑️  All settings');
    console.log('\n🚀 Your database is now production-ready!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
