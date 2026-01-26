#!/usr/bin/env node

/**
 * Cleanup Script: Delete ALL Test Orders
 * This script removes all pending, approved, and in-progress orders from the database
 * to prepare for production with a clean slate
 */

const mongoose = require('mongoose');
const path = require('path');

// MongoDB connection string
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';

// Define Order Schema
const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', orderSchema, 'unified_orders');

async function cleanupAllOrders() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get order counts before deletion
    const pendingCount = await Order.countDocuments({ status: 'pending' });
    const approvedCount = await Order.countDocuments({ status: 'approved' });
    const inProgressCount = await Order.countDocuments({ status: 'in_production' });
    const readyForDeliveryCount = await Order.countDocuments({ status: 'ready_for_delivery' });

    console.log('\n📊 Orders to be deleted:');
    console.log(`   Pending: ${pendingCount}`);
    console.log(`   Approved: ${approvedCount}`);
    console.log(`   In Progress: ${inProgressCount}`);
    console.log(`   Ready for Delivery: ${readyForDeliveryCount}`);
    console.log(`   TOTAL: ${pendingCount + approvedCount + inProgressCount + readyForDeliveryCount}`);

    // Ask for confirmation
    console.log('\n⚠️  This will permanently delete all test orders!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Deleting pending orders...');
    const pendingResult = await Order.deleteMany({ status: 'pending' });
    console.log(`✅ Deleted ${pendingResult.deletedCount} pending orders`);

    console.log('🗑️  Deleting approved orders...');
    const approvedResult = await Order.deleteMany({ status: 'approved' });
    console.log(`✅ Deleted ${approvedResult.deletedCount} approved orders`);

    console.log('🗑️  Deleting in-progress orders...');
    const inProgressResult = await Order.deleteMany({ status: 'in_production' });
    console.log(`✅ Deleted ${inProgressResult.deletedCount} in-progress orders`);

    console.log('🗑️  Deleting ready-for-delivery orders...');
    const readyResult = await Order.deleteMany({ status: 'ready_for_delivery' });
    console.log(`✅ Deleted ${readyResult.deletedCount} ready-for-delivery orders`);

    const totalDeleted = pendingResult.deletedCount + approvedResult.deletedCount + inProgressResult.deletedCount + readyResult.deletedCount;

    console.log('\n✨ Cleanup Complete!');
    console.log(`📦 Total orders deleted: ${totalDeleted}`);
    console.log('🚀 Database is now clean and ready for production!\n');

    // Verify counts
    const finalPendingCount = await Order.countDocuments({ status: 'pending' });
    const finalApprovedCount = await Order.countDocuments({ status: 'approved' });
    const finalInProgressCount = await Order.countDocuments({ status: 'in_production' });
    const finalReadyCount = await Order.countDocuments({ status: 'ready_for_delivery' });

    console.log('📊 Verification - Remaining orders:');
    console.log(`   Pending: ${finalPendingCount}`);
    console.log(`   Approved: ${finalApprovedCount}`);
    console.log(`   In Progress: ${finalInProgressCount}`);
    console.log(`   Ready for Delivery: ${finalReadyCount}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run cleanup
cleanupAllOrders();
