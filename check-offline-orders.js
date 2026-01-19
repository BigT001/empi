import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  rentPrice: Number,
  mode: { type: String, enum: ['buy', 'rent'], required: true },
  selectedSize: String,
  rentalDays: { type: Number, default: 0 },
  imageUrl: String,
});

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    buyerId: String,
    orderNumber: { type: String, required: true, unique: true },
    orderType: { type: String, enum: ['rental', 'sales', 'mixed'] },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    busStop: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'Nigeria' },
    shippingType: String,
    shippingCost: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    vat: { type: Number, default: 0 },
    vatRate: { type: Number, default: 7.5 },
    total: { type: Number, required: true },
    paymentMethod: String,
    status: { type: String, default: 'pending' },
    items: [orderItemSchema],
    isOffline: { type: Boolean, default: false },
    offlineType: String,
    isCustomOrder: { type: Boolean, default: false },
    customOrderId: String,
    cautionFee: Number,
    cautionFeeTransactionId: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

async function checkOfflineOrders() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');

    // Fetch all offline orders
    const offlineOrders = await Order.find({ isOffline: true });
    console.log(`\n📊 Total Offline Orders: ${offlineOrders.length}\n`);

    if (offlineOrders.length === 0) {
      console.log('❌ No offline orders found in database');
      await mongoose.connection.close();
      return;
    }

    // Separate into sales and rentals
    let offlineSalesOrders = [];
    let offlineRentalOrders = [];
    let offlineSalesRevenue = 0;
    let offlineRentalRevenue = 0;

    offlineOrders.forEach((order) => {
      let hasSale = false;
      let hasRental = false;
      let orderSalesRevenue = 0;
      let orderRentalRevenue = 0;

      // Check items
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const itemTotal = item.price * item.quantity;
          if (item.mode === 'buy') {
            hasSale = true;
            orderSalesRevenue += itemTotal;
          } else if (item.mode === 'rent') {
            hasRental = true;
            orderRentalRevenue += itemTotal;
          }
        });
      }

      if (hasSale && !hasRental) {
        offlineSalesOrders.push(order);
        offlineSalesRevenue += orderSalesRevenue;
      } else if (hasRental && !hasSale) {
        offlineRentalOrders.push(order);
        offlineRentalRevenue += orderRentalRevenue;
      }
    });

    console.log('📋 OFFLINE SALES');
    console.log(`   Count: ${offlineSalesOrders.length}`);
    console.log(`   Revenue: ₦${offlineSalesRevenue.toLocaleString()}`);
    if (offlineSalesOrders.length > 0) {
      offlineSalesOrders.slice(0, 3).forEach((order) => {
        console.log(`   - ${order.orderNumber} | ${order.firstName} ${order.lastName} | ₦${order.total.toLocaleString()}`);
      });
      if (offlineSalesOrders.length > 3) {
        console.log(`   ... and ${offlineSalesOrders.length - 3} more`);
      }
    }

    console.log('\n📋 OFFLINE RENTALS');
    console.log(`   Count: ${offlineRentalOrders.length}`);
    console.log(`   Revenue: ₦${offlineRentalRevenue.toLocaleString()}`);
    if (offlineRentalOrders.length > 0) {
      offlineRentalOrders.slice(0, 3).forEach((order) => {
        console.log(`   - ${order.orderNumber} | ${order.firstName} ${order.lastName} | ₦${order.total.toLocaleString()}`);
      });
      if (offlineRentalOrders.length > 3) {
        console.log(`   ... and ${offlineRentalOrders.length - 3} more`);
      }
    }

    console.log('\n💰 SUMMARY');
    console.log(`   Offline Sales Revenue: ₦${offlineSalesRevenue.toLocaleString()}`);
    console.log(`   Offline Rental Revenue: ₦${offlineRentalRevenue.toLocaleString()}`);
    console.log(`   Total Offline Revenue: ₦${(offlineSalesRevenue + offlineRentalRevenue).toLocaleString()}`);

    // Check a sample offline order details
    if (offlineOrders.length > 0) {
      console.log('\n📦 SAMPLE OFFLINE ORDER');
      const sample = offlineOrders[0];
      console.log(`   Order Number: ${sample.orderNumber}`);
      console.log(`   Type: ${sample.offlineType || 'unknown'}`);
      console.log(`   Items Mode: ${sample.items.map(i => i.mode).join(', ')}`);
      console.log(`   Total: ₦${sample.total.toLocaleString()}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Created: ${new Date(sample.createdAt).toLocaleDateString()}`);
    }

    // Check if offline orders are showing up in analytics
    console.log('\n🔍 CHECKING ANALYTICS CALCULATION...');
    const allOrders = await Order.find({});
    console.log(`   Total all orders: ${allOrders.length}`);
    console.log(`   Online orders: ${allOrders.filter(o => !o.isOffline).length}`);
    console.log(`   Offline orders: ${allOrders.filter(o => o.isOffline).length}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOfflineOrders();
