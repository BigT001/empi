import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUri = process.env.MONGODB_URI;

// Expense Schema
const expenseSchema = new mongoose.Schema({
  description: String,
  category: String,
  amount: Number,
  vat: Number,
  isVATApplicable: Boolean,
  vendorName: String,
  status: String,
  date: Date,
  receiptNumber: String,
  notes: String,
  isOffline: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Order Schema
const orderItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  quantity: Number,
  price: Number,
  mode: String,
  rentalDays: Number,
});

const orderSchema = new mongoose.Schema({
  vat: Number,
  createdAt: { type: Date, default: Date.now },
});

const Expense = mongoose.model('Expense', expenseSchema);
const Order = mongoose.model('Order', orderSchema);

async function testExpensesAndVAT() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all expenses
    const expenses = await Expense.find({});
    console.log(`📊 Total Expenses: ${expenses.length}\n`);

    let totalExpensesAmount = 0;
    let totalExpensesVAT = 0;
    let expenseCount = 0;

    if (expenses.length > 0) {
      console.log('💰 EXPENSE BREAKDOWN:');
      expenses.forEach((expense, index) => {
        const amount = expense.amount || 0;
        const vat = expense.vat || 0;
        totalExpensesAmount += amount;
        totalExpensesVAT += vat;
        expenseCount += 1;
        if (index < 3) {
          console.log(`   ${index + 1}. ${expense.description} | ₦${amount.toLocaleString()} | VAT: ₦${vat.toLocaleString()}`);
        }
      });
      if (expenses.length > 3) {
        console.log(`   ... and ${expenses.length - 3} more`);
      }
    }

    console.log(`\n💳 TOTAL EXPENSES: ₦${totalExpensesAmount.toLocaleString()}`);
    console.log(`   VAT on Expenses (Input VAT): ₦${totalExpensesVAT.toLocaleString()}`);
    console.log(`   Expense Count: ${expenseCount}`);

    // Fetch all orders to get output VAT
    const orders = await Order.find({});
    let totalOrderVAT = 0;

    orders.forEach((order) => {
      totalOrderVAT += (order.vat || 0);
    });

    console.log(`\n📦 SALES VAT (Output VAT): ₦${totalOrderVAT.toLocaleString()}`);
    console.log(`   From ${orders.length} orders`);

    // Calculate VAT payable
    const vatPayable = Math.max(0, totalOrderVAT - totalExpensesVAT);

    console.log(`\n📋 VAT CALCULATION`);
    console.log(`   Output VAT (Sales): ₦${totalOrderVAT.toLocaleString()}`);
    console.log(`   Input VAT (Expenses): ₦${totalExpensesVAT.toLocaleString()}`);
    console.log(`   VAT Payable: ₦${vatPayable.toLocaleString()}`);

    console.log(`\n✅ EXPECTED ANALYTICS RESPONSE:`);
    console.log(JSON.stringify({
      expenseMetrics: {
        count: expenseCount,
        totalAmount: totalExpensesAmount,
        totalVAT: totalExpensesVAT,
      },
      vatMetrics: {
        outputVAT: totalOrderVAT,
        inputVAT: totalExpensesVAT,
        vatPayable,
      },
    }, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testExpensesAndVAT();
