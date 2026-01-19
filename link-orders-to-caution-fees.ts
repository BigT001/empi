/**
 * Link-Orders Script
 * One-time script to link existing rental orders with caution fees to CautionFeeTransaction records
 * Run after deploying the new caution fee system
 */

import mongoose from 'mongoose';
import Order from './lib/models/Order';
import CautionFeeTransaction from './lib/models/CautionFeeTransaction';
import 'dotenv/config';

async function linkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    // Find all orders with caution fees
    const ordersWithCaution = await Order.find({ cautionFee: { $gt: 0 } });
    console.log(`📋 Found ${ordersWithCaution.length} rental orders with caution fees\n`);

    if (ordersWithCaution.length === 0) {
      console.log('✨ No orders to link - system is up to date!');
      process.exit(0);
    }

    let linkedCount = 0;
    let existingCount = 0;

    for (const order of ordersWithCaution) {
      const orderObj = order as any;

      // Check if transaction already exists
      let transaction = await CautionFeeTransaction.findOne({
        rentalOrderId: order._id,
      });

      if (transaction) {
        existingCount++;
        console.log(`  ⏭️  Transaction exists for ${orderObj.orderNumber}`);
        continue;
      }

      // Create new transaction
      transaction = new CautionFeeTransaction({
        rentalOrderId: order._id,
        buyerId: orderObj.buyerId || undefined,
        buyerEmail: orderObj.email,
        buyerName: `${orderObj.firstName} ${orderObj.lastName}`,
        amount: orderObj.cautionFee,
        status: 'collected',
        timeline: {
          collectedAt: orderObj.createdAt || new Date(),
        },
      });

      await transaction.save();

      // Link order to transaction
      orderObj.cautionFeeTransactionId = transaction._id;
      await order.save();

      linkedCount++;
      console.log(
        `  ✓ Linked ${orderObj.orderNumber}: Buyer=${orderObj.firstName} ${orderObj.lastName}, Fee=₦${orderObj.cautionFee}`
      );
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Linking Complete!`);
    console.log(`  • New links created: ${linkedCount}`);
    console.log(`  • Existing links found: ${existingCount}`);
    console.log(`  • Total processed: ${linkedCount + existingCount}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

linkOrders();
