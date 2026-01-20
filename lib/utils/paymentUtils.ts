/**
 * Utility functions to check payment status
 */

export interface PaymentCheckResult {
  hasPaymentStarted: boolean;
  isFullyPaid: boolean;
  hasMixedPayment: boolean;
  paymentStatus: 'pending' | 'partial' | 'full';
  paymentProofUrl?: string;
}

/**
 * Check if payment has been made (full or partial/mixed)
 * @param order - The order object to check
 * @returns PaymentCheckResult with detailed payment status
 */
export function checkPaymentStatus(order: any): PaymentCheckResult {
  // Check if payment proof was uploaded (indicates payment was attempted/made)
  const hasPaymentProof = !!order?.paymentProofUrl;
  
  // Check if payment was verified by admin
  const isPaymentVerified = order?.paymentVerified === true;
  
  // Check if status changed to 'paid' (another indicator of successful payment)
  const statusIndicatesPaid = order?.status === 'paid';
  
  // Determine payment status
  let paymentStatus: 'pending' | 'partial' | 'full' = 'pending';
  let hasPaymentStarted = false;
  let isFullyPaid = false;
  let hasMixedPayment = false;

  // If any payment-related data exists, payment has been started
  if (hasPaymentProof || isPaymentVerified || statusIndicatesPaid) {
    hasPaymentStarted = true;
  }

  // If payment is verified, consider it full payment (user can pay in parts but we track as one verification)
  if (isPaymentVerified) {
    isFullyPaid = true;
    paymentStatus = 'full';
  } 
  // If payment proof exists but not verified, it's partial/pending verification
  else if (hasPaymentProof) {
    hasMixedPayment = true;
    paymentStatus = 'partial';
  }

  return {
    hasPaymentStarted,
    isFullyPaid,
    hasMixedPayment,
    paymentStatus,
    paymentProofUrl: order?.paymentProofUrl,
  };
}

/**
 * Check if order has any payment activity
 * @param order - The order object to check
 * @returns true if any payment has been made (full or partial)
 */
export function isPaymentMade(order: any): boolean {
  const result = checkPaymentStatus(order);
  return result.hasPaymentStarted;
}

/**
 * Check specifically for mixed/partial payment
 * @param order - The order object to check
 * @returns true if mixed payment has been made (payment proof uploaded but not verified)
 */
export function hasMixedPayment(order: any): boolean {
  const result = checkPaymentStatus(order);
  return result.hasMixedPayment;
}

/**
 * Check if payment is fully verified
 * @param order - The order object to check
 * @returns true if payment has been verified by admin
 */
export function isPaymentVerified(order: any): boolean {
  const result = checkPaymentStatus(order);
  return result.isFullyPaid;
}
