const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('unifiedorders');

    console.log('\n📊 Analyzing orders for missing/invalid total fields...\n');

    // Find all orders
    const allOrders = await ordersCollection.find({}).toArray();
    console.log(`📈 Total orders in database: ${allOrders.length}`);

    let missingTotal = 0;
    let invalidTotal = 0;
    let validTotal = 0;
    let updated = 0;

    const updates = [];

    for (const order of allOrders) {
      const hasTotal = order.total !== undefined && order.total !== null;
      const totalIsNumber = typeof order.total === 'number';
      const totalIsValid = totalIsNumber && !isNaN(order.total);

      if (!hasTotal) {
        missingTotal++;
        console.log(`\n❌ Order ${order.orderNumber} (${order._id}) - MISSING total field`);
        console.log(`   - orderType: ${order.orderType}`);
        console.log(`   - subtotal: ${order.subtotal}`);
        console.log(`   - pricing: ${JSON.stringify(order.pricing)}`);

        // Try to calculate total
        let calculatedTotal = 0;
        if (order.orderType === 'custom') {
          // For custom orders, use quotedPrice
          calculatedTotal = order.quotedPrice || 0;
          console.log(`   - Calculated from quotedPrice: ${calculatedTotal}`);
        } else {
          // For regular orders, use pricing.total or subtotal + fees
          if (order.pricing && order.pricing.total) {
            calculatedTotal = order.pricing.total;
            console.log(`   - Calculated from pricing.total: ${calculatedTotal}`);
          } else if (order.subtotal) {
            calculatedTotal = order.subtotal;
            console.log(`   - Calculated from subtotal: ${calculatedTotal}`);
          } else {
            // Last resort: calculate from items
            if (order.items && Array.isArray(order.items)) {
              const itemsTotal = order.items.reduce((sum, item) => {
                return sum + ((item.price || 0) * (item.quantity || 1));
              }, 0);
              calculatedTotal = itemsTotal + (order.cautionFee || 0) + (order.shippingCost || 0);
              console.log(`   - Calculated from items: ${calculatedTotal}`);
            }
          }
        }

        if (calculatedTotal > 0) {
          updates.push({
            _id: order._id,
            oldTotal: order.total,
            newTotal: calculatedTotal,
          });
          console.log(`   ✅ Will update total to: ${calculatedTotal}`);
        } else {
          console.log(`   ⚠️  Could not calculate total, will set to 0`);
          updates.push({
            _id: order._id,
            oldTotal: order.total,
            newTotal: 0,
          });
        }
      } else if (!totalIsNumber) {
        invalidTotal++;
        console.log(`\n⚠️  Order ${order.orderNumber} (${order._id}) - INVALID total type`);
        console.log(`   - total value: ${order.total} (type: ${typeof order.total})`);
        updates.push({
          _id: order._id,
          oldTotal: order.total,
          newTotal: 0,
        });
      } else if (!totalIsValid) {
        invalidTotal++;
        console.log(`\n⚠️  Order ${order.orderNumber} (${order._id}) - INVALID total value (NaN)`);
        updates.push({
          _id: order._id,
          oldTotal: order.total,
          newTotal: 0,
        });
      } else {
        validTotal++;
      }
    }

    console.log(`\n\n📋 SUMMARY:`);
    console.log(`   - Valid totals: ${validTotal}`);
    console.log(`   - Missing totals: ${missingTotal}`);
    console.log(`   - Invalid totals: ${invalidTotal}`);
    console.log(`   - Total to update: ${updates.length}`);

    if (updates.length > 0) {
      console.log(`\n🔄 Applying ${updates.length} updates...\n`);

      for (const update of updates) {
        await ordersCollection.updateOne(
          { _id: update._id },
          { $set: { total: update.newTotal } }
        );
        console.log(`✅ Updated order ${update._id}: ${update.oldTotal} → ${update.newTotal}`);
        updated++;
      }

      console.log(`\n✅ Successfully updated ${updated} orders!`);
    } else {
      console.log(`\n✅ All orders have valid total values!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

main();
