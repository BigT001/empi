require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const path = require('path');

const uri = process.env.MONGODB_URI;

(async () => {
  try {
    console.log('[Manual Delete Test] Connecting...');
    await mongoose.connect(uri);
    
    // Build schema inline to avoid import issues
    const unifiedOrderSchema = new mongoose.Schema({
      orderNumber: { type: String, unique: true, index: true },
      orderType: { type: String, enum: ['custom', 'regular'] },
      firstName: String,
      lastName: String,
      email: { type: String, index: true },
      phone: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      buyerId: String,
      items: [
        {
          name: String,
          quantity: Number,
          unitPrice: Number,
          productId: String,
          selectedSize: String,
          imageUrl: String,
          image: String,
        },
      ],
      description: String,
      designUrls: [String],
      requiredQuantity: Number,
      subtotal: Number,
      vat: Number,
      discountPercentage: Number,
      discountAmount: Number,
      shippingCost: Number,
      total: Number,
      paymentReference: String,
      paymentMethod: String,
      paymentVerified: { type: Boolean, default: false, index: true },
      paymentVerifiedAt: Date,
      paymentProofUrl: String,
      status: { type: String, enum: ['pending', 'approved', 'in_production', 'ready_for_delivery', 'delivered', 'cancelled'], default: 'pending', index: true },
      currentHandler: { type: String, enum: ['production', 'logistics'], default: 'production' },
      handoffAt: Date,
      deliveryOption: String,
      shippingType: String,
      trackingNumber: String,
      deliveryDate: Date,
      proposedDeliveryDate: Date,
      productionStartedAt: Date,
      isActive: { type: Boolean, default: true, index: true },
      deletedAt: Date,
      notes: String,
      createdAt: Date,
      updatedAt: Date,
    });
    
    if (mongoose.models.UnifiedOrder) {
      delete mongoose.models.UnifiedOrder;
    }
    const UnifiedOrder = mongoose.model('UnifiedOrder', unifiedOrderSchema);
    
    // Get first pending order
    const order = await UnifiedOrder.findOne({ status: 'pending', isActive: true });
    
    if (!order) {
      console.log('No pending orders found');
      process.exit(0);
    }
    
    console.log('\n📋 Order to delete:');
    console.log('  ID:', order._id.toString());
    console.log('  Number:', order.orderNumber);
    console.log('  isActive (before):', order.isActive);
    
    // Perform the delete
    console.log('\n🗑️  Attempting delete with findByIdAndUpdate...');
    const result = await UnifiedOrder.findByIdAndUpdate(
      order._id,
      {
        isActive: false,
        deletedAt: new Date()
      },
      { new: true }
    );
    
    console.log('Result returned?', !!result);
    if (result) {
      console.log('  isActive (after):', result.isActive);
      console.log('  deletedAt:', result.deletedAt);
    }
    
    // Verify
    console.log('\n✅ Verifying by querying again...');
    const verify = await UnifiedOrder.findById(order._id);
    console.log('Order found?', !!verify);
    if (verify) {
      console.log('  isActive:', verify.isActive);
      console.log('  deletedAt:', verify.deletedAt);
    }
    
    // Check if it's filtered out with isActive query
    console.log('\n🔍 Checking GET with isActive=true filter...');
    const activeCheck = await UnifiedOrder.findOne({ _id: order._id, isActive: true });
    console.log('Order in active list?', !!activeCheck);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

