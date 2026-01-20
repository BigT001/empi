require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

(async () => {
  try {
    console.log('[API Test] Connecting to database...');
    await mongoose.connect(uri);
    
    // Build schema inline
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
      items: [{ name: String, quantity: Number, unitPrice: Number, productId: String, selectedSize: String, imageUrl: String, image: String }],
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
    
    // Get a pending order to delete
    const orderToDelete = await UnifiedOrder.findOne({ 
      status: 'pending',
      isActive: true,
      orderNumber: { $nin: ['TEST-CUSTOM-1768847279571'] } // Skip the one we already deleted
    });
    
    if (!orderToDelete) {
      console.log('No pending orders available for testing');
      process.exit(0);
    }
    
    console.log('\n📋 Testing delete for:', orderToDelete.orderNumber);
    console.log('  ID:', orderToDelete._id.toString());
    
    // Call the DELETE API
    console.log('\n🌐 Calling DELETE /api/orders/unified/' + orderToDelete._id);
    const response = await fetch(`http://localhost:3000/api/orders/unified/${orderToDelete._id}`, {
      method: 'DELETE',
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ API delete successful');
      
      // Verify in database
      console.log('\n🔍 Verifying in database...');
      const verify = await UnifiedOrder.findById(orderToDelete._id);
      if (verify) {
        console.log('Order isActive:', verify.isActive);
        console.log('Order deletedAt:', verify.deletedAt);
      }
    } else {
      console.log('\n❌ API delete failed');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
