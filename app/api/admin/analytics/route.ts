import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';
import Order from '@/lib/models/Order';
import Buyer from '@/lib/models/Buyer';
import Product from '@/lib/models/Product';
import CustomOrder from '@/lib/models/CustomOrder';
import CautionFeeTransaction from '@/lib/models/CautionFeeTransaction';
import Expense from '@/lib/models/Expense';
import { aggregateRevenueMetrics, calculateOrderRevenue } from '@/lib/utils/revenueUtils';

interface DailyMetrics {
  date: string;
  salesRevenue: number;
  rentalRevenue: number;
  totalRevenue: number;
  ordersCount: number;
  rentalOrdersCount: number;
  salesOrdersCount: number;
}

interface DashboardAnalytics {
  summary: {
    totalRevenue: number;
    totalSalesRevenue: number;
    totalRentalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalProducts: number;
    totalCustomers: number;
    registeredCustomers: number;
    guestCustomers: number;
    averageOrderValue: number;
    completionRate: number;
  };
  cautionFeeMetrics: {
    totalCollected: number;
    totalRefunded: number;
    totalPartiallyRefunded: number;
    totalForfeited: number;
    pendingReturn: number;
    refundRate: number;
    averageRefundDays: number;
  };
  dailyMetrics: DailyMetrics[];
  topProducts: Array<{ name: string; unitsSold: number; revenue: number }>;
  customerMetrics: {
    newCustomersThisMonth: number;
    returningCustomers: number;
    customerRetentionRate: number;
  };
  revenueBreakdown?: {
    onlineSalesRevenue: number;
    onlineRentalRevenue: number;
  };
  offlineRevenueBreakdown?: {
    salesRevenue: number;
    rentalRevenue: number;
  };
  orderTypeBreakdown?: {
    online: number;
    offline: number;
  };
  vatMetrics?: {
    totalVAT: number;
    inputVAT: number;
    outputVAT: number;
    vatPayable: number;
    vatExempt: number;
  };
  expenseMetrics?: {
    count: number;
    totalAmount: number;
    totalVAT: number;
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Require admin session
    const adminId = request.cookies.get('admin_session')?.value;
    if (!adminId) {
      console.log('[Dashboard Analytics API] ❌ No admin session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[Dashboard Analytics API] ✅ Admin authenticated:', adminId);
    console.log('[Dashboard Analytics API] Fetching comprehensive data...');

    // Fetch all required data
    // CONSOLIDATION: Use UnifiedOrder for online orders + Order model for offline orders
    let unifiedOrders: any[] = [];
    let offlineOrdersFromDB: any[] = [];
    
    try {
      unifiedOrders = await UnifiedOrder.find({}, '', { lean: true }).catch(() => []);
    } catch (err) {
      console.log('[Dashboard Analytics] ⚠️ UnifiedOrder collection error:', err instanceof Error ? err.message : err);
      unifiedOrders = [];
    }

    try {
      // Fetch offline orders from Order model (where they're actually saved)
      offlineOrdersFromDB = await Order.find({ isOffline: true }, '', { lean: true }).catch(() => []);
    } catch (err) {
      console.log('[Dashboard Analytics] ⚠️ Order (offline) collection error:', err instanceof Error ? err.message : err);
      offlineOrdersFromDB = [];
    }

    const [buyers, products, customOrders, cautionFees, expenses] = await Promise.all([
      Buyer.find({}, '', { lean: true }),
      Product.find({}, '', { lean: true }),
      CustomOrder.find({}, '', { lean: true }).catch(() => []),
      CautionFeeTransaction.find({}, '', { lean: true }),
      Expense.find({}, '', { lean: true }),
    ]);

    // If no orders or data, return empty analytics immediately
    if (unifiedOrders.length === 0) {
      console.log('[Dashboard Analytics] ✅ No orders found - returning zero analytics');
      
      const emptyAnalytics: DashboardAnalytics = {
        summary: {
          totalRevenue: 0,
          totalSalesRevenue: 0,
          totalRentalRevenue: 0,
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          totalProducts: 0,
          totalCustomers: 0,
          registeredCustomers: 0,
          guestCustomers: 0,
          averageOrderValue: 0,
          completionRate: 0,
        },
        cautionFeeMetrics: {
          totalCollected: 0,
          totalRefunded: 0,
          totalPartiallyRefunded: 0,
          totalForfeited: 0,
          pendingReturn: 0,
          refundRate: 0,
          averageRefundDays: 0,
        },
        dailyMetrics: [],
        topProducts: [],
        customerMetrics: {
          newCustomersThisMonth: 0,
          returningCustomers: 0,
          customerRetentionRate: 0,
        },
        revenueBreakdown: {
          onlineSalesRevenue: 0,
          onlineRentalRevenue: 0,
        },
        offlineRevenueBreakdown: {
          salesRevenue: 0,
          rentalRevenue: 0,
        },
        orderTypeBreakdown: {
          online: 0,
          offline: 0,
        },
        vatMetrics: {
          totalVAT: 0,
          inputVAT: 0,
          outputVAT: 0,
          vatPayable: 0,
          vatExempt: 0,
        },
        expenseMetrics: {
          count: 0,
          totalAmount: 0,
          totalVAT: 0,
        },
      };

      const response = NextResponse.json(emptyAnalytics);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    // Separate online and offline orders
    const onlineOrders = unifiedOrders.filter(o => !o.isOffline);
    const offlineOrders = offlineOrdersFromDB;  // Use offline orders from Order model
    const orders = onlineOrders; // Use online orders for main calculations

    console.log('[Dashboard Analytics] Data retrieved:', {
      unifiedOrders: unifiedOrders.length,
      onlineOrders: onlineOrders.length,
      offlineOrders: offlineOrders.length,
      buyers: buyers.length,
      products: products.length,
      customOrders: customOrders?.length || 0,
      cautionFees: cautionFees.length,
      expenses: expenses.length,
    });

    // Log sample order data if exists
    if (orders.length > 0) {
      console.log('[Dashboard Analytics] Sample order:', {
        orderNumber: (orders[0] as any).orderNumber,
        total: (orders[0] as any).total,
        status: (orders[0] as any).status,
        itemsCount: ((orders[0] as any).items?.length) || 0,
        vat: (orders[0] as any).vat,
        orderType: (orders[0] as any).orderType,
      });
      
      // Log first 3 orders for verification
      console.log('[Dashboard Analytics] First 3 orders summary:');
      orders.slice(0, 3).forEach((order: any, idx: number) => {
        console.log(`  Order ${idx + 1}: ${order.orderNumber || 'N/A'} - ₦${order.total || 0} (${order.status})`);
      });
    } else {
      console.log('[Dashboard Analytics] ⚠️ NO ORDERS FOUND IN DATABASE');
    }

    // ==================== AGGREGATE REVENUE - Direct from total field ====================
    // Use both utility AND fallback to direct total field calculation
    // This ensures we get accurate revenue even if items structure varies
    let totalRevenueDirect = 0;
    let totalSalesRevenueDirect = 0;
    let totalRentalRevenueDirect = 0;
    // Note: online/offline variables declared later before use to avoid duplicate declarations

    orders.forEach((order: any) => {
      const orderStatus = String(order.status || '').toLowerCase();
      if (!['completed', 'delivered', 'confirmed', 'paid', 'pending'].includes(orderStatus)) return;
      
      const orderTotal = order.total || 0;
      const vat = order.vat || 0;
      const subtotal = orderTotal - vat;
      
      totalRevenueDirect += orderTotal;
    });

    console.log('[Dashboard Analytics] Revenue (Direct from total field):', {
      totalRevenue: totalRevenueDirect,
      totalSalesRevenue: totalSalesRevenueDirect,
      totalRentalRevenue: totalRentalRevenueDirect,
    });

    // Also use utility for comparison
    const ordersForRevenue = orders.map(order => ({
      items: order.items,
      total: order.total,
      cautionFee: order.cautionFee,
      orderType: order.orderType,
      status: order.status,
      createdAt: new Date(order.createdAt || new Date()),
    }));
    const revenueMetrics = aggregateRevenueMetrics(ordersForRevenue);
    
    console.log('[Dashboard Analytics] Revenue (From utility):', {
      totalRevenue: revenueMetrics.totalRevenue,
      salesRevenue: revenueMetrics.salesRevenue,
      rentalRevenue: revenueMetrics.rentalRevenue,
    });

    // Use direct calculation if utility returns 0 (fallback)
    const finalTotalRevenue = totalRevenueDirect > 0 ? totalRevenueDirect : revenueMetrics.totalRevenue;
    const finalSalesRevenue = totalSalesRevenueDirect > 0 ? totalSalesRevenueDirect : revenueMetrics.salesRevenue;
    const finalRentalRevenue = totalRentalRevenueDirect > 0 ? totalRentalRevenueDirect : revenueMetrics.rentalRevenue;

    // ==================== CALCULATE SUMMARY METRICS ====================
    let completedOrders = 0;
    let pendingOrders = 0;
    const buyerIdsSet = new Set<string>();
    const guestEmailsSet = new Set<string>();
    const dailyMetricsMap = new Map<string, DailyMetrics>();

    // Process orders to get customer and status info
    orders.forEach((order, orderIdx) => {
      const orderObj = order as Record<string, unknown>;
      if (orderObj.isCustomOrder) return;
      
      const orderDate = new Date((orderObj.createdAt as Date) || new Date());
      const dateStr = formatDate(orderDate);

      // Initialize daily metrics if not exists
      if (!dailyMetricsMap.has(dateStr)) {
        dailyMetricsMap.set(dateStr, {
          date: dateStr,
          salesRevenue: 0,
          rentalRevenue: 0,
          totalRevenue: 0,
          ordersCount: 0,
          rentalOrdersCount: 0,
          salesOrdersCount: 0,
        });
      }

      const dailyMetric = dailyMetricsMap.get(dateStr)!;

      // Track customer type
      if (orderObj.buyerId) {
        buyerIdsSet.add(String(orderObj.buyerId));
      } else if (orderObj.email) {
        guestEmailsSet.add(String(orderObj.email));
      }

      // Calculate daily revenue for this order
      const rawItems = (orderObj.items ?? []) as unknown[];
      const convertedItems = rawItems.map(item => {
        const obj = item as Record<string, unknown>;
        const finalMode = (obj.mode === 'rent' ? 'rent' : 'buy') as 'buy' | 'rent';
        return {
          productId: String(obj.productId || ''),
          name: String(obj.name || ''),
          quantity: Number(obj.quantity || 1),
          unitPrice: Number(obj.unitPrice || obj.price || 0),  // ← FIXED: Use unitPrice (fallback to price if needed)
          mode: finalMode,
          rentalDays: Number(obj.rentalDays || 0),
        };
      });
      
      // DEBUG: Log what we're calculating
      if (orderIdx < 3) {
        console.log(`[Analytics] Order ${orderIdx + 1} items for revenue calc:`, convertedItems.map((i: any) => ({
          name: i.name,
          mode: i.mode,
          unitPrice: i.unitPrice,
          qty: i.quantity,
        })));
      }
      
      const dailyRevenue = calculateOrderRevenue(convertedItems);
      
      dailyMetric.salesRevenue += dailyRevenue.salesRevenue;
      dailyMetric.rentalRevenue += dailyRevenue.rentalRevenue;
      dailyMetric.totalRevenue += dailyRevenue.salesRevenue + dailyRevenue.rentalRevenue;
      
      // Count order types
      const hasRental = convertedItems.some(item => item.mode === 'rent' || item.rentalDays > 0);
      const hasSale = convertedItems.some(item => item.mode !== 'rent' && item.rentalDays === 0);

      if (hasRental) {
        dailyMetric.rentalOrdersCount += 1;
      }
      if (hasSale) {
        dailyMetric.salesOrdersCount += 1;
      }
      dailyMetric.ordersCount += 1;

      // Track order status
      const oStatus = String(orderObj.status || '').toLowerCase();
      if (['completed', 'delivered'].includes(oStatus)) {
        completedOrders += 1;
      } else if (['pending', 'unpaid', 'awaiting_payment'].includes(oStatus)) {
        pendingOrders += 1;
      }
    });

    // Process custom orders
    if (Array.isArray(customOrders)) {
      customOrders.forEach((co) => {
        const coObj = co as Record<string, unknown>;
        if (coObj.status === 'pending') {
          pendingOrders += 1;
        } else if (coObj.status === 'completed') {
          completedOrders += 1;
        }

        if (coObj.buyerId) {
          buyerIdsSet.add(String(coObj.buyerId));
        } else if (coObj.email) {
          guestEmailsSet.add(String(coObj.email));
        }
      });
    }

    // Sort daily metrics by date
    const dailyMetrics = Array.from(dailyMetricsMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // ==================== CALCULATE AGGREGATED METRICS ====================
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const registeredCustomersCount = buyers.length;
    const guestCustomersCount = guestEmailsSet.size;
    const totalCustomersCount = buyerIdsSet.size + guestCustomersCount;
    
    // Use final revenue metrics (with fallback applied)
    // NOTE: Will be recalculated after online/offline breakdown
    let totalRevenue = finalTotalRevenue;
    let totalSalesRevenue = finalSalesRevenue;
    let totalRentalRevenue = finalRentalRevenue;
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // ==================== TOP PRODUCTS ====================
    const productRevenueMap = new Map<string, { name: string; unitsSold: number; revenue: number }>();

    orders.forEach((order) => {
      const orderObj = order as Record<string, unknown>;
      if (orderObj.items && Array.isArray(orderObj.items)) {
        (orderObj.items as Record<string, unknown>[]).forEach((item) => {
          const productName = String(item.name || (item.product as Record<string, unknown> | undefined)?.name || 'Unknown Product');
          const quantity = (item.quantity as number) || 0;
          const revenue = ((item.unitPrice || item.price || 0) as number) * quantity;  // ← FIXED: unitPrice

          if (!productRevenueMap.has(productName)) {
            productRevenueMap.set(productName, { name: productName, unitsSold: 0, revenue: 0 });
          }

          const prod = productRevenueMap.get(productName)!;
          prod.unitsSold += quantity;
          prod.revenue += revenue;
        });
      }
    });

    const topProducts = Array.from(productRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ==================== CUSTOMER METRICS ====================
    const thisMonthDate = new Date();
    thisMonthDate.setDate(1);

    const newCustomersThisMonth = buyers.filter((buyer) => {
      const buyerObj = buyer as Record<string, unknown>;
      const createdAt = new Date((buyerObj.createdAt as Date) || new Date());
      return createdAt >= thisMonthDate;
    }).length;

    const returningCustomersSet = new Map<string, number>();
    orders.forEach((order) => {
      const orderObj = order as Record<string, unknown>;
      if (orderObj.buyerId) {
        returningCustomersSet.set(
          String(orderObj.buyerId),
          (returningCustomersSet.get(String(orderObj.buyerId)) || 0) + 1
        );
      }
    });

    const returningCustomers = Array.from(returningCustomersSet.values()).filter((count) => count > 1).length;
    const customerRetentionRate =
      totalCustomersCount > 0 ? (returningCustomers / totalCustomersCount) * 100 : 0;

    // ==================== CAUTION FEE METRICS ====================
    let totalCautionCollected = 0;
    let totalCautionRefunded = 0;
    let totalCautionPartially = 0;
    let totalCautionForfeited = 0;
    const refundDays: number[] = [];

    // FIRST: Aggregate caution fees from orders (primary source)
    orders.forEach((order) => {
      const orderObj = order as Record<string, unknown>;
      const cautionFeeAmount = (orderObj.cautionFee as number) || 0;
      
      // All caution fees from orders are "collected" (pending return)
      if (cautionFeeAmount > 0) {
        totalCautionCollected += cautionFeeAmount;
      }
    });

    // SECOND: Process CautionFeeTransaction records for refund tracking
    cautionFees.forEach((fee) => {
      const feeObj = fee as Record<string, unknown>;
      const amount = (feeObj.amount as number) || 0;

      if (feeObj.status === 'collected' || feeObj.status === 'pending_return') {
        // Don't double-count - these are already in totalCautionCollected from orders
        // Just track as reference
      } else if (feeObj.status === 'refunded') {
        totalCautionRefunded += amount;

        // Calculate days to refund
        const timeline = feeObj.timeline as Record<string, unknown>;
        const collectedDate = new Date((timeline.collectedAt as Date) || new Date());
        const refundedDate = new Date((timeline.refundedAt as Date) || new Date());
        const daysDiff = Math.floor(
          (refundedDate.getTime() - collectedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff >= 0) refundDays.push(daysDiff);
      } else if (feeObj.status === 'partially_refunded') {
        const refundAmount = (feeObj.refundAmount as number) || 0;
        totalCautionPartially += refundAmount;
      } else if (feeObj.status === 'forfeited') {
        totalCautionForfeited += amount;
      }
    });

    const averageRefundDays = refundDays.length > 0 
      ? Math.round(refundDays.reduce((a, b) => a + b, 0) / refundDays.length)
      : 0;

    const totalRefundedAndPartial = totalCautionRefunded + totalCautionPartially;
    const refundRate = totalCautionCollected > 0
      ? (totalRefundedAndPartial / totalCautionCollected) * 100
      : 0;

    console.log('[Dashboard Analytics] Caution Fee Calculation:', {
      totalCautionCollected,
      totalCautionRefunded,
      totalCautionPartially,
      totalCautionForfeited,
      refundRate: refundRate.toFixed(2) + '%',
      averageRefundDays,
    });

    // ==================== EXPENSE METRICS ====================
    let totalExpensesAmount = 0;
    let totalExpensesVAT = 0;
    let expenseCount = 0;

    if (Array.isArray(expenses)) {
      expenses.forEach((expense) => {
        const expenseObj = expense as Record<string, unknown>;
        const expenseAmount = (expenseObj.amount as number) || 0;
        const expenseVAT = (expenseObj.vat as number) || 0;

        totalExpensesAmount += expenseAmount;
        totalExpensesVAT += expenseVAT;
        expenseCount += 1;
      });
    }

    console.log('[Dashboard Analytics] Expense Calculation:', {
      totalExpensesAmount,
      totalExpensesVAT,
      expenseCount,
      averageExpense: expenseCount > 0 ? Math.round(totalExpensesAmount / expenseCount) : 0,
    });

    // ==================== VAT METRICS ====================
    // Calculate VAT from orders (output VAT) and expenses (input VAT)
    let totalOrderVAT = 0;
    let totalExpenseVATDeductible = 0;
    let totalDiscountsGiven = 0; // Track total discounts given to customers

    orders.forEach((order) => {
      const orderObj = order as Record<string, unknown>;
      const orderVAT = (orderObj.vat as number) || 0;
      totalOrderVAT += orderVAT;
      
      // Sum all discounts given
      const discountAmount = (orderObj.discountAmount as number) || 0;
      totalDiscountsGiven += discountAmount;
    });

    // Input VAT is from expenses that are VAT applicable
    expenses.forEach((expense) => {
      const expenseObj = expense as Record<string, unknown>;
      const isVATApplicable = (expenseObj.isVATApplicable as boolean) !== false;
      if (isVATApplicable) {
        const expenseVAT = (expenseObj.vat as number) || 0;
        totalExpenseVATDeductible += expenseVAT;
      }
    });

    const vatPayable = Math.max(0, totalOrderVAT - totalExpenseVATDeductible);

    console.log('[Dashboard Analytics] Calculation Details:', {
      totalOrders: orders.length,
      totalDiscountsGiven,
      totalOrderVAT,
      inputVAT: totalExpenseVATDeductible,
      vatPayable,
      totalExpenses: totalExpensesAmount,
    });

    // ==================== OFFLINE REVENUE METRICS ====================
    // Fetch offline sales and rentals DIRECTLY from the transaction history (data source of truth)
    // No calculation needed - just sum totals by type
    let offlineSalesRevenue = 0;
    let offlineRentalRevenue = 0;
    let offlineSalesCount = 0;
    let offlineRentalCount = 0;

    if (offlineOrders.length > 0) {
      offlineOrders.forEach((order: any) => {
        const total = order.total || 0;
        const offlineType = order.offlineType || 'sale';
        
        if (offlineType === 'rental') {
          offlineRentalRevenue += total;
          offlineRentalCount += 1;
        } else {
          offlineSalesRevenue += total;
          offlineSalesCount += 1;
        }
      });

      console.log('[Dashboard Analytics] Offline Revenue (Direct from data):', {
        offlineOrders: offlineOrders.length,
        offlineSalesRevenue,
        offlineRentalRevenue,
        offlineSalesCount,
        offlineRentalCount,
        totalOfflineRevenue: offlineSalesRevenue + offlineRentalRevenue,
      });
    }

    // ==================== BUILD RESPONSE ====================
    const analytics: DashboardAnalytics = {
      summary: {
        totalRevenue,
        totalSalesRevenue,
        totalRentalRevenue,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalProducts,
        totalCustomers: totalCustomersCount,
        registeredCustomers: registeredCustomersCount,
        guestCustomers: guestCustomersCount,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        completionRate,
      },
      cautionFeeMetrics: {
        totalCollected: totalCautionCollected,
        totalRefunded: totalCautionRefunded,
        totalPartiallyRefunded: totalCautionPartially,
        totalForfeited: totalCautionForfeited,
        pendingReturn: totalCautionCollected, // Items still pending return
        refundRate,
        averageRefundDays,
      },
      dailyMetrics,
      topProducts,
      customerMetrics: {
        newCustomersThisMonth,
        returningCustomers,
        customerRetentionRate,
      },
      // Add fields that FinanceProjectOverview component expects
      revenueBreakdown: {
        onlineSalesRevenue: totalSalesRevenue,  // Use utility result
        onlineRentalRevenue: totalRentalRevenue,  // Use utility result
      },
      offlineRevenueBreakdown: {
        salesRevenue: offlineSalesRevenue,  // Calculated from offline orders
        rentalRevenue: offlineRentalRevenue,  // Calculated from offline orders
      },
      orderTypeBreakdown: {
        online: onlineOrders.length,  // Count online orders
        offline: offlineOrders.length,  // Count offline orders
      },
      vatMetrics: {
        totalVAT: totalOrderVAT + totalExpensesVAT, // Total VAT on all transactions
        inputVAT: totalExpenseVATDeductible, // Deductible VAT from expenses
        outputVAT: totalOrderVAT, // VAT charged on sales
        vatPayable, // VAT to be paid to government
        vatExempt: 0, // TODO: Track exempt transactions if needed
      },
      expenseMetrics: {
        count: expenseCount,
        totalAmount: totalExpensesAmount,
        totalVAT: totalExpensesVAT,
      },
    } as any;

    console.log('[Dashboard Analytics] Calculated metrics:', {
      totalRevenue,
      totalSalesRevenue,
      totalRentalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      averageOrderValue: averageOrderValue.toFixed(2),
    });

    console.log('[Dashboard Analytics] Response object keys:', Object.keys(analytics));
    console.log('[Dashboard Analytics] Summary object:', JSON.stringify(analytics.summary, null, 2));

    // Return with NO-CACHE headers to prevent stale data
    const response = NextResponse.json(analytics);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
    console.error('[Dashboard Analytics API] Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
