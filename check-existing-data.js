const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const Order = require('./lib/models/Order').default;
const Product = require('./lib/models/Product').default;

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check products
    const products = await Product.find().limit(5);
    console.log('📦 PRODUCTS:');
    products.forEach(p => {
      console.log(`  - ${p.name}`);
      console.log(`    Sell: ₦${p.sellPrice}, Rent: ₦${p.rentPrice}`);
    });

    // Check orders with caution fees
    const ordersWithCaution = await Order.find({ cautionFee: { $gt: 0 } }).limit(5);
    console.log(`\n📋 ORDERS WITH CAUTION FEE (${ordersWithCaution.length} found):`);
    ordersWithCaution.forEach(o => {
      console.log(`  Order: ${o.orderNumber}`);
      console.log(`  Buyer: ${o.firstName} ${o.lastName} (${o.email})`);
      console.log(`  Caution Fee: ₦${o.cautionFee}`);
      console.log(`  Has cautionFeeTransactionId: ${!!o.cautionFeeTransactionId}`);
      console.log(`  Status: ${o.status}`);
      console.log(`  Items: ${o.items?.length || 0} items`);
      o.items?.forEach((item, i) => {
        console.log(`    ${i+1}. ${item.name} (Mode: ${item.mode}, Price: ₦${item.price})`);
      });
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkData();
