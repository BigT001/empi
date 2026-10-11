/**
 * SERVER-ONLY: the single place that decides whether an online order is paid.
 *
 * The browser can never mark an order paid. An order is only marked paid when Flutterwave
 * confirms the transaction, the amount covers the order total, and the payment has not
 * already been used for a different order.
 */
import connectDB from '@/lib/mongodb';
import UnifiedOrder from '@/lib/models/UnifiedOrder';

export interface PaymentCheck {
  verified: boolean;
  reason?: string;
  amount?: number;
}

/** Ask Flutterwave whether a transaction reference was paid, and how much */
export async function verifyFlutterwaveReference(reference: string): Promise<PaymentCheck> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) return { verified: false, reason: 'Payment provider not configured' };
  if (!reference) return { verified: false, reason: 'No payment reference' };

  try {
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` }, cache: 'no-store' }
    );
    const data = await res.json().catch(() => null);
    const tx = data?.data;
    const successful = res.ok && data?.status === 'success' && (tx?.status === 'successful' || tx?.status === 'completed');
    if (!successful) return { verified: false, reason: 'Payment not successful' };
    if (tx.currency && tx.currency !== 'NGN') return { verified: false, reason: `Unexpected currency ${tx.currency}` };
    return { verified: true, amount: Number(tx.amount) || 0 };
  } catch (error) {
    console.error('[paymentVerification] Flutterwave verification failed:', error);
    return { verified: false, reason: 'Could not reach payment provider' };
  }
}

/**
 * Is `reference` a real, successful payment that covers `expectedTotal` and isn't already
 * attached to another paid order?
 */
export async function checkPaymentForOrder(
  reference: string | undefined | null,
  expectedTotal: number,
  excludeOrderId?: unknown
): Promise<PaymentCheck> {
  if (!reference) return { verified: false, reason: 'No payment reference' };

  await connectDB();
  const reused = await UnifiedOrder.findOne({
    paymentReference: reference,
    paymentVerified: true,
    ...(excludeOrderId ? { _id: { $ne: excludeOrderId } } : {}),
  }).select('_id').lean();
  if (reused) return { verified: false, reason: 'Payment already used for another order' };

  const check = await verifyFlutterwaveReference(reference);
  if (!check.verified) return check;

  // ₦1 tolerance for rounding between the cart total and the charged amount
  if ((check.amount || 0) + 1 < (Number(expectedTotal) || 0)) {
    return { verified: false, amount: check.amount, reason: `Paid ₦${check.amount} is less than order total ₦${expectedTotal}` };
  }
  return check;
}
