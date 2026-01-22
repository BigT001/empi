/**
 * ORDER UTILITIES - Single source of truth for all order operations
 * Professional, reusable functions for order management
 */

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;  // ← FIXED: Match database schema (was 'price')
  mode: 'buy' | 'rent'; // CRITICAL: Always set explicitly
  rentalDays?: number;
  selectedSize?: string;
  imageUrl?: string;
}

export interface OrderMetrics {
  orderType: 'sales' | 'rental' | 'mixed';
  itemCount: number;
  salesItemCount: number;
  rentalItemCount: number;
  salesSubtotal: number;
  rentalSubtotal: number;
  totalBeforeCaution: number;
}

export interface CautionFeeData {
  shouldApply: boolean;
  amount: number;
  reason: string;
}

/**
 * CRITICAL FUNCTION: Determine order type from items
 * This is the single source of truth - called everywhere
 */
export function determineOrderType(
  items: OrderItem[] | undefined | null
): 'sales' | 'rental' | 'mixed' {
  if (!items || items.length === 0) {
    return 'sales'; // Default for safety
  }

  const hasRental = items.some((item) => item.mode === 'rent');
  const hasSale = items.some((item) => item.mode === 'buy');

  if (hasRental && hasSale) return 'mixed';
  if (hasRental) return 'rental';
  return 'sales';
}

/**
 * CRITICAL FUNCTION: Validate order has all required fields
 * Prevents incomplete orders from being saved
 */
export function validateOrderItems(items: OrderItem[] | undefined | null): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push('Order must have at least one item');
    return { valid: false, errors };
  }

  items.forEach((item, idx) => {
    if (!item.productId) errors.push(`Item ${idx + 1}: Missing productId`);
    if (!item.name) errors.push(`Item ${idx + 1}: Missing name`);
    if (typeof item.quantity !== 'number' || item.quantity <= 0)
      errors.push(`Item ${idx + 1}: Invalid quantity`);
    if (typeof item.unitPrice !== 'number' || item.unitPrice < 0)  // ← FIXED: unitPrice
      errors.push(`Item ${idx + 1}: Invalid unitPrice`);
    if (!item.mode || !['buy', 'rent'].includes(item.mode))
      errors.push(`Item ${idx + 1}: Invalid mode (must be 'buy' or 'rent')`);
    if (item.mode === 'rent' && (!item.rentalDays || item.rentalDays <= 0))
      errors.push(`Item ${idx + 1}: Rental must have rentalDays > 0`);
  });

  return { valid: errors.length === 0, errors };
}

/**
 * CRITICAL FUNCTION: Calculate order metrics
 * Used for pricing, analytics, and validation
 */
export function calculateOrderMetrics(items: OrderItem[]): OrderMetrics {
  let salesSubtotal = 0;
  let rentalSubtotal = 0;
  let salesItemCount = 0;
  let rentalItemCount = 0;

  items.forEach((item) => {
    if (item.mode === 'buy') {
      salesSubtotal += item.unitPrice * item.quantity;  // ← FIXED: unitPrice
      salesItemCount++;
    } else if (item.mode === 'rent') {
      const rentalDays = item.rentalDays || 1;
      rentalSubtotal += item.unitPrice * item.quantity * rentalDays;  // ← FIXED: unitPrice
      rentalItemCount++;
    }
  });

  return {
    orderType: determineOrderType(items),
    itemCount: items.length,
    salesItemCount,
    rentalItemCount,
    salesSubtotal,
    rentalSubtotal,
    totalBeforeCaution: salesSubtotal + rentalSubtotal,
  };
}

/**
 * CRITICAL FUNCTION: Calculate caution fee
 * ONLY applies to rental orders!
 */
export function calculateCautionFee(items: OrderItem[]): CautionFeeData {
  const metrics = calculateOrderMetrics(items);

  // Caution fee ONLY for rentals
  if (metrics.orderType === 'sales' || metrics.rentalSubtotal === 0) {
    return {
      shouldApply: false,
      amount: 0,
      reason: 'No rental items',
    };
  }

  // Caution fee = 50% of rental subtotal (per item basis)
  const amount = Math.round((metrics.rentalSubtotal * 0.5 * 100) / 100);

  return {
    shouldApply: true,
    amount,
    reason: 'Rental items: 50% of rental subtotal',
  };
}

/**
 * Verify order type matches expected type
 */
export function verifyOrderType(
  items: OrderItem[],
  expectedType: 'sales' | 'rental' | 'mixed' | undefined
): boolean {
  const calculatedType = determineOrderType(items);
  if (!expectedType) return true;
  return calculatedType === expectedType;
}

/**
 * Get order summary for logging
 */
export function getOrderSummary(items: OrderItem[], orderNumber: string): string {
  const metrics = calculateOrderMetrics(items);
  const cautionFee = calculateCautionFee(items);

  return (
    `Order ${orderNumber}: ` +
    `${metrics.itemCount} items (${metrics.salesItemCount} sales, ${metrics.rentalItemCount} rental), ` +
    `Sales: ₦${metrics.salesSubtotal}, Rental: ₦${metrics.rentalSubtotal}, ` +
    `Caution: ₦${cautionFee.amount}, Type: ${metrics.orderType}`
  );
}
