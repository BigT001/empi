import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

// Schemas
const orderItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  quantity: Number,
  price: Number,
  mode: String,
  rentalDays: Number,
});

const orderSchema = new mongoose.Schema({
  orderNumber: String,
  vat: Number,
  isOffline: Boolean,
  items: [orderItemSchema],
  createdAt: { type: Date, default: Date.now },
});

const expenseSchema = new mongoose.Schema({
  description: String,
  category: String,
  amount: Number,
  vat: Number,
  isVATApplicable: Boolean,
  vendorName: String,
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);
const Expense = mongoose.model('Expense', expenseSchema);

// Revenue calculation utility
function calculateOrderRevenue(items) {
  let salesRevenue = 0;
  let rentalRevenue = 0;
  if (!items || items.length === 0) return { salesRevenue, rentalRevenue };
  
  items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    if (item.mode === 'buy') {
      salesRevenue += itemTotal;
    } else if (item.mode === 'rent') {
      rentalRevenue += itemTotal;
    }
  });
  return { salesRevenue, rentalRevenue };
}

async function simulateAnalyticsEndpoint() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Fetch orders and expenses
    const orders = await Order.find({}, '', { lean: true });
    const expenses = await Expense.find({}, '', { lean: true });

    console.log(`📊 DATA RETRIEVED:`);
    console.log(`   Orders: ${orders.length}`);
    console.log(`   Expenses: ${expenses.length}\n`);

    // ===== EXPENSE METRICS =====
    let totalExpensesAmount = 0;
    let totalExpensesVAT = 0;
    let expenseCount = 0;

    expenses.forEach((expense) => {
      const expenseAmount = expense.amount || 0;
      const expenseVAT = expense.vat || 0;
      totalExpensesAmount += expenseAmount;
      totalExpensesVAT += expenseVAT;
      expenseCount += 1;
    });

    // ===== VAT METRICS =====
    let totalOrderVAT = 0;
    let totalExpenseVATDeductible = 0;

    orders.forEach((order) => {
      const orderVAT = order.vat || 0;
      totalOrderVAT += orderVAT;
    });

    expenses.forEach((expense) => {
      const isVATApplicable = expense.isVATApplicable !== false;
      if (isVATApplicable) {
        const expenseVAT = expense.vat || 0;
        totalExpenseVATDeductible += expenseVAT;
      }
    });

    const vatPayable = Math.max(0, totalOrderVAT - totalExpenseVATDeductible);

    // ===== ONLINE/OFFLINE BREAKDOWN =====
    let onlineSalesRevenue = 0;
    let onlineRentalRevenue = 0;
    let offlineSalesRevenue = 0;
    let offlineRentalRevenue = 0;
    let onlineTransactionCount = 0;
    let offlineTransactionCount = 0;

    orders.forEach((order) => {
      const isOfflineOrder = Boolean(order.isOffline);
      const items = order.items ?? [];
      const itemRevenue = calculateOrderRevenue(items);
      
      if (isOfflineOrder) {
        offlineSalesRevenue += itemRevenue.salesRevenue;
        offlineRentalRevenue += itemRevenue.rentalRevenue;
        offlineTransactionCount += 1;
      } else {
        onlineSalesRevenue += itemRevenue.salesRevenue;
        onlineRentalRevenue += itemRevenue.rentalRevenue;
        onlineTransactionCount += 1;
      }
    });

    const totalRevenue = onlineSalesRevenue + onlineRentalRevenue + offlineSalesRevenue + offlineRentalRevenue;

    // ===== BUILD RESPONSE =====
    const response = {
      revenueBreakdown: {
        onlineSalesRevenue,
        onlineRentalRevenue,
      },
      offlineRevenueBreakdown: {
        salesRevenue: offlineSalesRevenue,
        rentalRevenue: offlineRentalRevenue,
      },
      orderTypeBreakdown: {
        online: onlineTransactionCount,
        offline: offlineTransactionCount,
      },
      expenseMetrics: {
        count: expenseCount,
        totalAmount: totalExpensesAmount,
        totalVAT: totalExpensesVAT,
      },
      vatMetrics: {
        totalVAT: totalOrderVAT + totalExpensesVAT,
        inputVAT: totalExpenseVATDeductible,
        outputVAT: totalOrderVAT,
        vatPayable,
        vatExempt: 0,
      },
    };

    console.log('💰 CALCULATED METRICS:\n');
    console.log('📊 REVENUE BREAKDOWN:');
    console.log(`   Online Sales: ₦${onlineSalesRevenue.toLocaleString()}`);
    console.log(`   Online Rentals: ₦${onlineRentalRevenue.toLocaleString()}`);
    console.log(`   Offline Sales: ₦${offlineSalesRevenue.toLocaleString()}`);
    console.log(`   Offline Rentals: ₦${offlineRentalRevenue.toLocaleString()}`);
    console.log(`   TOTAL REVENUE: ₦${totalRevenue.toLocaleString()}`);

    console.log('\n💳 EXPENSE METRICS:');
    console.log(`   Total Expenses: ₦${totalExpensesAmount.toLocaleString()}`);
    console.log(`   VAT on Expenses: ₦${totalExpensesVAT.toLocaleString()}`);
    console.log(`   Expense Count: ${expenseCount}`);

    console.log('\n📋 VAT CALCULATION:');
    console.log(`   Output VAT (Sales): ₦${totalOrderVAT.toLocaleString()}`);
    console.log(`   Input VAT (Expenses): ₦${totalExpenseVATDeductible.toLocaleString()}`);
    console.log(`   VAT Payable: ₦${vatPayable.toLocaleString()}`);

    console.log('\n✅ ANALYTICS RESPONSE:');
    console.log(JSON.stringify(response, null, 2));

    console.log('\n✅ FINANCE DASHBOARD WILL DISPLAY:');
    console.log(`   Total Revenue: ₦${totalRevenue.toLocaleString()}`);
    console.log(`   Daily Expenses: ₦${totalExpensesAmount.toLocaleString()}`);
    console.log(`   VAT Due: ₦${vatPayable.toLocaleString()}`);
    console.log(`   Gross Profit: ₦${(totalRevenue - totalExpensesAmount).toLocaleString()}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

simulateAnalyticsEndpoint();
