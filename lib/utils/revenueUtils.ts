/**
 * REVENUE UTILITIES - Single source of truth for revenue calculations
 * Clean separation between sales and rental revenue
 */

import { OrderItem } from './orderUtils';

export interface RevenueBreakdown {
  salesRevenue: number;
  rentalRevenue: number;
  totalRevenue: number;
  cautionFeeRevenue: number;
  orderCount: number;
  salesOrderCount: number;
  rentalOrderCount: number;
  mixedOrderCount: number;
}

/**
 * CRITICAL: Calculate revenue from a single item
 * Separates sales from rental cleanly
 */
export function calculateItemRevenue(item: OrderItem): {
  salesRevenue: number;
  rentalRevenue: number;
} {
  const itemTotal = item.price * item.quantity;

  if (item.mode === 'buy') {
    return { salesRevenue: itemTotal, rentalRevenue: 0 };
  } else if (item.mode === 'rent') {
    // For analytics: show rental price not including rental days
    // (days are used for caution fee calculation, not revenue reporting)
    return { salesRevenue: 0, rentalRevenue: itemTotal };
  }

  return { salesRevenue: 0, rentalRevenue: 0 };
}

/**
 * CRITICAL: Calculate revenue from order items
 * Used by analytics and dashboard
 */
export function calculateOrderRevenue(items: OrderItem[] | undefined) {
  let salesRevenue = 0;
  let rentalRevenue = 0;

  if (!items || items.length === 0) {
    return { salesRevenue, rentalRevenue };
  }

  items.forEach((item) => {
    const itemRevenue = calculateItemRevenue(item);
    salesRevenue += itemRevenue.salesRevenue;
    rentalRevenue += itemRevenue.rentalRevenue;
  });

  return { salesRevenue, rentalRevenue };
}

/**
 * Categorize order based on revenue
 */
export function categorizeOrderByRevenue(items: OrderItem[] | undefined) {
  const { salesRevenue, rentalRevenue } = calculateOrderRevenue(items);

  if (salesRevenue > 0 && rentalRevenue === 0) {
    return 'sales';
  } else if (rentalRevenue > 0 && salesRevenue === 0) {
    return 'rental';
  } else if (salesRevenue > 0 && rentalRevenue > 0) {
    return 'mixed';
  }

  return 'sales'; // default
}

/**
 * Calculate daily revenue breakdown
 */
export function calculateDailyRevenue(
  orders: Array<{
    items?: OrderItem[];
    total?: number;
    cautionFee?: number;
    createdAt: Date;
  }>,
  date: Date
) {
  const dateStr = date.toISOString().split('T')[0];
  let salesRevenue = 0;
  let rentalRevenue = 0;
  let cautionFeeRevenue = 0;
  let orderCount = 0;

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    if (orderDate !== dateStr) return;

    const { salesRevenue: sr, rentalRevenue: rr } = calculateOrderRevenue(
      order.items
    );
    salesRevenue += sr;
    rentalRevenue += rr;
    cautionFeeRevenue += order.cautionFee || 0;
    orderCount++;
  });

  return {
    date: dateStr,
    salesRevenue,
    rentalRevenue,
    cautionFeeRevenue,
    totalRevenue: salesRevenue + rentalRevenue,
    orderCount,
  };
}

/**
 * CRITICAL: Aggregate all revenue for dashboard
 * This is called ONCE per request - central calculation point
 */
export function aggregateRevenueMetrics(
  orders: Array<{
    items?: OrderItem[];
    total?: number;
    cautionFee?: number;
    orderType?: string;
    status?: string;
    createdAt: Date;
  }>
): RevenueBreakdown {
  let totalSalesRevenue = 0;
  let totalRentalRevenue = 0;
  let totalCautionFeeRevenue = 0;
  let totalOrders = 0;
  let salesOrderCount = 0;
  let rentalOrderCount = 0;
  let mixedOrderCount = 0;

  orders.forEach((order) => {
    const { salesRevenue, rentalRevenue } = calculateOrderRevenue(order.items);

    totalSalesRevenue += salesRevenue;
    totalRentalRevenue += rentalRevenue;
    totalCautionFeeRevenue += order.cautionFee || 0;
    totalOrders++;

    // Count by type
    if (salesRevenue > 0 && rentalRevenue === 0) {
      salesOrderCount++;
    } else if (rentalRevenue > 0 && salesRevenue === 0) {
      rentalOrderCount++;
    } else if (salesRevenue > 0 && rentalRevenue > 0) {
      mixedOrderCount++;
    }
  });

  return {
    salesRevenue: totalSalesRevenue,
    rentalRevenue: totalRentalRevenue,
    totalRevenue: totalSalesRevenue + totalRentalRevenue,
    cautionFeeRevenue: totalCautionFeeRevenue,
    orderCount: totalOrders,
    salesOrderCount,
    rentalOrderCount,
    mixedOrderCount,
  };
}
