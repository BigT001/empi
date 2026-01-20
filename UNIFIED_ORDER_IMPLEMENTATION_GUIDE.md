# 🚀 QUICK IMPLEMENTATION GUIDE: Simplified Order System

**For:** EMPI Order Management System  
**Goal:** Convert dual collection system to unified order model  
**Estimated Time:** 3-4 weeks  
**Complexity:** Medium

---

## 📋 CHECKLIST: Step-by-Step Implementation

### **PHASE 1: DATABASE & MODELS** (Days 1-3)

#### Step 1.1: Create Unified Order Model
```typescript
// lib/models/UnifiedOrder.ts (NEW)
import mongoose from 'mongoose';

const unifiedOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  
  // CRITICAL: Single discriminator
  orderType: {
    type: String,
    enum: ['custom', 'regular'],
    required: true,
    index: true,
  },
  
  // Customer Info (common)
  firstName: String,
  lastName: String,
  fullName: String,
  email: {
    type: String,
    required: true,
    index: true,
  },
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  
  // Items (ALWAYS array - no quoteItems vs items)
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    productId: String, // null for custom orders
    selectedSize: String,
    imageUrl: String,
  }],
  
  // Custom Order Specific
  description: String,
  designUrls: [String],
  requiredQuantity: Number,
  
  // Pricing
  subtotal: Number,
  vat: Number,
  discountPercentage: Number,
  total: {
    type: Number,
    required: true,
  },
  
  // Payment
  paymentReference: String,
  paymentVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  paymentConfirmedAt: Date,
  paymentProof: String,
  
  // SIMPLIFIED STATUS MODEL (6 instead of 9)
  status: {
    type: String,
    enum: ['pending', 'approved', 'in_production', 'ready_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  
  // Logistics
  currentHandler: {
    type: String,
    enum: ['production', 'logistics'],
    default: 'production',
    index: true,
  },
  handoffAt: Date,
  deliveryOption: {
    type: String,
    enum: ['pickup', 'delivery'],
  },
  shippingType: {
    type: String,
    enum: ['self', 'empi', 'standard'],
  },
  trackingNumber: String,
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
  // For soft deletes
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Legacy compatibility (during migration)
  migrationNote: String,
  _legacyCustomOrderId: String,
  _legacyOrderId: String,
});

// Add compound indexes for common queries
unifiedOrderSchema.index({ email: 1, status: 1 });
unifiedOrderSchema.index({ currentHandler: 1, status: 1 });
unifiedOrderSchema.index({ paymentVerified: 1, status: 1 });

export default mongoose.models.UnifiedOrder || mongoose.model('UnifiedOrder', unifiedOrderSchema);
```

**Checklist:**
- [ ] Create file: lib/models/UnifiedOrder.ts
- [ ] Test schema compiles
- [ ] Verify all indexes
- [ ] Add type definitions

---

#### Step 1.2: Create Data Migration Script
```typescript
// scripts/migrate-to-unified-orders.ts (NEW)
import mongoose from 'mongoose';
import CustomOrder from '@/lib/models/CustomOrder';
import Order from '@/lib/models/Order';
import UnifiedOrder from '@/lib/models/UnifiedOrder';

async function migrateToUnifiedOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    console.log('🔄 Starting data migration...\n');
    
    // STEP 1: Migrate Custom Orders
    console.log('📦 Migrating custom orders...');
    const customOrders = await CustomOrder.find().lean();
    
    const migratedCustom = customOrders.map(doc => ({
      ...doc,
      _id: new mongoose.Types.ObjectId(),
      orderType: 'custom',
      items: doc.quoteItems || [], // Convert quoteItems to items
      requiredQuantity: doc.quantity,
      currentHandler: 'production',
      _legacyCustomOrderId: doc._id.toString(),
      migrationNote: 'Migrated from customorders collection',
    }));
    
    const customResult = await UnifiedOrder.insertMany(migratedCustom);
    console.log(`✅ Migrated ${customResult.length} custom orders`);
    
    // STEP 2: Migrate Regular Orders
    console.log('📦 Migrating regular orders...');
    const regularOrders = await Order.find().lean();
    
    const migratedRegular = regularOrders.map(doc => ({
      ...doc,
      _id: new mongoose.Types.ObjectId(),
      orderType: 'regular',
      items: doc.items || [], // items already in right format
      currentHandler: 'production',
      _legacyOrderId: doc._id.toString(),
      migrationNote: 'Migrated from orders collection',
    }));
    
    const regularResult = await UnifiedOrder.insertMany(migratedRegular);
    console.log(`✅ Migrated ${regularResult.length} regular orders`);
    
    // STEP 3: Verify counts
    const totalMigrated = await UnifiedOrder.countDocuments();
    console.log(`\n✅ Total unified orders: ${totalMigrated}`);
    console.log(`📊 Custom: ${customResult.length}, Regular: ${regularResult.length}`);
    
    console.log('\n✅ Migration complete! Next steps:');
    console.log('   1. Backup both old collections');
    console.log('   2. Archive old collections');
    console.log('   3. Update API endpoints to use UnifiedOrder');
    console.log('   4. Test thoroughly before deleting old collections');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run: npx ts-node scripts/migrate-to-unified-orders.ts
migrateToUnifiedOrders();
```

**Checklist:**
- [ ] Create migration script
- [ ] Test on TEST database first
- [ ] Verify data integrity after migration
- [ ] Count records match (before + after)
- [ ] Check no data loss

---

### **PHASE 2: API ENDPOINTS** (Days 4-6)

#### Step 2.1: Create Unified Orders API
```typescript
// app/api/orders/unified/route.ts (NEW - replaces dual endpoints)
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';

/**
 * GET /api/orders/unified
 * Fetch orders with filtering by type, status, email, etc.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const orderType = searchParams.get('orderType'); // 'custom' | 'regular' | null (all)
    const currentHandler = searchParams.get('currentHandler');
    
    const query: any = { isActive: true };
    
    if (email) query.email = email;
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (currentHandler) query.currentHandler = currentHandler;
    
    const orders = await UnifiedOrder.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error('[API] GET /orders/unified failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/unified
 * Create new order (both custom and regular)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Generate order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderNumber = `ORD-${timestamp}-${random}`;
    
    const newOrder = await UnifiedOrder.create({
      ...body,
      orderNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      order: newOrder,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /orders/unified failed:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/unified/:id
 * Update order status, payment verification, etc.
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const { pathname } = new URL(request.url);
    const orderId = pathname.split('/').pop();
    const body = await request.json();
    
    // Check if status is changing to 'ready_for_delivery' → trigger auto-handoff
    if (body.status === 'ready_for_delivery') {
      body.currentHandler = 'logistics';
      body.handoffAt = new Date();
    }
    
    const updated = await UnifiedOrder.findByIdAndUpdate(
      orderId,
      {
        ...body,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      order: updated,
    });
  } catch (error) {
    console.error('[API] PATCH /orders/unified failed:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
```

**Checklist:**
- [ ] Create unified orders API
- [ ] Test GET (all scenarios)
- [ ] Test POST (custom + regular)
- [ ] Test PATCH (status changes)
- [ ] Verify auto-handoff logic
- [ ] Add proper error handling

---

#### Step 2.2: Unified Payment Verification
```typescript
// app/api/verify-payment/unified/route.ts (NEW)
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import Invoice from '@/lib/models/Invoice';
import Message from '@/lib/models/Message';

/**
 * GET /api/verify-payment/unified
 * Verify payment for any order type (custom or regular)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }
    
    // Find order by payment reference
    const order = await UnifiedOrder.findOne({ paymentReference: reference });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Verify payment with gateway (Paystack)
    const paymentValid = await verifyPaystackPayment(reference);
    
    if (!paymentValid) {
      return NextResponse.json({ success: false, error: 'Payment invalid' }, { status: 400 });
    }
    
    // Create invoice
    const invoice = await Invoice.create({
      orderNumber: order.orderNumber,
      paymentReference: reference,
      paymentVerified: true,
      customerEmail: order.email,
      items: order.items,
      subtotal: order.subtotal,
      vat: order.vat,
      total: order.total,
    });
    
    // Update order (SINGLE status change now!)
    const updated = await UnifiedOrder.findByIdAndUpdate(
      order._id,
      {
        paymentVerified: true,
        paymentConfirmedAt: new Date(),
        status: 'approved', // Simple!
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    // Send notifications
    await Message.create({
      orderId: order._id,
      senderType: 'admin',
      senderName: 'System',
      content: '✅ Payment verified! Your order is now approved and will enter production.',
      messageType: 'system',
    });
    
    return NextResponse.json({
      success: true,
      order: updated,
      invoice: invoice,
    });
  } catch (error) {
    console.error('[Unified Payment] Error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}

async function verifyPaystackPayment(reference: string): Promise<boolean> {
  // Call Paystack API
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  
  const data = await response.json();
  return data.status && data.data.status === 'success';
}
```

**Checklist:**
- [ ] Create unified payment verification
- [ ] Test with sample Paystack payment
- [ ] Verify invoice creation
- [ ] Check order status updates correctly
- [ ] Notifications sent properly

---

### **PHASE 3: FRONTEND UPDATES** (Days 7-9)

#### Step 3.1: Update Dashboard to Use Unified Orders
```typescript
// app/dashboard/page.tsx (UPDATE)
// Change from:
// const customOrders = await fetch('/api/custom-orders');
// const regularOrders = await fetch('/api/orders');

// To:
// const orders = await fetch('/api/orders/unified?email=' + email);

// Display both types in single list with type badge
export async function getOrders(email: string) {
  const response = await fetch(`/api/orders/unified?email=${email}`);
  const data = await response.json();
  
  return data.orders; // Already contains both custom and regular!
}
```

**Checklist:**
- [ ] Update dashboard fetch logic
- [ ] Combine custom + regular into single list
- [ ] Remove sessionStorage usage
- [ ] Test with sample orders
- [ ] Verify order display correct

---

#### Step 3.2: Update Logistics Page
```typescript
// app/admin/logistics/page.tsx (UPDATE)

// Change from:
// const orders = sessionStorage.getItem('logistics_orders');

// To:
// const orders = await fetch('/api/orders/unified?currentHandler=logistics');

export async function fetchLogisticsOrders() {
  const response = await fetch(
    '/api/orders/unified?currentHandler=logistics&status=ready_for_delivery'
  );
  const data = await response.json();
  return data.orders;
}
```

**Checklist:**
- [ ] Remove sessionStorage dependencies
- [ ] Query from unified API
- [ ] Test orders appear correctly
- [ ] Test status transitions
- [ ] Verify delivery information displays

---

### **PHASE 4: TESTING** (Days 10-14)

#### Test Case 1: Create Custom Order
```javascript
// Test: Custom Order Flow
const customOrder = {
  orderType: 'custom',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '08100000000',
  address: '123 Main St',
  city: 'Lagos',
  description: 'Custom gown with embroidery',
  designUrls: ['url1', 'url2'],
  requiredQuantity: 3,
  items: [
    { name: 'Custom Gown', quantity: 3, unitPrice: 50000, productId: null }
  ],
  subtotal: 150000,
  vat: 24000,
  total: 174000,
  status: 'pending',
  currentHandler: 'production',
};

// POST /api/orders/unified
// Verify: order created with orderType: 'custom'
```

**Checklist:**
- [ ] Create custom order ✓
- [ ] Create regular order ✓
- [ ] Pay for order ✓
- [ ] Verify payment ✓
- [ ] Check status → 'approved' ✓
- [ ] Mark ready → auto-handoff ✓
- [ ] Check currentHandler → 'logistics' ✓

---

#### Test Case 2: Regular Order Flow
```javascript
const regularOrder = {
  orderType: 'regular',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  items: [
    { name: 'Dress', quantity: 2, unitPrice: 35000, productId: 'prod123', selectedSize: 'M' }
  ],
  subtotal: 70000,
  vat: 11200,
  total: 81200,
  status: 'pending',
};

// POST /api/orders/unified
// Verify: order created with orderType: 'regular'
```

**Checklist:**
- [ ] Load test with 100+ orders
- [ ] Stress test payment processing
- [ ] Test rapid status changes
- [ ] Verify no data loss
- [ ] Check database performance

---

### **PHASE 5: DEPLOYMENT & CLEANUP** (Days 15-21)

#### Step 5.1: Backup Old Data
```bash
# Backup before migration
mongodump --uri="mongodb://..." --out=backup_2026_01_19

# Archive old collections
# db.customorders.renameCollection('customorders_archive')
# db.orders.renameCollection('orders_archive')
```

**Checklist:**
- [ ] Full backup created
- [ ] Verify backup integrity
- [ ] Store safely
- [ ] Document backup location

---

#### Step 5.2: Production Deployment
```bash
# 1. Deploy new code
git commit -m "feat: unified order model"
git push
npm run build
npm run deploy

# 2. Run migration
npx ts-node scripts/migrate-to-unified-orders.ts

# 3. Verify data
db.unifiedorders.count() # Should match old + custom counts

# 4. Monitor
tail -f logs/production.log

# 5. Rollback plan (if needed)
# - Revert code
# - Drop unifiedorders
# - Re-archive original collections
```

**Checklist:**
- [ ] Code deployed
- [ ] Migration ran successfully
- [ ] Data counts verified
- [ ] API endpoints working
- [ ] Monitoring in place
- [ ] Rollback tested

---

## 📊 SUCCESS METRICS

After implementation, verify:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| API endpoints for orders | 6+ | 3 | ✅ |
| Database collections queried | 2 | 1 | ✅ |
| Order duplication issues | High | 0 | ✅ |
| sessionStorage failures | Frequent | 0 | ✅ |
| Code for order logic | 2000+ LOC | 1200 LOC | ✅ |
| Team understanding | Confused | Clear | ✅ |

---

## 🚨 ROLLBACK PLAN (If needed)

If migration has issues:

1. **Stop traffic** - Disable new order creation
2. **Revert code** - `git revert` to previous version
3. **Drop new collection** - `db.unifiedorders.deleteMany({})`
4. **Un-archive old** - `db.customorders_archive.renameCollection('customorders')`
5. **Re-enable** - Resume operations
6. **Investigate** - Figure out issue and retry

**Estimated rollback time: 30 minutes max**

---

## 💬 COMMON QUESTIONS

**Q: What about existing orders?**  
A: Migration script converts all old orders to new format. Legacy IDs stored in `_legacyCustomOrderId` and `_legacyOrderId`.

**Q: Can we keep both old and new systems running?**  
A: Not recommended. Clean migration is better. Run on test DB first if unsure.

**Q: What if payment system breaks during migration?**  
A: Don't accept payments during migration window. Schedule during low-traffic time (late night).

**Q: How long does migration take?**  
A: ~2-5 seconds per 1,000 orders. Most migrations < 10 seconds total.

**Q: Do we lose any data?**  
A: No. All data transferred. Original collections archived for safety.

---

**Next Action:** Choose your preferred implementation sequence and begin Phase 1!

