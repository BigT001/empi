/**
 * VAT - single source of truth (safe for both client and server)
 *
 * RULE: VAT applies ONLY to the products/services the customer is buying or renting.
 * It must NEVER be charged on:
 *   - logistics / delivery / shipping / transport fees
 *   - the refundable caution fee (deposit)
 *
 * The rate and on/off switch are controlled by admins in Settings
 * (Settings.vatPercent and Settings.isVatDisabled).
 */

export const DEFAULT_VAT_PERCENT = 7.5;

export interface VatConfig {
  isVatDisabled: boolean;
  /** Configured percentage, e.g. 7.5 (kept even while VAT is turned off) */
  vatPercent: number;
  /** Effective decimal rate to charge, 0 when VAT is turned off */
  vatRate: number;
}

export const DEFAULT_VAT_CONFIG: VatConfig = {
  isVatDisabled: false,
  vatPercent: DEFAULT_VAT_PERCENT,
  vatRate: DEFAULT_VAT_PERCENT / 100,
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * Coerce any input into a valid VAT percentage between 0 and 100.
 * Missing/invalid values fall back to the default so old Settings documents keep working.
 */
export function normalizeVatPercent(value: unknown, fallback: number = DEFAULT_VAT_PERCENT): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(num)) return fallback;
  return Math.min(100, Math.max(0, roundMoney(num)));
}

export function resolveVatConfig(settings?: { isVatDisabled?: boolean; vatPercent?: number } | null): VatConfig {
  const isVatDisabled = Boolean(settings?.isVatDisabled);
  const vatPercent = normalizeVatPercent(settings?.vatPercent);
  return {
    isVatDisabled,
    vatPercent,
    vatRate: isVatDisabled ? 0 : vatPercent / 100,
  };
}

/** VAT on an amount that is already restricted to taxable goods/services */
export function calculateVat(taxableAmount: number, vatRate: number): number {
  if (!Number.isFinite(taxableAmount) || taxableAmount <= 0 || !vatRate) return 0;
  return roundMoney(taxableAmount * vatRate);
}

/** "7.5%" style label for an effective decimal rate */
export function formatVatPercent(vatRate: number): string {
  return `${roundMoney(vatRate * 100)}%`;
}

const NON_TAXABLE_CHARGE_PATTERN =
  /deliver|logistic|shipping|shipment|transport|dispatch|courier|freight|haulage|waybill|pick[\s-]?up|caution|deposit/i;

/**
 * Charges like delivery/logistics or the refundable caution deposit are not products,
 * so quote lines with these names default to VAT-exempt. Admins can still override per line.
 */
export function isNonTaxableCharge(name: string | undefined | null): boolean {
  return !!name && NON_TAXABLE_CHARGE_PATTERN.test(name);
}

export interface QuoteLineItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  /** true = this line is not a product (e.g. logistics) and VAT must not be charged on it */
  vatExempt?: boolean;
}

export interface QuoteTotals {
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  /** Portion of the discounted subtotal that VAT is charged on (products only) */
  taxableAmount: number;
  vat: number;
  vatPercent: number;
  total: number;
  totalQuantity: number;
}

/**
 * Totals for an admin-built custom order quote.
 * The discount applies across the quote as before; VAT is charged only on product lines.
 */
export function calculateQuoteTotals(
  items: QuoteLineItem[],
  discountPercentage: number,
  vatRate: number
): QuoteTotals {
  const lineTotal = (item: QuoteLineItem) => (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

  const subtotal = roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const taxableSubtotal = items.reduce((sum, item) => sum + (item.vatExempt ? 0 : lineTotal(item)), 0);
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const discountFactor = 1 - discountPercentage / 100;
  const discountAmount = roundMoney(subtotal * (discountPercentage / 100));
  const subtotalAfterDiscount = roundMoney(subtotal - discountAmount);
  const taxableAmount = roundMoney(taxableSubtotal * discountFactor);
  const vat = calculateVat(taxableAmount, vatRate);

  return {
    subtotal,
    discountPercentage,
    discountAmount,
    subtotalAfterDiscount,
    taxableAmount,
    vat,
    vatPercent: roundMoney(vatRate * 100),
    total: roundMoney(subtotalAfterDiscount + vat),
    totalQuantity,
  };
}

interface StoredQuoteOrder {
  quoteItems?: QuoteLineItem[];
  quotedPrice?: number;
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAfterDiscount?: number;
  vat?: number;
  vatPercent?: number;
  total?: number;
}

/**
 * Pricing exactly as quoted and charged for a custom order, for invoices/receipts.
 * Uses the stored breakdown when present so VAT is never recalculated on top of a total.
 */
export function resolveStoredQuotePricing(order: StoredQuoteOrder) {
  const legacyPercent = (vat: number) => (vat > 0 ? DEFAULT_VAT_PERCENT : 0);

  if (typeof order.total === 'number' && order.total > 0 && typeof order.vat === 'number') {
    const vat = order.vat;
    const subtotalAfterDiscount = order.subtotalAfterDiscount || roundMoney(order.total - vat);
    return {
      subtotal: order.subtotal || subtotalAfterDiscount,
      discountPercentage: order.discountPercentage || 0,
      discountAmount: order.discountAmount || 0,
      subtotalAfterDiscount,
      vat,
      vatPercent: typeof order.vatPercent === 'number' ? order.vatPercent : legacyPercent(vat),
      total: order.total,
    };
  }

  if (order.quoteItems && order.quoteItems.length > 0) {
    const vatPercent = typeof order.vatPercent === 'number' ? order.vatPercent : DEFAULT_VAT_PERCENT;
    const totals = calculateQuoteTotals(order.quoteItems, order.discountPercentage || 0, vatPercent / 100);
    return {
      subtotal: totals.subtotal,
      discountPercentage: totals.discountPercentage,
      discountAmount: totals.discountAmount,
      subtotalAfterDiscount: totals.subtotalAfterDiscount,
      vat: totals.vat,
      vatPercent,
      total: totals.total,
    };
  }

  // Oldest orders only stored a VAT-inclusive quotedPrice at 7.5%
  const total = order.quotedPrice || 0;
  const vat = roundMoney(total - total / (1 + DEFAULT_VAT_PERCENT / 100));
  return {
    subtotal: roundMoney(total - vat),
    discountPercentage: 0,
    discountAmount: 0,
    subtotalAfterDiscount: roundMoney(total - vat),
    vat,
    vatPercent: legacyPercent(vat),
    total,
  };
}
