import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

async function deleteAllTransactions() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection;
    
    // Transaction-related collections to DELETE
    const transactionCollections = [
      'orders',                      // All orders (sales, rentals, mixed)
      'invoices',                    // All invoices
      'cautionfeetransactions',      // Caution fee transactions
      'customorders',                // Custom orders
      'custom_orders',               // Custom orders (alternate name)
    ];

    // Get all collections
    const allCollections = await db.db.listCollections().toArray();
    const collectionNames = allCollections.map(c => c.name);

    console.log('═'.repeat(70));
    console.log('🗑️  DELETE ALL TRANSACTIONS - CLEAN DATABASE');
    console.log('═'.repeat(70));
    console.log('\n📊 Current Collections in Database:');
    collectionNames.forEach(name => {
      if (transactionCollections.includes(name)) {
        console.log(`  🗑️  DELETE: ${name}`);
      } else {
        console.log(`  ✅ KEEP: ${name}`);
      }
    });

    console.log('\n═'.repeat(70));
    console.log('🚨 DELETION SUMMARY:');
    console.log('═'.repeat(70));

    let totalDocsDeleted = 0;

    for (const collName of transactionCollections) {
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

    const collectionsToKeep = [
      'products',
      'admins',
      'users',
      'buyers',
      'expenses',
      'messages',
      'notifications',
      'errorlogs',
      'vathistories',
      'settings',
      'logisticssettings',
      'nigerian_states',
      'carts',
    ];

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
    console.log(`  Collections cleared: ${transactionCollections.filter(c => collectionNames.includes(c)).length}`);
    
    console.log('\n═'.repeat(70));
    console.log('✅ ALL TRANSACTIONS DELETED - DATABASE IS CLEAN!');
    console.log('═'.repeat(70));
    console.log('\n📝 What was deleted:');
    console.log('  🗑️  All orders (sales, rentals, mixed)');
    console.log('  🗑️  All invoices');
    console.log('  🗑️  All caution fee transactions');
    console.log('  🗑️  All custom orders');
    console.log('\n📝 What was preserved:');
    console.log('  ✅ All products (ready for new transactions)');
    console.log('  ✅ All admin users (operational access)');
    console.log('  ✅ All system settings and configurations');
    console.log('\n🚀 Database is now clean and ready for fresh transactions!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAllTransactions();
