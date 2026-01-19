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

// Utility functions
function calculateOrderRevenue(items) {
  let salesRevenue = 0;
  let rentalRevenue = 0;

  if (!items || items.length === 0) {
    return { salesRevenue, rentalRevenue };
  }

  items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    if (item.mode === 'buy') {
      salesRevenue += itemTotal;
    } else if (item.mode === 'rent') {
      rentalRevenue += itemTotal;
    }
  });

  return { salesRevenue, rentalRevenue };
}

async function testAnalytics() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all orders
    const orders = await Order.find({}, '', { lean: true });
    console.log(`📊 Total Orders: ${orders.length}\n`);

    // Breakdown by online/offline
    let onlineSalesRevenue = 0;
    let onlineRentalRevenue = 0;
    let offlineSalesRevenue = 0;
    let offlineRentalRevenue = 0;
    let onlineTransactionCount = 0;
    let offlineTransactionCount = 0;

    orders.forEach((order) => {
      const isOfflineOrder = Boolean(order.isOffline);
      const items = (order.items ?? []);
      const itemRevenue = calculateOrderRevenue(items);
      
      if (isOfflineOrder) {
        offlineSalesRevenue += itemRevenue.salesRevenue;
        offlineRentalRevenue += itemRevenue.rentalRevenue;
        offlineTransactionCount += 1;
      } else {
        onlineSalesRevenue += itemRevenue.salesRevenue;
        onlineRentalRevenue += itemRevenue.rentalRevenue;
        onlineTransactionCount += 1;
      }
    });

    const totalRevenue = onlineSalesRevenue + onlineRentalRevenue + offlineSalesRevenue + offlineRentalRevenue;

    console.log('💻 ONLINE ORDERS');
    console.log(`   Sales Revenue: ₦${onlineSalesRevenue.toLocaleString()}`);
    console.log(`   Rental Revenue: ₦${onlineRentalRevenue.toLocaleString()}`);
    console.log(`   Transaction Count: ${onlineTransactionCount}`);
    
    console.log('\n🏪 OFFLINE ORDERS');
    console.log(`   Sales Revenue: ₦${offlineSalesRevenue.toLocaleString()}`);
    console.log(`   Rental Revenue: ₦${offlineRentalRevenue.toLocaleString()}`);
    console.log(`   Transaction Count: ${offlineTransactionCount}`);
    
    console.log('\n📈 TOTAL REVENUE BREAKDOWN');
    console.log(`   Online Sales: ₦${onlineSalesRevenue.toLocaleString()}`);
    console.log(`   Online Rentals: ₦${onlineRentalRevenue.toLocaleString()}`);
    console.log(`   Offline Sales: ₦${offlineSalesRevenue.toLocaleString()}`);
    console.log(`   Offline Rentals: ₦${offlineRentalRevenue.toLocaleString()}`);
    console.log(`   ---`);
    console.log(`   TOTAL REVENUE: ₦${totalRevenue.toLocaleString()}`);

    console.log('\n✅ ANALYTICS RESPONSE WILL INCLUDE:');
    console.log(JSON.stringify({
      revenueBreakdown: {
        onlineSalesRevenue,
        onlineRentalRevenue,
      },
      offlineRevenueBreakdown: {
        salesRevenue: offlineSalesRevenue,
        rentalRevenue: offlineRentalRevenue,
      },
      orderTypeBreakdown: {
        online: onlineTransactionCount,
        offline: offlineTransactionCount,
      },
    }, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAnalytics();
