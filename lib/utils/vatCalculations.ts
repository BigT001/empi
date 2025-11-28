import Order from '@/lib/models/Order';
import Expense from '@/lib/models/Expense';
import VATHistory from '@/lib/models/VATHistory';
import connectDB from '@/lib/mongodb';

const VAT_RATE = 0.075; // 7.5%
const VAT_REMITTANCE_DAY = 21; // 21st of each month

/**
 * Get the current VAT period (from 22nd of previous month to 21st of current month)
 */
export function getCurrentVATPeriod() {
  const today = new Date();
  const currentDay = today.getDate();

  let startDate: Date;
  let endDate: Date;
  let month: number;
  let year: number;

  if (currentDay < VAT_REMITTANCE_DAY) {
    // We're in the period that started on the 22nd of last month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate = new Date(firstDay);
    startDate.setDate(22); // 22nd of this month? No - need to go back
    
    // Go back to last month's 22nd
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 22);
    endDate = new Date(today.getFullYear(), today.getMonth(), 21);
    
    month = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
    year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  } else {
    // We're in the period that started on the 22nd of this month
    startDate = new Date(today.getFullYear(), today.getMonth(), 22);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 21);
    
    month = today.getMonth();
    year = today.getFullYear();
  }

  return { startDate, endDate, month, year };
}

/**
 * Calculate VAT for orders within a date range
 */
export async function calculateVATForPeriod(startDate: Date, endDate: Date) {
  await connectDB();

  // Get all orders in the period
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $in: ['completed', 'confirmed', 'delivered'] },
  });

  // Get all expenses in the period
  const expenses = await Expense.find({
    date: { $gte: startDate, $lte: endDate },
  });

  // Calculate total sales amount
  const totalSalesAmount = orders.reduce((sum: number, order: any) => {
    return sum + (order.total || 0);
  }, 0);

  // Calculate Output VAT (VAT on sales)
  const totalSalesExVAT = totalSalesAmount / (1 + VAT_RATE);
  const outputVAT = totalSalesExVAT * VAT_RATE;

  // Calculate deductible expenses
  const totalExpensesAmount = expenses.reduce((sum: number, expense: any) => {
    return sum + (expense.amount || 0);
  }, 0);

  // Calculate Input VAT (VAT on deductible expenses)
  const inputVAT = totalExpensesAmount * VAT_RATE;

  // Calculate VAT Payable
  const vatPayable = Math.max(0, outputVAT - inputVAT);

  return {
    totalSalesAmount,
    outputVAT: Math.round(outputVAT * 100) / 100,
    inputVAT: Math.round(inputVAT * 100) / 100,
    vatPayable: Math.round(vatPayable * 100) / 100,
    deductibleExpensesAmount: Math.round(totalExpensesAmount * 100) / 100,
  };
}

/**
 * Get annual VAT total from all archived records
 */
export async function getAnnualVATTotal(year: number) {
  await connectDB();

  const records = await VATHistory.find({ year });
  const total = records.reduce((sum, record) => sum + record.vatPayable, 0);

  return Math.round(total * 100) / 100;
}

/**
 * Archive previous month VAT and create new record for current month
 * This should be called on the 21st of each month
 */
export async function rolloverVAT() {
  await connectDB();

  try {
    const today = new Date();
    const currentDay = today.getDate();

    // Only run on the 21st or after
    if (currentDay < VAT_REMITTANCE_DAY && currentDay > 1) {
      return { skipped: true, reason: 'Not VAT remittance day' };
    }

    const { startDate, endDate, month, year } = getCurrentVATPeriod();

    // Check if VAT record already exists for this period
    const existingRecord = await VATHistory.findOne({ month, year });

    if (existingRecord && existingRecord.status !== 'archived') {
      // Update existing record with latest calculations
      const vatData = await calculateVATForPeriod(startDate, endDate);
      const annualTotal = await getAnnualVATTotal(year);

      existingRecord.totalOutputVAT = vatData.outputVAT;
      existingRecord.totalInputVAT = vatData.inputVAT;
      existingRecord.vatPayable = vatData.vatPayable;
      existingRecord.currentMonthVAT = vatData.vatPayable;
      existingRecord.annualVATTotal = annualTotal;
      existingRecord.totalSalesAmount = vatData.totalSalesAmount;
      existingRecord.deductibleExpensesAmount = vatData.deductibleExpensesAmount;

      await existingRecord.save();

      return {
        updated: true,
        record: existingRecord,
      };
    }

    // Create new VAT history record
    const vatData = await calculateVATForPeriod(startDate, endDate);
    const annualTotal = await getAnnualVATTotal(year);

    const newRecord = new VATHistory({
      month,
      year,
      startDate,
      endDate,
      currentMonthVAT: vatData.vatPayable,
      totalOutputVAT: vatData.outputVAT,
      totalInputVAT: vatData.inputVAT,
      vatPayable: vatData.vatPayable,
      annualVATTotal: annualTotal,
      vatRate: VAT_RATE * 100,
      totalSalesAmount: vatData.totalSalesAmount,
      deductibleExpensesAmount: vatData.deductibleExpensesAmount,
      status: 'active',
    });

    await newRecord.save();

    return {
      created: true,
      record: newRecord,
    };
  } catch (error) {
    console.error('[VAT Rollover] Error:', error);
    throw error;
  }
}

/**
 * Get current month VAT data (for display)
 */
export async function getCurrentMonthVAT() {
  await connectDB();

  const { startDate, endDate, month, year } = getCurrentVATPeriod();

  // Try to get from database
  let record = await VATHistory.findOne({ month, year });

  if (!record) {
    // Calculate fresh if not in database
    const vatData = await calculateVATForPeriod(startDate, endDate);
    const annualTotal = await getAnnualVATTotal(year);

    return {
      month,
      year,
      currentMonthVAT: vatData.vatPayable,
      totalOutputVAT: vatData.outputVAT,
      totalInputVAT: vatData.inputVAT,
      annualVATTotal: annualTotal,
      vatRate: VAT_RATE * 100,
      totalSalesAmount: vatData.totalSalesAmount,
      deductibleExpensesAmount: vatData.deductibleExpensesAmount,
      status: 'active',
      fromDatabase: false,
    };
  }

  return {
    month: record.month,
    year: record.year,
    currentMonthVAT: record.currentMonthVAT,
    totalOutputVAT: record.totalOutputVAT,
    totalInputVAT: record.totalInputVAT,
    annualVATTotal: record.annualVATTotal,
    vatRate: record.vatRate,
    totalSalesAmount: record.totalSalesAmount,
    deductibleExpensesAmount: record.deductibleExpensesAmount,
    status: record.status,
    fromDatabase: true,
  };
}
