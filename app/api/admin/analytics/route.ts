import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Buyer from '@/lib/models/Buyer';
import Product from '@/lib/models/Product';
import CustomOrder from '@/lib/models/CustomOrder';
import CautionFeeTransaction from '@/lib/models/CautionFeeTransaction';
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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[Dashboard Analytics API] Fetching comprehensive data...');

    // Fetch all required data
    const [orders, buyers, products, customOrders, cautionFees] = await Promise.all([
      Order.find({}, '', { lean: true }),
      Buyer.find({}, '', { lean: true }),
      Product.find({}, '', { lean: true }),
      CustomOrder.find({}, '', { lean: true }).catch(() => []),
      CautionFeeTransaction.find({}, '', { lean: true }),
    ]);

    console.log('[Dashboard Analytics] Data retrieved:', {
      orders: orders.length,
      buyers: buyers.length,
      products: products.length,
      customOrders: customOrders?.length || 0,
      cautionFees: cautionFees.length,
    });

    // ==================== USE UTILITY: AGGREGATE REVENUE ====================
    // This is the SINGLE SOURCE OF TRUTH for revenue calculations
    // Cast orders to proper type for utility
    const ordersForRevenue = orders.map(order => ({
      items: order.items,
      total: order.total,
      cautionFee: order.cautionFee,
      orderType: order.orderType,
      status: order.status,
      createdAt: new Date(order.createdAt || new Date()),
    }));
    const revenueMetrics = aggregateRevenueMetrics(ordersForRevenue);

    // ==================== CALCULATE SUMMARY METRICS ====================
    let completedOrders = 0;
    let pendingOrders = 0;
    const buyerIdsSet = new Set<string>();
    const guestEmailsSet = new Set<string>();
    const dailyMetricsMap = new Map<string, DailyMetrics>();

    // Process orders to get customer and status info
    orders.forEach((order) => {
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
        return {
          productId: String(obj.productId || ''),
          name: String(obj.name || ''),
          quantity: Number(obj.quantity || 1),
          price: Number(obj.price || 0),
          mode: (obj.mode === 'rent' ? 'rent' : 'buy') as 'buy' | 'rent',
          rentalDays: Number(obj.rentalDays || 0),
        };
      });
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
    
    // Use utility-calculated revenue metrics
    const totalRevenue = revenueMetrics.totalRevenue;
    const totalSalesRevenue = revenueMetrics.salesRevenue;
    const totalRentalRevenue = revenueMetrics.rentalRevenue;
    
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
          const revenue = ((item.price as number) || 0) * quantity;

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
        averageOrderValue,
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
    };

    console.log('[Dashboard Analytics] Calculated metrics:', {
      totalRevenue,
      totalSalesRevenue,
      totalRentalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      averageOrderValue: averageOrderValue.toFixed(2),
    });

    return NextResponse.json(analytics);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
    console.error('[Dashboard Analytics API] Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
