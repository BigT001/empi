const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';

async function validateDataConsistency() {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB\n');
    console.log('🔍 WEEKLY DATA VALIDATION REPORT\n');
    console.log('='.repeat(70) + '\n');

    const db = mongoose.connection.db;
    const timestamp = new Date().toISOString();

    // ============================================
    // 1. COLLECTION EXISTENCE CHECK
    // ============================================
    console.log('📋 1. COLLECTION STATUS\n');
    const requiredCollections = [
      'unifiedorders',
      'orders',
      'expenses',
      'invoices',
      'cautionfeetransactions',
      'customorders',
      'buyers',
      'products',
      'admins'
    ];

    const allCollections = await db.listCollections().toArray();
    const existingNames = new Set(allCollections.map(c => c.name));

    for (const collName of requiredCollections) {
      const exists = existingNames.has(collName);
      const symbol = exists ? '✅' : '⚠️';
      console.log(`   ${symbol} ${collName.padEnd(25)} - ${exists ? 'EXISTS' : 'MISSING'}`);
    }
    console.log('');

    // ============================================
    // 2. DOCUMENT COUNT VALIDATION
    // ============================================
    console.log('📊 2. DOCUMENT COUNTS\n');

    const counts = {};
    for (const collName of requiredCollections) {
      try {
        const col = db.collection(collName);
        counts[collName] = await col.countDocuments();
      } catch (e) {
        counts[collName] = 0;
      }
    }

    const onlineOrders = counts.unifiedorders || 0;
    const offlineOrders = counts.orders || 0;
    const expenses = counts.expenses || 0;
    const invoices = counts.invoices || 0;
    const customOrders = counts.customorders || 0;

    console.log(`   Online Orders (UnifiedOrder): ${onlineOrders}`);
    console.log(`   Offline Orders (Order.isOffline): ${offlineOrders}`);
    console.log(`   Expenses: ${expenses}`);
    console.log(`   Invoices: ${invoices}`);
    console.log(`   Custom Orders: ${customOrders}`);
    console.log(`   Buyers: ${counts.buyers}`);
    console.log(`   Products: ${counts.products}`);
    console.log(`   Admins: ${counts.admins}`);
    console.log('');

    // ============================================
    // 3. REVENUE CONSISTENCY CHECK
    // ============================================
    console.log('💰 3. REVENUE CONSISTENCY\n');

    const ordersCol = db.collection('orders');
    const unifiedCol = db.collection('unifiedorders');
    const invoicesCol = db.collection('invoices');

    const [onlineOrdersList, offlineOrdersList, invoicesList] = await Promise.all([
      unifiedCol.find({}, { projection: { total: 1, status: 1, createdAt: 1 } }).toArray(),
      ordersCol.find({ isOffline: true }, { projection: { total: 1, status: 1, createdAt: 1 } }).toArray(),
      invoicesCol.find({}, { projection: { totalAmount: 1, orderNumber: 1 } }).toArray()
    ]);

    const onlineTotal = onlineOrdersList.reduce((sum, o) => sum + (o.total || 0), 0);
    const offlineTotal = offlineOrdersList.reduce((sum, o) => sum + (o.total || 0), 0);
    const invoiceTotal = invoicesList.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    console.log(`   Online Orders Total: ₦${onlineTotal.toLocaleString('en-NG')}`);
    console.log(`   Offline Orders Total: ₦${offlineTotal.toLocaleString('en-NG')}`);
    console.log(`   Combined Orders: ₦${(onlineTotal + offlineTotal).toLocaleString('en-NG')}`);
    console.log(`   Invoices Total: ₦${invoiceTotal.toLocaleString('en-NG')}`);

    const discrepancy = Math.abs((onlineTotal + offlineTotal) - invoiceTotal);
    if (discrepancy > 0.01) {
      console.log(`   ⚠️ DISCREPANCY FOUND: ₦${discrepancy.toFixed(2)}`);
    } else {
      console.log(`   ✅ Revenue matches between orders and invoices`);
    }
    console.log('');

    // ============================================
    // 4. ORDER STATUS VALIDATION
    // ============================================
    console.log('📦 4. ORDER STATUS VALIDATION\n');

    const validStatuses = ['pending', 'confirmed', 'completed', 'delivered', 'processing', 'shipped', 'cancelled', 'refunded', 'returned'];
    
    let invalidStatusCount = 0;
    const allOrders = [...onlineOrdersList, ...offlineOrdersList];
    
    for (const order of allOrders) {
      if (order.status && !validStatuses.includes(order.status)) {
        invalidStatusCount++;
      }
    }

    if (invalidStatusCount > 0) {
      console.log(`   ⚠️ Invalid statuses found: ${invalidStatusCount}`);
    } else {
      console.log(`   ✅ All orders have valid statuses`);
    }

    const statusCounts = {};
    for (const order of allOrders) {
      const status = order.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });
    console.log('');

    // ============================================
    // 5. EXPENSE VALIDATION
    // ============================================
    console.log('🧾 5. EXPENSE VALIDATION\n');

    const expensesCol = db.collection('expenses');
    const expensesList = await expensesCol.find({}, { projection: { amount: 1, vat: 1, isVATApplicable: 1, status: 1, category: 1 } }).toArray();

    const totalExpenses = expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalVAT = expensesList.reduce((sum, e) => {
      return sum + (e.isVATApplicable !== false ? (e.vat || 0) : 0);
    }, 0);

    console.log(`   Total Expenses: ₦${totalExpenses.toLocaleString('en-NG')}`);
    console.log(`   Deductible VAT: ₦${totalVAT.toLocaleString('en-NG')}`);
    console.log(`   Expense Count: ${expensesList.length}`);

    // Check for VAT mismatches
    let vatMismatches = 0;
    for (const expense of expensesList) {
      if (expense.isVATApplicable !== false) {
        const expectedVAT = Math.round((expense.amount * 0.075) * 100) / 100;
        const actualVAT = expense.vat || 0;
        if (Math.abs(expectedVAT - actualVAT) > 0.01) {
          vatMismatches++;
        }
      }
    }

    if (vatMismatches > 0) {
      console.log(`   ⚠️ VAT calculation mismatches: ${vatMismatches}`);
    } else {
      console.log(`   ✅ All VAT calculations are correct`);
    }

    // Category breakdown
    const categories = {};
    for (const expense of expensesList) {
      const cat = expense.category || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    }

    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`      ${cat}: ${count}`);
    });
    console.log('');

    // ============================================
    // 6. INVOICE-ORDER SYNC CHECK
    // ============================================
    console.log('🔗 6. INVOICE-ORDER SYNC\n');

    const invoiceOrderNumbers = new Set(invoicesList.map(i => i.orderNumber));
    const orderNumbers = new Set([
      ...onlineOrdersList.map(o => o.orderNumber),
      ...offlineOrdersList.map(o => o.orderNumber)
    ]);

    let unmatchedInvoices = 0;
    let unmatchedOrders = 0;

    for (const invON of invoiceOrderNumbers) {
      if (!orderNumbers.has(invON)) {
        unmatchedInvoices++;
      }
    }

    for (const orderON of orderNumbers) {
      if (!invoiceOrderNumbers.has(orderON)) {
        unmatchedOrders++;
      }
    }

    if (unmatchedInvoices > 0 || unmatchedOrders > 0) {
      console.log(`   ⚠️ Sync issues detected:`);
      if (unmatchedInvoices > 0) console.log(`      Invoices without orders: ${unmatchedInvoices}`);
      if (unmatchedOrders > 0) console.log(`      Orders without invoices: ${unmatchedOrders}`);
    } else {
      console.log(`   ✅ All invoices match orders (perfect sync)`);
    }
    console.log('');

    // ============================================
    // 7. DATA QUALITY CHECKS
    // ============================================
    console.log('✨ 7. DATA QUALITY\n');

    let missingEmails = 0;
    let missingNames = 0;
    const buyersCol = db.collection('buyers');
    const buyersList = await buyersCol.find({}).toArray();

    for (const buyer of buyersList) {
      if (!buyer.email) missingEmails++;
      if (!buyer.fullName) missingNames++;
    }

    if (missingEmails > 0 || missingNames > 0) {
      console.log(`   ⚠️ Buyer data issues:`);
      if (missingEmails > 0) console.log(`      Missing emails: ${missingEmails}`);
      if (missingNames > 0) console.log(`      Missing names: ${missingNames}`);
    } else {
      console.log(`   ✅ All buyers have complete data`);
    }

    // Check for duplicate order numbers
    const allOrderNumbers = [];
    for (const order of allOrders) {
      if (order.orderNumber) allOrderNumbers.push(order.orderNumber);
    }

    const duplicates = new Set();
    const seen = new Set();
    for (const on of allOrderNumbers) {
      if (seen.has(on)) {
        duplicates.add(on);
      }
      seen.add(on);
    }

    if (duplicates.size > 0) {
      console.log(`   ⚠️ Duplicate order numbers found: ${duplicates.size}`);
    } else {
      console.log(`   ✅ No duplicate order numbers`);
    }
    console.log('');

    // ============================================
    // 8. SUMMARY & RECOMMENDATIONS
    // ============================================
    console.log('📋 8. SUMMARY & RECOMMENDATIONS\n');

    const issues = [];
    
    if (invalidStatusCount > 0) issues.push('Invalid order statuses');
    if (discrepancy > 0.01) issues.push('Revenue discrepancy between orders and invoices');
    if (vatMismatches > 0) issues.push('VAT calculation mismatches');
    if (unmatchedInvoices > 0 || unmatchedOrders > 0) issues.push('Invoice-order sync issues');
    if (missingEmails > 0 || missingNames > 0) issues.push('Incomplete buyer data');
    if (duplicates.size > 0) issues.push('Duplicate order numbers');

    if (issues.length === 0) {
      console.log('   ✅ ALL CHECKS PASSED - Database is healthy!\n');
    } else {
      console.log(`   ⚠️ ISSUES FOUND (${issues.length}):\n`);
      issues.forEach((issue, i) => {
        console.log(`      ${i + 1}. ${issue}`);
      });
      console.log('');
    }

    // ============================================
    // 9. FINAL STATISTICS
    // ============================================
    console.log('📈 9. FINAL STATISTICS\n');

    console.log(`   Validation Date: ${timestamp}`);
    console.log(`   Total Orders: ${allOrders.length}`);
    console.log(`   Total Revenue: ₦${(onlineTotal + offlineTotal).toLocaleString('en-NG')}`);
    console.log(`   Total Expenses: ₦${totalExpenses.toLocaleString('en-NG')}`);
    console.log(`   Total Deductible VAT: ₦${totalVAT.toLocaleString('en-NG')}`);
    console.log(`   Gross Profit: ₦${((onlineTotal + offlineTotal) - totalExpenses).toLocaleString('en-NG')}`);
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ Validation complete!\n');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

validateDataConsistency();
