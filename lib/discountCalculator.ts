/**
 * Discount Calculator for Custom Orders
 * Applies bulk discount tiers based on quantity
 */

export const DISCOUNT_TIERS = [
  { minQuantity: 1, discountPercentage: 5, label: "5% off" },
];

// Default only - the live rate is admin-controlled (see lib/vat.ts and Settings.vatPercent)
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
 * @param vatRate - Effective VAT rate (0 when VAT is off). Applies to the goods only.
 * @returns Object with pricing breakdown
 */
export function calculateQuote(basePrice: number, quantity: number, vatRate: number = VAT_RATE) {
  const subtotal = basePrice * quantity;
  const discountPercentage = getDiscountPercentage(quantity);
  const discountAmount = subtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const vat = subtotalAfterDiscount * vatRate;
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
