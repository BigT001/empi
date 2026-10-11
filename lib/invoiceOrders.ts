/**
 * SERVER-ONLY: keep admin manual invoices and orders in step.
 *
 * Sales invoiced manually used to exist only as invoices, so they never showed up in
 * Orders, Finance or VAT. These helpers record a manual invoice as an order.
 *
 * Safety: only ever ADDS an order or updates an order that was created from the same
 * invoice. Never deletes anything and never touches online-checkout orders.
 */
import connectDB from '@/lib/mongodb';
import Invoice from '@/lib/models/Invoice';
import UnifiedOrder from '@/lib/models/UnifiedOrder';

export const MANUAL_INVOICE_SOURCE = 'manual_invoice';

interface InvoiceLike {
  _id?: unknown;
  invoiceNumber: string;
  orderNumber?: string;
  type?: string;
  status?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  subtotal?: number;
  bulkDiscountPercentage?: number;
  bulkDiscountAmount?: number;
  subtotalAfterDiscount?: number;
  cautionFee?: number;
  shippingCost?: number;
  taxAmount?: number;
  taxRate?: number;
  totalAmount?: number;
  items?: Array<{ name: string; quantity: number; price: number; mode?: string; productId?: string; selectedSize?: string; selectedColor?: string; rentalDays?: number }>;
  invoiceDate?: Date | string;
  createdAt?: Date | string;
  paymentMethod?: string;
  paymentReference?: string;
}

const orderNumberFor = (inv: InvoiceLike) => inv.orderNumber || inv.invoiceNumber;

/** Fields an order takes from its invoice (used for both create and sync) */
export function invoiceToOrderFields(inv: InvoiceLike) {
  const nameParts = (inv.customerName || '').trim().split(/\s+/).filter(Boolean);
  const subtotal = inv.subtotal || 0;
  const discountAmount = inv.bulkDiscountAmount || 0;
  const items = (inv.items || []).filter((i) => i?.name).map((i) => ({
    name: i.name,
    quantity: Math.max(1, Number(i.quantity) || 1),
    unitPrice: Number(i.price) || 0,
    mode: i.mode === 'rent' ? 'rent' : 'buy',
    rentalDays: i.rentalDays || 1,
    ...(i.productId && { productId: i.productId }),
    ...(i.selectedSize && { selectedSize: i.selectedSize }),
    ...(i.selectedColor && { selectedColor: i.selectedColor }),
  }));

  return {
    firstName: nameParts[0] || 'Customer',
    lastName: nameParts.slice(1).join(' '),
    // email is required on orders; one placeholder is used only when the invoice had none
    email: (inv.customerEmail || '').trim().toLowerCase() || `no-email+${inv.invoiceNumber.toLowerCase()}@empi.invalid`,
    phone: inv.customerPhone || '',
    address: inv.customerAddress || undefined,
    city: inv.customerCity || '',
    state: inv.customerState || undefined,
    country: 'Nigeria',
    items: items.length > 0
      ? items
      : [{ name: `Invoice ${inv.invoiceNumber}`, quantity: 1, unitPrice: subtotal, mode: 'buy', rentalDays: 1 }],
    subtotal,
    discountPercentage: inv.bulkDiscountPercentage || 0,
    discountAmount,
    subtotalAfterDiscount: inv.subtotalAfterDiscount ?? subtotal - discountAmount,
    vat: inv.taxAmount || 0,
    vatPercent: (inv.taxAmount || 0) > 0 ? inv.taxRate : 0,
    shippingCost: inv.shippingCost || 0,
    cautionFee: inv.cautionFee || 0,
    total: inv.totalAmount || 0,
    paymentMethod: inv.paymentMethod || 'manual',
    paymentReference: inv.paymentReference || inv.invoiceNumber,
  };
}

export type RecordResult = { invoiceNumber: string; orderNumber: string; status: 'created' | 'exists' | 'skipped' | 'failed'; error?: string };

/**
 * Create an order for a manual invoice if one doesn't already exist.
 * An existing order (even a deleted one) is left exactly as it is.
 */
export async function recordInvoiceAsOrder(inv: InvoiceLike): Promise<RecordResult> {
  const orderNumber = orderNumberFor(inv);
  const base = { invoiceNumber: inv.invoiceNumber, orderNumber };
  if (inv.type !== 'manual') return { ...base, status: 'skipped' };

  await connectDB();
  const existing = await UnifiedOrder.findOne({ orderNumber }).select('_id').lean();
  if (existing) return { ...base, status: 'exists' };

  try {
    const isPaid = inv.status === 'paid';
    await UnifiedOrder.create({
      ...invoiceToOrderFields(inv),
      orderNumber,
      orderType: 'regular',
      status: isPaid ? 'approved' : 'pending',
      paymentVerified: isPaid,
      ...(isPaid && { paymentVerifiedAt: new Date() }),
      source: MANUAL_INVOICE_SOURCE,
      invoiceNumber: inv.invoiceNumber,
      notes: `Recorded from manual invoice ${inv.invoiceNumber}`,
      // Keep the real sale date so reports land in the right month
      createdAt: inv.invoiceDate || inv.createdAt || new Date(),
    });
    return { ...base, status: 'created' };
  } catch (error) {
    // A parallel request may have created it first
    if ((error as { code?: number })?.code === 11000) return { ...base, status: 'exists' };
    return { ...base, status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * After a manual invoice is edited, mirror the change onto the order created from it.
 * Status only moves forward (unpaid → paid); an order already in production/delivery keeps its status.
 */
export async function syncOrderFromInvoice(inv: InvoiceLike): Promise<void> {
  if (inv.type !== 'manual') return;
  await connectDB();
  const order = await UnifiedOrder.findOne({
    orderNumber: orderNumberFor(inv),
    source: MANUAL_INVOICE_SOURCE,
    invoiceNumber: inv.invoiceNumber,
  });
  if (!order) return;

  order.set(invoiceToOrderFields(inv));
  if (inv.status === 'paid' && order.status === 'pending') {
    order.status = 'approved';
    order.paymentVerified = true;
    order.paymentVerifiedAt = new Date();
  }
  await order.save();
}

/** Manual invoices that have no matching order yet (read-only) */
export async function findUnrecordedInvoices() {
  await connectDB();
  const invoices = await Invoice.find({ type: 'manual' })
    .select('invoiceNumber orderNumber customerName customerEmail totalAmount taxAmount status invoiceDate createdAt')
    .sort({ createdAt: -1 })
    .lean();
  if (invoices.length === 0) return [];

  const orderNumbers = invoices.map((i: any) => i.orderNumber || i.invoiceNumber);
  const recorded = new Set(
    (await UnifiedOrder.find({ orderNumber: { $in: orderNumbers } }).select('orderNumber').lean()).map((o: any) => o.orderNumber)
  );
  return invoices.filter((i: any) => !recorded.has(i.orderNumber || i.invoiceNumber));
}
