const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://biggytech:Biggy%40tech1@cluster0.vkgq2.mongodb.net/empi-app?retryWrites=true&w=majority&appName=Cluster0';

const unifiedOrderSchema = new mongoose.Schema({
  orderNumber: String,
  status: String,
  items: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    mode: String,
  }],
  total: Number,
  createdAt: Date,
}, { collection: 'unified_orders' });

const UnifiedOrder = mongoose.model('UnifiedOrder', unifiedOrderSchema);

async function checkItemModes() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const orders = await UnifiedOrder.find({}).lean();
    
    console.log(`📊 CHECKING ${orders.length} ORDERS FOR MODE VALUES\n`);
    console.log('='.repeat(80));

    let totalBuyItems = 0;
    let totalRentItems = 0;
    let totalUndefinedModes = 0;
    let totalZeroPrices = 0;

    orders.forEach((order, idx) => {
      console.log(`\n📦 ORDER #${idx + 1}: ${order.orderNumber}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Total: ₦${order.total}`);
      console.log(`   Items: ${order.items?.length || 0}`);

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item, itemIdx) => {
          const mode = item.mode || '❌ UNDEFINED';
          const price = item.unitPrice ?? '❌ UNDEFINED';
          
          console.log(`     [${itemIdx}] "${item.name}"`);
          console.log(`         Mode: ${mode}`);
          console.log(`         unitPrice: ${price}`);
          console.log(`         Quantity: ${item.quantity}`);

          if (mode === 'buy') totalBuyItems++;
          else if (mode === 'rent') totalRentItems++;
          else totalUndefinedModes++;

          if (!price || price === 0 || price === '❌ UNDEFINED') totalZeroPrices++;
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY:');
    console.log(`   Buy items: ${totalBuyItems}`);
    console.log(`   Rent items: ${totalRentItems}`);
    console.log(`   Undefined mode: ${totalUndefinedModes}`);
    console.log(`   Zero/undefined prices: ${totalZeroPrices}`);

    if (totalBuyItems > 0 && totalRentItems === 0) {
      console.log('\n❌ PROBLEM: All items are BUY mode, but dashboard shows all as RENTALS!');
    } else if (totalRentItems > 0 && totalBuyItems === 0) {
      console.log('\n❌ PROBLEM: All items are RENT mode, but you said you made buy orders!');
    } else if (totalBuyItems > 0 && totalRentItems > 0) {
      console.log('\n✅ Data looks correct - mixed buy/rent items.');
      console.log('   Issue must be in the calculation logic.');
    } else if (totalUndefinedModes > 0) {
      console.log('\n❌ PROBLEM: Items have undefined mode!');
      console.log('   Items must have mode = "buy" or "rent"');
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkItemModes();
