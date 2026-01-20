/**
 * MIGRATION SCRIPT: CustomOrder & Order → UnifiedOrder
 * Transforms old dual-collection system into unified order model
 * Usage: MONGODB_URI=... npx ts-node scripts/migrate-to-unified-orders.ts
 */

import mongoose from 'mongoose';
import CustomOrder from '../lib/models/CustomOrder.js';
import Order from '../lib/models/Order.js';
import UnifiedOrder from '../lib/models/UnifiedOrder.js';

// Status mappers
const mapCustomOrderStatus = (status: string): string => ({
  'pending': 'pending', 'approved': 'approved', 'in-progress': 'in_production',
  'ready': 'ready_for_delivery', 'completed': 'delivered', 'rejected': 'cancelled',
}[status] || 'pending');

const mapRegularOrderStatus = (status: string): string => ({
  'pending': 'pending', 'awaiting_payment': 'pending', 'payment_confirmed': 'approved',
  'approved': 'approved', 'in-progress': 'in_production', 'ready': 'ready_for_delivery',
  'completed': 'delivered', 'delivered': 'delivered', 'cancelled': 'cancelled',
}[status] || 'pending');

async function migrateToUnifiedOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Models are now imported, no need to load dynamically

    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Migrate Custom Orders
    // ═══════════════════════════════════════════════════════════════════
    console.log('📦 Step 1: Migrating custom orders...');
    const customOrders = await CustomOrder.find({}).lean();
    
    const migratedCustom = customOrders.map((doc: Record<string, unknown>) => {
      const fullName = (doc.fullName as string) || 'Unknown';
      const [firstName, lastName] = fullName.split(' ');
      
      return {
        orderNumber: doc.orderNumber,
        orderType: 'custom',
        firstName: firstName || 'Unknown',
        lastName: lastName || '',
        email: doc.email,
        phone: (doc.phone as string) || '',
        address: doc.address,
        city: doc.city,
        state: doc.state,
        zipCode: (doc.zipCode as string) || '',
        buyerId: doc.buyerId,
        items: ((doc.quoteItems as Array<Record<string, unknown>>) || []).map((item) => ({
          name: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          productId: null,
        })),
        description: doc.description,
        designUrls: (doc.designUrls as string[]) || [],
        requiredQuantity: doc.quantity,
        subtotal: (doc.quotedPrice as number) || 0,
        vat: 0,
        total: (doc.quotedPrice as number) || 0,
        paymentReference: doc.paymentReference,
        paymentVerified: (doc.paymentVerified as boolean) || false,
        paymentVerifiedAt: doc.paymentConfirmedAt,
        status: mapCustomOrderStatus((doc.status as string) || 'pending'),
        currentHandler: (doc.currentHandler as string) || 'production',
        handoffAt: doc.handoffAt,
        deliveryOption: doc.deliveryOption,
        deliveryDate: doc.deliveryDate,
        proposedDeliveryDate: doc.proposedDeliveryDate,
        productionStartedAt: doc.productionStartedAt,
        isActive: true,
        notes: doc.notes,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    });

    if (migratedCustom.length > 0) {
      await UnifiedOrder.insertMany(migratedCustom);
      console.log(`✅ Migrated ${migratedCustom.length} custom orders\n`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Migrate Regular Orders
    // ═══════════════════════════════════════════════════════════════════
    console.log('📦 Step 2: Migrating regular orders...');
    const regularOrders = await Order.find({
      isCustomOrder: { $ne: true },
      customOrderId: { $eq: null },
    }).lean();

    const migratedRegular = regularOrders.map((doc: Record<string, unknown>) => ({
      orderNumber: doc.orderNumber,
      orderType: 'regular',
      firstName: (doc.firstName as string) || 'Unknown',
      lastName: (doc.lastName as string) || '',
      email: doc.email,
      phone: (doc.phone as string) || '',
      address: doc.address,
      city: doc.city,
      state: doc.state,
      zipCode: (doc.zipCode as string) || '',
      country: doc.country,
      buyerId: doc.buyerId,
      items: ((doc.items as Array<Record<string, unknown>>) || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: (item.unitPrice as number) || (item.price as number),
        productId: item.productId || null,
        selectedSize: item.selectedSize,
        imageUrl: item.imageUrl,
      })),
      subtotal: (doc.subtotal as number) || 0,
      vat: (doc.vat as number) || 0,
      shippingCost: doc.shippingCost,
      total: (doc.total as number) || 0,
      paymentReference: doc.paymentReference,
      paymentMethod: doc.paymentMethod,
      paymentVerified: (doc.paymentStatus as string) === 'confirmed' || false,
      paymentVerifiedAt: doc.paymentConfirmedAt,
      status: mapRegularOrderStatus((doc.status as string) || 'pending'),
      currentHandler: (doc.currentHandler as string) || 'production',
      handoffAt: doc.handoffAt,
      deliveryOption: doc.deliveryOption,
      shippingType: doc.shippingType,
      trackingNumber: doc.trackingNumber,
      deliveryDate: doc.deliveryDate,
      proposedDeliveryDate: doc.proposedDeliveryDate,
      productionStartedAt: doc.productionStartedAt,
      isActive: true,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    if (migratedRegular.length > 0) {
      await UnifiedOrder.insertMany(migratedRegular);
      console.log(`✅ Migrated ${migratedRegular.length} regular orders\n`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Verify Migration
    // ═══════════════════════════════════════════════════════════════════
    const totalMigrated = await UnifiedOrder.countDocuments();
    const customCount = await UnifiedOrder.countDocuments({ orderType: 'custom' });
    const regularCount = await UnifiedOrder.countDocuments({ orderType: 'regular' });

    console.log('📊 Migration Summary:');
    console.log(`   Total: ${totalMigrated} | Custom: ${customCount} | Regular: ${regularCount}\n`);

    if (totalMigrated === migratedCustom.length + migratedRegular.length) {
      console.log('✅ MIGRATION SUCCESSFUL\n');
    } else {
      console.log('⚠️ WARNING - Record count mismatch!\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

migrateToUnifiedOrders();
