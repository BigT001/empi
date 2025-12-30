const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

const orderSchema = new mongoose.Schema({}, { strict: false });
const invoiceSchema = new mongoose.Schema({}, { strict: false });

const Order = mongoose.model('Order', orderSchema, 'orders');
const Invoice = mongoose.model('Invoice', invoiceSchema, 'invoices');

async function deleteAllOrdersAndInvoices() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get counts before deletion
    const orderCount = await Order.countDocuments();
    const invoiceCount = await Invoice.countDocuments();

    console.log(`\n📊 Data to be deleted:`);
    console.log(`  - Orders: ${orderCount}`);
    console.log(`  - Invoices: ${invoiceCount}`);

    if (orderCount === 0 && invoiceCount === 0) {
      console.log('\n⚠️  No orders or invoices found to delete');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete all orders and invoices!');
    console.log('Run with --confirm flag to proceed: node cleanup-delete-all-orders-invoices.js --confirm\n');

    if (process.argv[2] !== '--confirm') {
      console.log('❌ Deletion cancelled. Add --confirm flag to proceed.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Delete all orders
    console.log('\n🗑️  Deleting all orders...');
    const deleteOrdersResult = await Order.deleteMany({});
    console.log(`✅ Deleted ${deleteOrdersResult.deletedCount} orders`);

    // Delete all invoices
    console.log('\n🗑️  Deleting all invoices...');
    const deleteInvoicesResult = await Invoice.deleteMany({});
    console.log(`✅ Deleted ${deleteInvoicesResult.deletedCount} invoices`);

    console.log('\n✅ All orders and invoices have been successfully deleted!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during deletion:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

deleteAllOrdersAndInvoices();
