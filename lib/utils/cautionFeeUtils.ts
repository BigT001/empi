/**
 * CAUTION FEE UTILITIES - Single source of truth for caution fee logic
 * Only applies to RENTAL orders
 */

import { OrderItem } from './orderUtils';

export interface CautionFeeCalculation {
  isRentalOrder: boolean;
  baseAmount: number; // Per item rental cost before days
  totalRentalCost: number; // After multiplying by rental days
  cautionFeeAmount: number; // 50% of rental cost
  breakdown: Array<{
    itemName: string;
    rentalCost: number;
    cautionFee: number;
  }>;
}

export interface CautionFeeRefund {
  status: 'refunded' | 'partially_refunded' | 'forfeited';
  originalAmount: number;
  refundAmount: number;
  deductionAmount: number;
  deductionReason?: string;
}

/**
 * CRITICAL: Calculate caution fee with detailed breakdown
 * ONLY calculates for rental orders
 */
export function calculateCautionFeeDetailed(
  items: OrderItem[] | undefined
): CautionFeeCalculation {
  const breakdown: CautionFeeCalculation['breakdown'] = [];
  let totalRentalCost = 0;
  let totalCautionFee = 0;

  if (!items || items.length === 0) {
    return {
      isRentalOrder: false,
      baseAmount: 0,
      totalRentalCost: 0,
      cautionFeeAmount: 0,
      breakdown: [],
    };
  }

  // Process only rental items
  items.forEach((item) => {
    if (item.mode === 'rent') {
      const rentalDays = item.rentalDays || 1;
      const baseCost = item.price * item.quantity;
      const rentalCost = baseCost * rentalDays;
      const cautionFee = Math.round((rentalCost * 0.5 * 100) / 100);

      breakdown.push({
        itemName: item.name,
        rentalCost,
        cautionFee,
      });

      totalRentalCost += rentalCost;
      totalCautionFee += cautionFee;
    }
  });

  const baseAmount = totalRentalCost / 2; // Before rounding

  return {
    isRentalOrder: breakdown.length > 0,
    baseAmount,
    totalRentalCost,
    cautionFeeAmount: totalCautionFee,
    breakdown,
  };
}

/**
 * Simple version - just the amount
 */
export function calculateCautionFeeAmount(
  items: OrderItem[] | undefined
): number {
  const calculation = calculateCautionFeeDetailed(items);
  return calculation.cautionFeeAmount;
}

/**
 * Validate that rental orders have caution fees
 */
export function validateCautionFeeForOrder(
  items: OrderItem[] | undefined,
  cautionFee: number | undefined
): { valid: boolean; message: string } {
  const calculation = calculateCautionFeeDetailed(items);

  if (!calculation.isRentalOrder) {
    // Sales order - should NOT have caution fee
    if (cautionFee && cautionFee > 0) {
      return {
        valid: false,
        message: 'Sales orders should not have caution fees',
      };
    }
    return { valid: true, message: 'Sales order - no caution fee needed' };
  }

  // Rental order - MUST have matching caution fee
  if (!cautionFee || cautionFee === 0) {
    return {
      valid: false,
      message: `Rental order missing caution fee (should be ₦${calculation.cautionFeeAmount})`,
    };
  }

  // Allow 1% tolerance for rounding
  const tolerance = calculation.cautionFeeAmount * 0.01;
  const difference = Math.abs(cautionFee - calculation.cautionFeeAmount);

  if (difference > tolerance) {
    return {
      valid: false,
      message: `Caution fee mismatch: got ₦${cautionFee}, expected ₦${calculation.cautionFeeAmount}`,
    };
  }

  return {
    valid: true,
    message: `Valid caution fee: ₦${cautionFee}`,
  };
}

/**
 * Calculate refund amount based on costume condition
 */
export function calculateCautionFeeRefund(
  originalAmount: number,
  condition: 'good' | 'damaged' | 'lost'
): CautionFeeRefund {
  switch (condition) {
    case 'good':
      return {
        status: 'refunded',
        originalAmount,
        refundAmount: originalAmount,
        deductionAmount: 0,
        deductionReason: 'Costume returned in good condition',
      };

    case 'damaged':
      // Deduct 30% for damaged costume
      const deduction = Math.round((originalAmount * 0.3 * 100) / 100);
      return {
        status: 'partially_refunded',
        originalAmount,
        refundAmount: originalAmount - deduction,
        deductionAmount: deduction,
        deductionReason: 'Costume returned with damage (30% deduction)',
      };

    case 'lost':
      return {
        status: 'forfeited',
        originalAmount,
        refundAmount: 0,
        deductionAmount: originalAmount,
        deductionReason: 'Costume not returned (100% forfeiture)',
      };

    default:
      return {
        status: 'refunded',
        originalAmount,
        refundAmount: originalAmount,
        deductionAmount: 0,
      };
  }
}

/**
 * Format caution fee info for display
 */
export function formatCautionFeeInfo(
  items: OrderItem[] | undefined
): {
  isApplicable: boolean;
  message: string;
  amount: number;
} {
  const calculation = calculateCautionFeeDetailed(items);

  if (!calculation.isRentalOrder) {
    return {
      isApplicable: false,
      message: 'No caution fee for sales orders',
      amount: 0,
    };
  }

  return {
    isApplicable: true,
    message: `Caution fee (50% of rental cost, refundable): ₦${calculation.cautionFeeAmount}`,
    amount: calculation.cautionFeeAmount,
  };
}
