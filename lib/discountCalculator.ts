/**
 * Discount Calculator for Custom Orders
 * Applies bulk discount tiers based on quantity
 */

export const DISCOUNT_TIERS = [
  { minQuantity: 10, discountPercentage: 10, label: "10% off" },
  { minQuantity: 6, discountPercentage: 7, label: "7% off" },
  { minQuantity: 3, discountPercentage: 5, label: "5% off" },
  { minQuantity: 1, discountPercentage: 0, label: "No discount" },
];

export const VAT_RATE = 0.075; // 7.5%

/**
 * Calculate the discount percentage based on quantity
 */
export function getDiscountPercentage(quantity: number): number {
  for (const tier of DISCOUNT_TIERS) {
    if (quantity >= tier.minQuantity) {
      return tier.discountPercentage;
    }
  }
  return 0;
}

/**
 * Get the discount tier label for a given quantity
 */
export function getDiscountLabel(quantity: number): string {
  for (const tier of DISCOUNT_TIERS) {
    if (quantity >= tier.minQuantity) {
      return tier.label;
    }
  }
  return "No discount";
}

/**
 * Calculate quote with discount and VAT
 * @param basePrice - The base price per unit
 * @param quantity - Number of units
 * @returns Object with pricing breakdown
 */
export function calculateQuote(basePrice: number, quantity: number) {
  const subtotal = basePrice * quantity;
  const discountPercentage = getDiscountPercentage(quantity);
  const discountAmount = subtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const vat = subtotalAfterDiscount * VAT_RATE;
  const total = subtotalAfterDiscount + vat;

  return {
    subtotal,
    discountPercentage,
    discountAmount,
    subtotalAfterDiscount,
    vat,
    total,
  };
}
