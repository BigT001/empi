// Complete cleanup: Database + localStorage keys
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function completeCleanup() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🗑️  Starting complete cleanup...\n');
    
    // Delete ALL from multiple possible collections
    const collections = ['orders', 'customorders', 'custom_orders', 'invoices', 'messages'];
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        if (result.deletedCount > 0) {
          console.log(`✅ Deleted ${result.deletedCount} documents from '${collectionName}'`);
        }
      } catch (err) {
        // Collection might not exist, skip
      }
    }
    
    console.log('\n📊 Verification:');
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments({});
        if (count > 0) {
          console.log(`   ${collectionName}: ${count} documents`);
        }
      } catch (err) {
        // Collection might not exist
      }
    }
    
    console.log('\n✨ Database cleanup complete!');
    console.log('\n📝 NOTE: You must also clear localStorage manually in your browser:');
    console.log('   - Open Developer Tools (F12)');
    console.log('   - Go to Application → Local Storage');
    console.log('   - Delete these keys:');
    console.log('     • empi_buyer_invoices');
    console.log('     • empi_admin_invoices');
    console.log('     • empi_invoices');
    console.log('\nOr refresh the page and all stored orders will be gone.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

completeCleanup();
