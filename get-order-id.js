require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

(async () => {
  try {
    console.log('[Get Order ID] Connecting...');
    await mongoose.connect(uri);
    
    const unifiedOrderSchema = new mongoose.Schema({
      orderNumber: { type: String },
      status: { type: String },
      isActive: { type: Boolean, default: true },
      createdAt: Date,
    });
    
    if (mongoose.models.UnifiedOrder) {
      delete mongoose.models.UnifiedOrder;
    }
    const UnifiedOrder = mongoose.model('UnifiedOrder', unifiedOrderSchema);
    
    // Get a pending order to delete (skip test ones)
    const order = await UnifiedOrder.findOne({ 
      status: 'pending',
      isActive: true,
      orderNumber: { $nin: ['TEST-CUSTOM-1768847279571', 'TEST-REGULAR-1768847279571'] }
    });
    
    if (order) {
      console.log('ID:', order._id.toString());
      console.log('Number:', order.orderNumber);
    } else {
      console.log('No orders found');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
