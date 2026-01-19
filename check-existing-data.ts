import mongoose from 'mongoose';
import Order from './lib/models/Order';
import Product from './lib/models/Product';
import 'dotenv/config';

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    // Check products
    const products = await Product.find().limit(5);
    console.log('📦 PRODUCTS:');
    products.forEach((p: any) => {
      console.log(`  - ${p.name}`);
      console.log(`    Sell: ₦${p.sellPrice}, Rent: ₦${p.rentPrice}`);
    });

    // Check orders with caution fees
    const ordersWithCaution = await Order.find({ cautionFee: { $gt: 0 } }).limit(5);
    console.log(`\n📋 ORDERS WITH CAUTION FEE (${ordersWithCaution.length} found):`);
    ordersWithCaution.forEach((o: any) => {
      console.log(`  Order: ${o.orderNumber}`);
      console.log(`  Buyer: ${o.firstName} ${o.lastName} (${o.email})`);
      console.log(`  Caution Fee: ₦${o.cautionFee}`);
      console.log(`  Has cautionFeeTransactionId: ${!!o.cautionFeeTransactionId}`);
      console.log(`  Status: ${o.status}`);
      console.log(`  Items: ${o.items?.length || 0} items`);
      o.items?.forEach((item: any, i: number) => {
        console.log(`    ${i + 1}. ${item.name} (Mode: ${item.mode}, Price: ₦${item.price})`);
      });
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

checkData();
