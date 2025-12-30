// Delete ALL orders, custom orders, and invoices from database
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

async function cleanupAllData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('empi');
    
    console.log('🗑️  Starting complete data cleanup...\n');
    
    // Delete ALL orders
    const ordersCollection = db.collection('orders');
    const orderDeleteResult = await ordersCollection.deleteMany({});
    console.log(`✅ Deleted ${orderDeleteResult.deletedCount} orders`);
    
    // Delete ALL custom orders
    const customOrdersCollection = db.collection('customorders');
    const customOrderDeleteResult = await customOrdersCollection.deleteMany({});
    console.log(`✅ Deleted ${customOrderDeleteResult.deletedCount} custom orders`);
    
    // Delete ALL invoices
    const invoicesCollection = db.collection('invoices');
    const invoiceDeleteResult = await invoicesCollection.deleteMany({});
    console.log(`✅ Deleted ${invoiceDeleteResult.deletedCount} invoices`);
    
    // Verify all deletions
    console.log('\n📊 Verification:');
    const remainingOrders = await ordersCollection.countDocuments({});
    console.log(`   Orders remaining: ${remainingOrders}`);
    
    const remainingCustomOrders = await customOrdersCollection.countDocuments({});
    console.log(`   Custom orders remaining: ${remainingCustomOrders}`);
    
    const remainingInvoices = await invoicesCollection.countDocuments({});
    console.log(`   Invoices remaining: ${remainingInvoices}`);
    
    console.log('\n✨ Cleanup complete! All data has been deleted.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupAllData();
