/**
 * Centralized price calculation utilities
 * All price calculations across the application should use these functions
 * to ensure consistency and synchronization
 */

import { getDiscountPercentage } from './discountCalculator';

export const VAT_RATE = 0.075; // 7.5%

export interface PriceBreakdown {
  unitPrice: number;
  quantity: number;
  subtotal: number; // unitPrice * quantity (before discount)
  discountPercentage: number;
  discountAmount: number;
  subtotalAfterDiscount: number; // subtotal - discount
  vat: number; // VAT on discounted subtotal
  total: number; // subtotalAfterDiscount + vat
}

/**
 * Calculate complete price breakdown for a given unit price and quantity
 * This is the single source of truth for all price calculations
 * Includes discount tiers based on quantity
 */
export function calculatePrice(unitPrice: number, quantity: number): PriceBreakdown {
  const roundedUnitPrice = Math.round(unitPrice);
  const roundedQuantity = Math.round(quantity);
  
  const subtotal = Math.round(roundedUnitPrice * roundedQuantity);
  const discountPercentage = getDiscountPercentage(roundedQuantity);
  const discountAmount = Math.round(subtotal * (discountPercentage / 100));
  const subtotalAfterDiscount = Math.round(subtotal - discountAmount);
  const vat = Math.round(subtotalAfterDiscount * VAT_RATE);
  const total = Math.round(subtotalAfterDiscount + vat);

  return {
    unitPrice: roundedUnitPrice,
    quantity: roundedQuantity,
    subtotal,
    discountPercentage,
    discountAmount,
    subtotalAfterDiscount,
    vat,
    total,
  };
}

/**
 * Extract unit price from an order's quotedPrice and quantity
 * quotedPrice is stored as total price, so we divide by quantity to get per-unit
 */
export function extractUnitPriceFromOrder(order: any): number {
  // Prefer explicit unitPrice field if available
  if (order.unitPrice) {
    console.log('[priceCalculations] 📊 Using stored unitPrice:', {
      unitPrice: order.unitPrice,
      source: 'order.unitPrice field'
    });
    return Math.round(order.unitPrice);
  }

  // Calculate from quotedPrice and quantity
  if (order.quotedPrice && order.quantity) {
    const calculatedUnitPrice = Math.round(order.quotedPrice / order.quantity);
    console.log('[priceCalculations] 📊 Calculated unitPrice from quotedPrice:', {
      quotedPrice: order.quotedPrice,
      quantity: order.quantity,
      calculatedUnitPrice,
      source: 'quotedPrice ÷ quantity'
    });
    return calculatedUnitPrice;
  }

  console.warn('[priceCalculations] ⚠️ Could not extract unit price from order:', {
    quotedPrice: order.quotedPrice,
    unitPrice: order.unitPrice,
    quantity: order.quantity
  });
  return 0;
}

/**
 * Calculate total price for display on main card
 * IMPORTANT: If admin has sent a quote (quotedPrice exists), use that directly!
 * Don't recalculate - the admin's quote already includes their chosen discount and VAT
 * Only recalculate if there's no explicit quote (using default discount tiers)
 */
export function calculateMainCardTotal(order: any): number {
  // If admin has sent a quote, use that as the total (don't recalculate)
  if (order.quotedPrice) {
    console.log('[priceCalculations] 💳 Main card total (using admin quote):', {
      total: order.quotedPrice,
      source: 'admin quotedPrice (no recalculation)'
    });
    return Math.round(order.quotedPrice);
  }

  // If no explicit quote, calculate from unit price with default discounts
  const unitPrice = extractUnitPriceFromOrder(order);
  const quantity = order.quantity || 1;
  const { total } = calculatePrice(unitPrice, quantity);
  
  console.log('[priceCalculations] 💳 Main card total (calculated from unitPrice):', {
    unitPrice,
    quantity,
    total,
    source: 'calculated with discount tiers'
  });
  
  return total;
}

/**
 * Generate quantity-update message data
 * Used by: Dashboard quantity-update message creation
 */
export function generateQuantityUpdateData(
  order: any,
  oldQuantity: number,
  newQuantity: number
): any {
  const unitPrice = extractUnitPriceFromOrder(order);
  const priceBreakdown = calculatePrice(unitPrice, newQuantity);

  return {
    oldQty: Math.round(oldQuantity),
    newQty: Math.round(newQuantity),
    unitPrice: Math.round(priceBreakdown.unitPrice),
    subtotal: Math.round(priceBreakdown.subtotal),
    discountPercentage: Math.round(priceBreakdown.discountPercentage),
    discountAmount: Math.round(priceBreakdown.discountAmount),
    subtotalAfterDiscount: Math.round(priceBreakdown.subtotalAfterDiscount),
    vat: Math.round(priceBreakdown.vat),
    newTotal: Math.round(priceBreakdown.total),
  };
}

/**
 * Generate quantity-update message content text
 * Ensures consistency with the data structure including discounts
 */
export function generateQuantityUpdateMessageContent(
  oldQty: number,
  newQty: number,
  subtotal: number,
  discountPercentage: number,
  discountAmount: number,
  subtotalAfterDiscount: number,
  vat: number,
  newTotal: number
): string {
  let content = `📊 Quantity Updated: ${oldQty} → ${newQty} units\nSubtotal: ₦${Math.round(subtotal).toLocaleString()}`;
  
  if (discountPercentage > 0) {
    content += `\nDiscount (${discountPercentage}%): -₦${Math.round(discountAmount).toLocaleString()}\nSubtotal after discount: ₦${Math.round(subtotalAfterDiscount).toLocaleString()}`;
  }
  
  content += `\nVAT (7.5%): ₦${Math.round(vat).toLocaleString()}\nTotal: ₦${Math.round(newTotal).toLocaleString()}`;
  
  return content;
}

/**
 * Calculate total price from a message's quote data
 * Used when we have quote message data instead of relying on order.quotedPrice
 */
export function calculateTotalFromQuoteMessage(quotedPrice: number, quotedVAT: number): number {
  // quotedPrice in messages is per-unit, quotedVAT is the VAT amount
  // Total is: quotedPrice + quotedVAT (since quotedPrice is already calculated subtotal)
  return Math.round((quotedPrice || 0) + (quotedVAT || 0));
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `₦${Math.round(price).toLocaleString()}`;
}
