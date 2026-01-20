/**
 * Simple test data migration for unified orders
 * Creates test orders in the unified collection for testing
 */

const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

const UnifiedOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  orderType: { type: String, enum: ['custom', 'regular'], required: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  status: { type: String, default: 'pending' },
  currentHandler: { type: String, enum: ['production', 'logistics'], default: 'production' },
  total: { type: Number, default: 0 },
  paymentVerified: { type: Boolean, default: false },
  paymentMethod: String,
  items: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { collection: 'unifiedorders' });

async function migrateTestData() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const UnifiedOrder = mongoose.model('UnifiedOrder', UnifiedOrderSchema);

    // Create test orders
    const testOrders = [
      {
        orderNumber: `TEST-CUSTOM-${Date.now()}`,
        orderType: 'custom',
        email: 'benerd01@gmail.com',
        firstName: 'Test',
        lastName: 'Buyer',
        status: 'pending',
        currentHandler: 'production',
        total: 150,
        paymentVerified: false,
        items: [{ name: 'Custom Order', quantity: 1, price: 150 }],
      },
      {
        orderNumber: `TEST-REGULAR-${Date.now()}`,
        orderType: 'regular',
        email: 'benerd01@gmail.com',
        firstName: 'Test',
        lastName: 'Buyer',
        status: 'pending',
        currentHandler: 'production',
        total: 75,
        paymentVerified: false,
        items: [{ name: 'Regular Order', quantity: 2, price: 37.50 }],
      },
    ];

    const result = await UnifiedOrder.insertMany(testOrders);
    console.log(`✅ Created ${result.length} test orders`);
    result.forEach(order => {
      console.log(`  - ${order.orderNumber} (${order.orderType})`);
    });

    await mongoose.connection.close();
    console.log('✅ Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateTestData();
