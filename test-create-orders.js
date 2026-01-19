#!/usr/bin/env node

/**
 * Test: Create a test order via the API
 * Simulates a sales purchase to verify the system works
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testCreateOrder() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('empi');
    const ordersCollection = db.collection('orders');

    console.log('🧪 Creating test SALES order...\n');

    const testOrder = {
      orderNumber: `TEST-SALES-${Date.now()}`,
      orderType: 'sales',
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@sales.com',
      phone: '08012345678',
      country: 'Nigeria',
      shippingType: 'standard',
      shippingCost: 0,
      subtotal: 15000,
      vat: 1125,
      vatRate: 7.5,
      total: 16125,
      paymentMethod: 'paystack',
      status: 'pending',
      items: [
        {
          productId: 'PROD-001',
          name: 'Wedding Dress',
          quantity: 1,
          price: 15000,
          mode: 'buy',
          selectedSize: 'M',
          rentalDays: 0,
        },
      ],
      isOffline: false,
      isCustomOrder: false,
      paymentStatus: 'pending',
      pricing: {
        subtotal: 15000,
        goodsSubtotal: 15000,
        cautionFee: 0,
        tax: 1125,
        shipping: 0,
        total: 16125,
        discount: 0,
        discountPercentage: 0,
        subtotalAfterDiscount: 15000,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ordersCollection.insertOne(testOrder);
    console.log('✅ Test SALES order created');
    console.log(`   Order ID: ${result.insertedId}`);
    console.log(`   Order Number: ${testOrder.orderNumber}`);
    console.log(`   Order Type: ${testOrder.orderType}`);
    console.log(`   Total: ₦${testOrder.total}`);
    console.log('');

    // Now create a test RENTAL order
    console.log('🧪 Creating test RENTAL order...\n');

    const testRentalOrder = {
      orderNumber: `TEST-RENTAL-${Date.now()}`,
      orderType: 'rental',
      firstName: 'Rental',
      lastName: 'Customer',
      email: 'test@rental.com',
      phone: '08087654321',
      country: 'Nigeria',
      shippingType: 'standard',
      shippingCost: 0,
      subtotal: 5000,
      vat: 375,
      vatRate: 7.5,
      total: 5375,
      paymentMethod: 'paystack',
      status: 'pending',
      items: [
        {
          productId: 'PROD-002',
          name: 'Party Dress',
          quantity: 1,
          price: 5000,
          mode: 'rent',
          selectedSize: 'L',
          rentalDays: 3,
        },
      ],
      isOffline: false,
      isCustomOrder: false,
      paymentStatus: 'pending',
      cautionFee: 2500,
      rentalSchedule: {
        pickupDate: '2026-01-20',
        pickupTime: '10:00',
        returnDate: '2026-01-23',
        pickupLocation: '22 Ejire Street, Surulere',
        rentalDays: 3,
      },
      pricing: {
        subtotal: 5000,
        goodsSubtotal: 5000,
        cautionFee: 2500,
        tax: 375,
        shipping: 0,
        total: 5375,
        discount: 0,
        discountPercentage: 0,
        subtotalAfterDiscount: 5000,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const rentalResult = await ordersCollection.insertOne(testRentalOrder);
    console.log('✅ Test RENTAL order created');
    console.log(`   Order ID: ${rentalResult.insertedId}`);
    console.log(`   Order Number: ${testRentalOrder.orderNumber}`);
    console.log(`   Order Type: ${testRentalOrder.orderType}`);
    console.log(`   Total: ₦${testRentalOrder.total}`);
    console.log('');

    // Verify both orders were created
    console.log('📊 Verifying orders in database...\n');
    const allOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log(`Total orders found: ${allOrders.length}\n`);

    const salesOrders = allOrders.filter(o => o.orderType === 'sales');
    const rentalOrders = allOrders.filter(o => o.orderType === 'rental');

    console.log(`✓ Sales orders: ${salesOrders.length}`);
    salesOrders.forEach(o => {
      console.log(`  - ${o.orderNumber}: ₦${o.total}`);
    });

    console.log(`\n✓ Rental orders: ${rentalOrders.length}`);
    rentalOrders.forEach(o => {
      console.log(`  - ${o.orderNumber}: ₦${o.total} (Caution: ₦${o.cautionFee || 0})`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Test orders created successfully!');
    console.log('Check the dashboard now - it should show:');
    console.log('  • Sales Revenue with the sales orders');
    console.log('  • Rental Revenue with the rental orders');

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testCreateOrder();
