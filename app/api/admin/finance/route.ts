import { NextRequest, NextResponse } from 'next/server';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import connectDB from '@/lib/mongodb';

interface FinanceMetrics {
  totalRevenue: number;
  totalIncome: number;
  totalExpenses: number;
  pendingAmount: number;
  completedAmount: number;
  totalSalesAmount: number;
  totalRentalsAmount: number;
  completedOutgoing: number;
  annualTurnover: number;
  businessSize: 'small' | 'medium' | 'large';
  taxBreakdown: TaxBreakdown;
  monthlyTax: MonthlyTaxBreakdown;
  weeklyProjection: WeeklyData[];
  transactionBreakdown: TransactionBreakdown;
  profitMargin: number;
  averageOrderValue: number;
  conversionMetrics: ConversionMetrics;
}

interface TaxBreakdown {
  vat: VATBreakdown;
  corporateIncomeTax: number;
  educationTax: number;
  totalAnnualTax: number;
}

interface VATBreakdown {
  rate: number;
  totalSalesExVAT: number;
  outputVAT: number;
  inputVAT: number;
  vatPayable: number;
}

interface MonthlyTaxBreakdown {
  estimatedMonthlyVAT: number;
  estimatedMonthlyCIT: number;
  estimatedMonthlyEducationTax: number;
  estimatedMonthlyTotal: number;
}

interface WeeklyData {
  week: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface TransactionBreakdown {
  sales: number;
  rentals: number;
  customOrders: number;
  returns: number;
  refunds: number;
}

interface ConversionMetrics {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  cancelledTransactions: number;
  conversionRate: number;
}

// ============================================
// TAX CALCULATION FUNCTIONS
// ============================================

/**
 * Determine business size based on annual turnover
 * - Small: ₦0 – ₦25 million
 * - Medium: ₦25 million – ₦100 million
 * - Large: Above ₦100 million
 */
function determineBusinessSize(annualTurnover: number): 'small' | 'medium' | 'large' {
  const SMALL_THRESHOLD = 25000000; // ₦25 million
  const MEDIUM_THRESHOLD = 100000000; // ₦100 million

  if (annualTurnover < SMALL_THRESHOLD) return 'small';
  if (annualTurnover < MEDIUM_THRESHOLD) return 'medium';
  return 'large';
}

/**
 * Calculate VAT (7.5%) - Applies to all business sizes
 */
function calculateVAT(totalRevenue: number, estimatedSupplierCosts: number = 0): VATBreakdown {
  const VAT_RATE = 0.075; // 7.5%
  const totalSalesExVAT = totalRevenue / (1 + VAT_RATE);
  const outputVAT = totalSalesExVAT * VAT_RATE;
  const inputVATBase = estimatedSupplierCosts > 0 ? estimatedSupplierCosts : totalRevenue * 0.35;
  const inputVAT = inputVATBase * VAT_RATE;
  const vatPayable = Math.max(0, outputVAT - inputVAT);

  return {
    rate: VAT_RATE * 100,
    totalSalesExVAT: Math.round(totalSalesExVAT * 100) / 100,
    outputVAT: Math.round(outputVAT * 100) / 100,
    inputVAT: Math.round(inputVAT * 100) / 100,
    vatPayable: Math.round(vatPayable * 100) / 100,
  };
}

/**
 * Calculate Corporate Income Tax (CIT)
 * Small: 0%, Medium: 20%, Large: 30%
 */
function calculateCIT(annualTurnover: number, taxableProfit: number): number {
  const businessSize = determineBusinessSize(annualTurnover);
  switch (businessSize) {
    case 'small': return 0;
    case 'medium': return taxableProfit * 0.20;
    case 'large': return taxableProfit * 0.30;
    default: return 0;
  }
}

/**
 * Calculate Education Tax (EDT)
 * Only for large companies: 3% of taxable profit
 */
function calculateEducationTax(annualTurnover: number, taxableProfit: number): number {
  const businessSize = determineBusinessSize(annualTurnover);
  if (businessSize === 'large') {
    return taxableProfit * 0.03;
  }
  return 0;
}

/**
 * Generate comprehensive annual tax summary
 */
function generateAnnualTaxSummary(
  annualTurnover: number,
  totalRevenue: number,
  totalExpenses: number
): TaxBreakdown {
  const taxableProfit = totalRevenue - totalExpenses;
  const vatBreakdown = calculateVAT(totalRevenue, totalExpenses);
  const corporateIncomeTax = calculateCIT(annualTurnover, taxableProfit);
  const educationTax = calculateEducationTax(annualTurnover, taxableProfit);
  const totalAnnualTax = vatBreakdown.vatPayable + corporateIncomeTax + educationTax;

  return {
    vat: vatBreakdown,
    corporateIncomeTax: Math.round(corporateIncomeTax * 100) / 100,
    educationTax: Math.round(educationTax * 100) / 100,
    totalAnnualTax: Math.round(totalAnnualTax * 100) / 100,
  };
}

/**
 * Calculate monthly tax estimates
 */
function getMonthlyTaxEstimates(taxBreakdown: TaxBreakdown): MonthlyTaxBreakdown {
  return {
    estimatedMonthlyVAT: Math.round((taxBreakdown.vat.vatPayable / 12) * 100) / 100,
    estimatedMonthlyCIT: Math.round((taxBreakdown.corporateIncomeTax / 12) * 100) / 100,
    estimatedMonthlyEducationTax: Math.round((taxBreakdown.educationTax / 12) * 100) / 100,
    estimatedMonthlyTotal: Math.round((taxBreakdown.totalAnnualTax / 12) * 100) / 100,
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get current month date range
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    // Get all orders
    const allOrders = await Order.find({}).lean();
    const allCustomOrders = await CustomOrder.find({}).lean();

    // Calculate financial metrics
    const currentMonthOrders = allOrders.filter(
      (order: any) =>
        new Date(order.createdAt) >= monthStart &&
        new Date(order.createdAt) <= monthEnd
    );

    const currentMonthCustomOrders = allCustomOrders.filter(
      (order: any) =>
        new Date(order.createdAt) >= monthStart &&
        new Date(order.createdAt) <= monthEnd
    );

    // Revenue calculations
    const completedOrders = allOrders.filter(
      (order: any) =>
        order.status === 'confirmed' ||
        order.status === 'completed' ||
        order.status === 'delivered'
    );

    const pendingOrders = allOrders.filter(
      (order: any) => order.status === 'pending' || order.status === 'processing'
    );

    const completedRevenue = completedOrders.reduce(
      (sum: number, order: any) => sum + (order.total || 0),
      0
    );

    const pendingRevenue = pendingOrders.reduce(
      (sum: number, order: any) => sum + (order.total || 0),
      0
    );

    // Custom order revenue
    const completedCustomOrders = allCustomOrders.filter(
      (order: any) => order.status === 'completed'
    );
    const pendingCustomOrders = allCustomOrders.filter(
      (order: any) =>
        order.status === 'pending' ||
        order.status === 'approved' ||
        order.status === 'in-progress'
    );

    const customOrderCompleteRevenue = completedCustomOrders.reduce(
      (sum: number, order: any) => sum + (order.quotedPrice || 0),
      0
    );

    const customOrderPendingRevenue = pendingCustomOrders.reduce(
      (sum: number, order: any) => sum + (order.quotedPrice || 0),
      0
    );

    // Total calculations
    const totalCompletedRevenue = completedRevenue + customOrderCompleteRevenue;
    const totalPendingRevenue = pendingRevenue + customOrderPendingRevenue;
    const totalRevenue = totalCompletedRevenue + totalPendingRevenue;

    // Calculate estimated expenses (typically 30-40% of revenue for e-commerce)
    // This includes: product cost, packaging, shipping subsidies, payment gateway fees
    const estimatedExpenseRate = 0.35; // 35% of revenue
    const totalExpenses = totalRevenue * estimatedExpenseRate;

    // Calculate gross profit
    const grossProfit = totalRevenue - totalExpenses;

    // ============================================
    // COMPREHENSIVE NIGERIAN TAX CALCULATIONS
    // ============================================
    // Project annual turnover from current month
    const currentDate = new Date();
    const daysInCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    const daysElapsedInMonth = currentDate.getDate();
    const estimatedMonthlyRevenue =
      (totalRevenue / daysElapsedInMonth) * daysInCurrentMonth;
    const annualTurnover = estimatedMonthlyRevenue * 12;

    // Generate comprehensive tax breakdown
    const taxBreakdown = generateAnnualTaxSummary(
      annualTurnover,
      totalRevenue,
      totalExpenses
    );

    // Get monthly tax estimates
    const monthlyTax = getMonthlyTaxEstimates(taxBreakdown);

    // Additional metrics
    const businessSize = determineBusinessSize(annualTurnover);

    // Weekly projection (current week and next 3 weeks)
    const weeklyProjection = calculateWeeklyProjection(
      allOrders,
      currentYear,
      currentMonth
    );

    // Transaction breakdown
    const transactionBreakdown = calculateTransactionBreakdown(
      allOrders,
      allCustomOrders
    );

    // Calculate total sales and rentals amounts
    const totalSalesAmount = allOrders.reduce((sum: number, order: any) => {
      const salesTotal = order.items?.reduce((itemSum: number, item: any) => {
        return item.mode === 'buy' ? itemSum + (item.price * item.quantity || 0) : itemSum;
      }, 0) || 0;
      return sum + salesTotal;
    }, 0);

    const totalRentalsAmount = allOrders.reduce((sum: number, order: any) => {
      const rentalsTotal = order.items?.reduce((itemSum: number, item: any) => {
        return item.mode === 'rent' ? itemSum + (item.price * item.quantity || 0) : itemSum;
      }, 0) || 0;
      return sum + rentalsTotal;
    }, 0);

    // Calculate completed outgoing (refunds + returns)
    const refundedOrders = allOrders.filter(
      (order: any) => order.status === 'refunded'
    );
    const returnedOrders = allOrders.filter(
      (order: any) => order.status === 'returned'
    );
    const completedOutgoing = 
      refundedOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) +
      returnedOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

    // Profit margin
    const profitMargin =
      totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : '0';

    // Average order value
    const completedOrdersCount = completedOrders.length;
    const averageOrderValue =
      completedOrdersCount > 0 ? completedRevenue / completedOrdersCount : 0;

    // Conversion metrics
    const conversionMetrics: ConversionMetrics = {
      totalTransactions: allOrders.length + allCustomOrders.length,
      completedTransactions:
        completedOrders.length + completedCustomOrders.length,
      pendingTransactions:
        pendingOrders.length + pendingCustomOrders.length,
      cancelledTransactions: allOrders.filter(
        (order: any) => order.status === 'cancelled'
      ).length,
      conversionRate:
        allOrders.length > 0
          ? (
              ((completedOrders.length / allOrders.length) * 100).toFixed(2) as any
            )
          : 0,
    };

    const metrics: FinanceMetrics = {
      totalRevenue,
      totalIncome: totalCompletedRevenue,
      totalExpenses,
      pendingAmount: totalPendingRevenue,
      completedAmount: totalCompletedRevenue,
      totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
      totalRentalsAmount: Math.round(totalRentalsAmount * 100) / 100,
      completedOutgoing: Math.round(completedOutgoing * 100) / 100,
      annualTurnover: Math.round(annualTurnover * 100) / 100,
      businessSize,
      taxBreakdown,
      monthlyTax,
      weeklyProjection,
      transactionBreakdown,
      profitMargin: parseFloat(profitMargin as string),
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      conversionMetrics,
    };

    return NextResponse.json(
      { success: true, metrics },
      { status: 200 }
    );
  } catch (error) {
    console.error('[FinanceAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch finance metrics' },
      { status: 500 }
    );
  }
}

function calculateWeeklyProjection(
  orders: any[],
  year: number,
  month: number
): WeeklyData[] {
  const weeks: WeeklyData[] = [];
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay());

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekOrders = orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekStart && orderDate <= weekEnd;
    });

    const weekRevenue = weekOrders.reduce(
      (sum: number, order: any) => sum + (order.total || 0),
      0
    );

    const avgOrderValue =
      weekOrders.length > 0
        ? weekRevenue / weekOrders.length
        : 0;

    weeks.push({
      week: `Week ${i + 1} (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`,
      revenue: Math.round(weekRevenue * 100) / 100,
      orders: weekOrders.length,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    });
  }

  return weeks;
}

function calculateTransactionBreakdown(
  orders: any[],
  customOrders: any[]
): TransactionBreakdown {
  let salesCount = 0;
  let rentalsCount = 0;
  let returnsCount = 0;
  let refundsCount = 0;

  // Count items by mode
  orders.forEach((order: any) => {
    if (order.items) {
      order.items.forEach((item: any) => {
        if (item.mode === 'buy') {
          salesCount++;
        } else if (item.mode === 'rent') {
          rentalsCount++;
        }
      });
    }
    
    // Count returns and refunds
    if (order.status === 'returned') {
      returnsCount++;
    }
    if (order.status === 'refunded') {
      refundsCount++;
    }
  });

  return {
    sales: salesCount,
    rentals: rentalsCount,
    customOrders: customOrders.length,
    returns: returnsCount,
    refunds: refundsCount,
  };
}
