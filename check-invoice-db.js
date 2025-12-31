/**
 * Query Invoice Database
 * 
 * This script checks what invoices exist in the database
 * to verify if payment-triggered invoice generation is working
 */

const mongoose = require('mongoose');

async function queryInvoices() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 INVOICE DATABASE ANALYSIS');
    console.log('='.repeat(60) + '\n');
    
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/empi-costumes';
    console.log(`📡 Connecting to: ${mongoUrl}\n`);
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected\n');
    
    const db = mongoose.connection.db;
    const invoiceCollection = db.collection('invoices');
    
    // Count all invoices
    const totalCount = await invoiceCollection.countDocuments();
    console.log(`📊 Total invoices in database: ${totalCount}\n`);
    
    // Recent invoices
    console.log('📋 LAST 10 INVOICES:');
    console.log('-'.repeat(60));
    
    const recentInvoices = await invoiceCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    if (recentInvoices.length === 0) {
      console.log('   ⚠️  No invoices found\n');
    } else {
      recentInvoices.forEach((inv, idx) => {
        console.log(`\n${idx + 1}. Invoice Number: ${inv.invoiceNumber}`);
        console.log(`   Order Number: ${inv.orderNumber || 'N/A'}`);
        console.log(`   Customer: ${inv.customerName}`);
        console.log(`   Email: ${inv.customerEmail}`);
        console.log(`   Amount: ₦${inv.totalAmount}`);
        console.log(`   Type: ${inv.type} (automatic/manual)`);
        console.log(`   Status: ${inv.status}`);
        console.log(`   Payment Verified: ${inv.paymentVerified ? '✅ YES' : '❌ NO'}`);
        console.log(`   Payment Reference: ${inv.paymentReference || 'N/A'}`);
        console.log(`   Created: ${new Date(inv.createdAt).toLocaleString()}`);
        
        // Show items
        if (inv.items && inv.items.length > 0) {
          console.log(`   Items:`);
          inv.items.forEach(item => {
            console.log(`      - ${item.name} (qty: ${item.quantity}, price: ₦${item.price})`);
          });
        }
      });
    }
    
    // Summary stats
    console.log('\n' + '-'.repeat(60));
    console.log('📊 INVOICE STATISTICS:');
    console.log('-'.repeat(60));
    
    const stats = await invoiceCollection.aggregate([
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byPaymentVerified: [
            { $group: { _id: '$paymentVerified', count: { $sum: 1 } } }
          ],
          totalAmount: [
            { $group: { _id: null, sum: { $sum: '$totalAmount' } } }
          ]
        }
      }
    ]).toArray();
    
    if (stats[0]) {
      const s = stats[0];
      
      console.log('\nBy Type:');
      s.byType.forEach(t => {
        console.log(`   ${t._id || 'unknown'}: ${t.count}`);
      });
      
      console.log('\nBy Status:');
      s.byStatus.forEach(st => {
        console.log(`   ${st._id}: ${st.count}`);
      });
      
      console.log('\nPayment Verified:');
      s.byPaymentVerified.forEach(pv => {
        console.log(`   ${pv._id ? 'Yes ✅' : 'No ❌'}: ${pv.count}`);
      });
      
      if (s.totalAmount[0]) {
        console.log(`\nTotal Value: ₦${s.totalAmount[0].sum}`);
      }
    }
    
    // Check for "Payment for Order" invoices (from payment verification)
    console.log('\n' + '-'.repeat(60));
    console.log('💳 PAYMENT-GENERATED INVOICES:');
    console.log('-'.repeat(60));
    
    const paymentInvoices = await invoiceCollection
      .find({
        'items.name': 'Payment for Order',
        type: 'automatic',
        paymentVerified: true
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    if (paymentInvoices.length === 0) {
      console.log('\n⚠️  No invoices from payment verification found!');
      console.log('   This means Paystack payments haven\'t generated invoices yet.');
      console.log('\n   Next steps to test:');
      console.log('   1. Go to /checkout');
      console.log('   2. Add items to cart');
      console.log('   3. Complete payment with Paystack test card');
      console.log('   4. Run this script again\n');
    } else {
      console.log(`\n✅ Found ${paymentInvoices.length} payment-generated invoices:\n`);
      paymentInvoices.forEach(inv => {
        console.log(`   📄 ${inv.invoiceNumber}`);
        console.log(`      Payment Ref: ${inv.paymentReference}`);
        console.log(`      Customer: ${inv.customerName} (${inv.customerEmail})`);
        console.log(`      Amount: ₦${inv.totalAmount}`);
        console.log(`      Created: ${new Date(inv.createdAt).toLocaleString()}`);
      });
      console.log('\n✅ INVOICE GENERATION FROM PAYMENTS IS WORKING!\n');
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('CONCLUSION:');
    console.log('='.repeat(60));
    
    if (totalCount === 0) {
      console.log('\n❌ No invoices in database yet.');
      console.log('   Make a test payment to generate an invoice.\n');
    } else if (paymentInvoices.length > 0) {
      console.log('\n✅ INVOICE GENERATION IS WORKING!');
      console.log(`   - ${totalCount} total invoices exist`);
      console.log(`   - ${paymentInvoices.length} invoices from payment verification`);
      console.log(`   - Latest: ${recentInvoices[0]?.invoiceNumber}\n`);
    } else {
      console.log('\n⚠️  Invoices exist but none from payment flow yet.');
      console.log('   Make a Paystack payment to test the flow.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

queryInvoices();
