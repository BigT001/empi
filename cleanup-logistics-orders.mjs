import mongoose from 'mongoose';
import Order from './lib/models/Order.ts';
import CustomOrder from './lib/models/CustomOrder.ts';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupOrders() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi';
    console.log('🔗 Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Delete all orders
    const orderResult = await Order.deleteMany({});
    console.log(`✅ Deleted ${orderResult.deletedCount} orders from Order collection`);

    // Delete all custom orders
    const customOrderResult = await CustomOrder.deleteMany({});
    console.log(`✅ Deleted ${customOrderResult.deletedCount} custom orders from CustomOrder collection`);

    console.log('🎉 All orders have been deleted successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrders();
