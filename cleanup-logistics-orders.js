const mongoose = require('mongoose');
const Order = require('./lib/models/Order').default;
const CustomOrder = require('./lib/models/CustomOrder').default;

async function cleanupOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/empi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📦 Connected to MongoDB');

    // Delete all orders
    const orderResult = await Order.deleteMany({});
    console.log(`✅ Deleted ${orderResult.deletedCount} orders from Order collection`);

    // Delete all custom orders
    const customOrderResult = await CustomOrder.deleteMany({});
    console.log(`✅ Deleted ${customOrderResult.deletedCount} custom orders from CustomOrder collection`);

    console.log('🎉 All orders have been deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrders();
