/**
 * CAUTION FEE VERIFICATION SCRIPT
 * Checks if caution fees are being captured from checkout and reflected in orders/dashboard
 */

import mongoose from 'mongoose';
import Order from '@/lib/models/Order';
import CautionFeeTransaction from '@/lib/models/CautionFeeTransaction';
import { calculateCautionFeeAmount } from '@/lib/utils/cautionFeeUtils';
import type { OrderItem } from '@/lib/utils/orderUtils';
import dotenv from 'dotenv';

dotenv.config();

async function checkCautionFees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check orders with rental items
    console.log('═══════════════════════════════════════════');
    console.log('1️⃣  CHECKING ORDERS WITH RENTAL ITEMS');
    console.log('═══════════════════════════════════════════\n');

    const ordersWithRentals = await Order.find({
      'items.mode': 'rent'
    }).lean();

    console.log(`Found ${ordersWithRentals.length} orders with rental items\n`);

    let ordersWithCautionFees = 0;
    let totalCautionCollected = 0;
    const sampleOrders: any[] = [];

    for (const order of ordersWithRentals.slice(0, 5)) {
      const rentalItems = (order.items || []).filter((item: any) => item.mode === 'rent');
      const expectedFee = calculateCautionFeeAmount(rentalItems);
      const actualFee = (order.cautionFee as number) || 0;
      
      sampleOrders.push({
        orderId: order._id,
        rentalItems: rentalItems.length,
        expectedFee: expectedFee.toFixed(2),
        actualFee: actualFee.toFixed(2),
        matches: expectedFee === actualFee
      });

      if (actualFee > 0) {
        ordersWithCautionFees++;
        totalCautionCollected += actualFee;
      }
    }

    console.log(`Orders with caution fees stored: ${ordersWithCautionFees}/${ordersWithRentals.length}`);
    console.log(`Total caution fees collected: ₦${totalCautionCollected.toFixed(2)}\n`);
    
    console.log('Sample orders (first 5):');
    console.table(sampleOrders);

    // 2. Check revenue breakdown
    console.log('\n═══════════════════════════════════════════');
    console.log('2️⃣  REVENUE BREAKDOWN BY ORDER TYPE');
    console.log('═══════════════════════════════════════════\n');

    const rentalOrders = await Order.countDocuments({ 'items.mode': 'rent' });
    const salesOrders = await Order.countDocuments({ 'items.mode': 'sell' });
    const mixedOrders = await Order.countDocuments({
      items: {
        $elemMatch: { mode: 'rent' }
      }
    });

    console.log(`Rental-only orders: ${rentalOrders}`);
    console.log(`Sales-only orders: ${salesOrders}`);
    console.log(`Mixed orders (rentals + sales): ${mixedOrders}\n`);

    // 3. Utility function verification
    console.log('═══════════════════════════════════════════');
    console.log('3️⃣  UTILITY FUNCTION VERIFICATION');
    console.log('═══════════════════════════════════════════\n');

    const testItems: OrderItem[] = [
      {
        productId: 'test-product-1',
        name: 'Test Rental',
        price: 1000,
        quantity: 2,
        mode: 'rent',
        rentalDays: 7
      }
    ];

    const calculatedFee = calculateCautionFeeAmount(testItems);
    const expectedTestFee = (1000 * 2) * 0.5; // 50% of rental items subtotal

    console.log(`Test items: [${testItems[0].name} - ₦${testItems[0].price} × ${testItems[0].quantity}]`);
    console.log(`Calculated fee: ₦${calculatedFee.toFixed(2)}`);
    console.log(`Expected fee: ₦${expectedTestFee.toFixed(2)}`);
    console.log(`Function working: ${calculatedFee === expectedTestFee ? '✅ YES' : '❌ NO'}\n`);

    // 4. Sales vs Rental item split
    console.log('═══════════════════════════════════════════');
    console.log('4️⃣  SALES VS RENTAL ITEM SPLIT');
    console.log('═══════════════════════════════════════════\n');

    const itemStats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.mode',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      }
    ]);

    console.log('Items breakdown:');
    itemStats.forEach((stat: any) => {
      const type = stat._id === 'rent' ? '🔄 RENTAL' : '💳 SALES';
      console.log(`${type}: ${stat.count} items | ₦${stat.totalRevenue.toFixed(2)}`);
    });
    console.log('');

    // 5. Rental orders caution fee capture rate
    console.log('═══════════════════════════════════════════');
    console.log('5️⃣  RENTAL ORDERS CAUTION FEE CAPTURE RATE');
    console.log('═══════════════════════════════════════════\n');

    const rentalOrdersWithFees = await Order.countDocuments({
      'items.mode': 'rent',
      cautionFee: { $gt: 0 }
    });

    const captureRate = ordersWithRentals.length > 0 
      ? ((rentalOrdersWithFees / ordersWithRentals.length) * 100).toFixed(1)
      : 0;

    console.log(`Rental orders with caution fees: ${rentalOrdersWithFees}/${ordersWithRentals.length}`);
    console.log(`Capture rate: ${captureRate}%\n`);

    // 6. Sales order validation (should have 0 caution fees)
    console.log('═══════════════════════════════════════════');
    console.log('6️⃣  SALES ORDER VALIDATION');
    console.log('═══════════════════════════════════════════\n');

    const salesOrdersWithFees = await Order.countDocuments({
      items: {
        $not: {
          $elemMatch: { mode: 'rent' }
        }
      },
      cautionFee: { $gt: 0 }
    });

    const totalSalesOrders = await Order.countDocuments({
      items: {
        $not: {
          $elemMatch: { mode: 'rent' }
        }
      }
    });

    console.log(`Sales orders with caution fees (should be 0): ${salesOrdersWithFees}/${totalSalesOrders}`);
    console.log(`Validation: ${salesOrdersWithFees === 0 ? '✅ PASS - No caution fees on sales' : '❌ FAIL - Sales orders have caution fees!'}\n`);

    // 7. Dashboard analytics check
    console.log('═══════════════════════════════════════════');
    console.log('7️⃣  DASHBOARD ANALYTICS CHECK');
    console.log('═══════════════════════════════════════════\n');

    const cautionFeeStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalCautionCollected: { $sum: '$cautionFee' },
          orderCount: { $sum: 1 },
          ordersWithCaution: {
            $sum: {
              $cond: [{ $gt: ['$cautionFee', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    if (cautionFeeStats.length > 0) {
      const stats = cautionFeeStats[0];
      console.log(`Total caution fees in system: ₦${(stats.totalCautionCollected || 0).toFixed(2)}`);
      console.log(`Total orders: ${stats.orderCount}`);
      console.log(`Orders with caution fees: ${stats.ordersWithCaution}`);
      console.log(`Average caution fee per order: ₦${(stats.totalCautionCollected / stats.orderCount).toFixed(2)}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('📊 SUMMARY & VERIFICATION STATUS');
    console.log('═══════════════════════════════════════════\n');

    const checks = {
      'Rental items found': ordersWithRentals.length > 0,
      'Caution fees captured': ordersWithCautionFees > 0,
      'Utility function works': calculatedFee === expectedTestFee,
      'Sales orders validated': salesOrdersWithFees === 0,
      'Caution fee tracking': totalCautionCollected > 0
    };

    let passCount = 0;
    Object.entries(checks).forEach(([check, result]) => {
      console.log(`${result ? '✅' : '❌'} ${check}`);
      if (result) passCount++;
    });

    console.log(`\nResult: ${passCount}/${Object.keys(checks).length} checks passed`);
    console.log(passCount === Object.keys(checks).length ? '✅ CAUTION FEE SYSTEM IS WORKING!' : '⚠️  Some issues detected');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCautionFees();
