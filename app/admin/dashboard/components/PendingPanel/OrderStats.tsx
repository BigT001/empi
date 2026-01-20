'use client';

import { getDiscountPercentage, VAT_RATE } from "@/lib/discountCalculator";

interface OrderStatsProps {
  itemCount: number;
  total: number;
  isPaid: boolean;
  items?: Array<{ name?: string; quantity: number; price: number; mode?: 'buy' | 'rent'; rentalDays?: number }>;
  rentalDays?: number;
  cautionFee?: number;
  isApproved?: boolean;
  // Discount fields from unified order (takes precedence over calculation)
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAfterDiscount?: number;
  vat?: number;
}

export function OrderStats({ 
  itemCount, 
  total, 
  isPaid, 
  items, 
  rentalDays = 1, 
  cautionFee = 0, 
  isApproved = false,
  subtotal: passedSubtotal,
  discountPercentage: passedDiscountPercentage,
  discountAmount: passedDiscountAmount,
  subtotalAfterDiscount: passedSubtotalAfterDiscount,
  vat: passedVat
}: OrderStatsProps) {
  // Ensure total is a valid number - THIS IS THE SOURCE OF TRUTH FROM CHECKOUT
  const safeTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
  
  console.log('[OrderStats] 💾 Received pricing from unified order:', {
    subtotal: passedSubtotal,
    discountPercentage: passedDiscountPercentage,
    discountAmount: passedDiscountAmount,
    subtotalAfterDiscount: passedSubtotalAfterDiscount,
    vat: passedVat
  });
  
  console.log('[OrderStats] items:', items);
  console.log('[OrderStats] rentalDays:', rentalDays);
  console.log('[OrderStats] items.length:', items?.length);
  console.log('[OrderStats] total input (from checkout):', total, 'safeTotal:', safeTotal);
  
  // Check if ANY items have a mode specified
  const hasAnyMode = items && items.some(item => item.mode);
  
  // If items don't have mode specified, treat them ALL as buy items (for regular orders from checkout)
  const buyItems = hasAnyMode 
    ? (items?.filter(item => item.mode === 'buy') || [])
    : (items || []); // Default: all items are buy items
  
  const rentalItems = hasAnyMode 
    ? (items?.filter(item => item.mode === 'rent') || [])
    : [];
  
  console.log('[OrderStats] hasAnyMode:', hasAnyMode);
  console.log('[OrderStats] buyItems:', buyItems);
  console.log('[OrderStats] rentalItems:', rentalItems);
  
  // Calculate buy subtotal
  const buySubtotal = buyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  
  // Calculate total buy quantity for discount tier
  const buyQuantity = buyItems.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  // 🎁 CRITICAL: Use discount data from unified order if available (passed from admin)
  // Otherwise, fall back to calculation based on quantity
  const finalDiscountPercentage = passedDiscountPercentage !== undefined ? passedDiscountPercentage : getDiscountPercentage(buyQuantity);
  const finalDiscountAmount = passedDiscountAmount !== undefined ? passedDiscountAmount : (buySubtotal * (finalDiscountPercentage / 100));
  const finalSubtotalAfterDiscount = passedSubtotalAfterDiscount !== undefined ? passedSubtotalAfterDiscount : (buySubtotal - finalDiscountAmount);
  
  console.log('[OrderStats] 🎁 Discount applied:', {
    calculated: { percent: getDiscountPercentage(buyQuantity), amount: buySubtotal * (getDiscountPercentage(buyQuantity) / 100) },
    passed: { percent: passedDiscountPercentage, amount: passedDiscountAmount },
    final: { percent: finalDiscountPercentage, amount: finalDiscountAmount, subtotalAfter: finalSubtotalAfterDiscount }
  });
  
  // Rental subtotal WITH rental days applied (multiply by rentalDays)
  const rentalSubtotalWithDays = rentalItems.reduce((sum, item) => {
    const days = rentalDays || 1;
    const itemTotal = item.price * item.quantity * days;
    console.log('[OrderStats] rental item:', item.name, 'price:', item.price, 'qty:', item.quantity, 'usedDays:', days, 'itemTotal:', itemTotal);
    return sum + itemTotal;
  }, 0) || 0;
  
  console.log('[OrderStats] rentalSubtotalWithDays:', rentalSubtotalWithDays);
  
  // Total goods BEFORE VAT = buy after discount + rental (with days)
  const goodsSubtotal = finalSubtotalAfterDiscount + rentalSubtotalWithDays;
  
  // === CRITICAL FIX: Extract VAT from the authoritative checkout total ===
  // For regular orders from checkout, safeTotal is: goodsSubtotal * 1.075 (where 1.075 = 1 + 0.075)
  // To isolate VAT: vat = safeTotal - (safeTotal / 1.075)
  // Simplified: vat = safeTotal * (0.075 / 1.075) = safeTotal * 0.069767
  // OR: vat = safeTotal * VAT_RATE / (1 + VAT_RATE)
  const vatFromTotal = safeTotal > 0 ? safeTotal * (VAT_RATE / (1 + VAT_RATE)) : 0;
  const goodsFromTotal = safeTotal > 0 ? safeTotal - vatFromTotal : 0;
  
  // Use the checkout total breakdown if we have a valid total, otherwise fall back to calculated
  const vat = safeTotal > 0 ? vatFromTotal : (goodsSubtotal * VAT_RATE);
  const displayGoodsSubtotal = safeTotal > 0 ? goodsFromTotal : goodsSubtotal;
  
  console.log('[OrderStats] buySubtotal:', buySubtotal, 'finalDiscountPercentage:', finalDiscountPercentage, 'finalDiscountAmount:', finalDiscountAmount, 'finalSubtotalAfterDiscount:', finalSubtotalAfterDiscount);
  console.log('[OrderStats] calculatedGoodsSubtotal:', goodsSubtotal, 'safeTotal:', safeTotal);
  console.log('[OrderStats] VAT (extracted from total):', vat, 'goods (extracted):', displayGoodsSubtotal);
  
  // Final total = source of truth from checkout
  const finalTotal = safeTotal;

  return (
    <div className="space-y-3 pt-3 border-t border-lime-200">
      {/* Items Count */}
      <div className="bg-red-50 rounded-lg p-2 text-center border border-red-300">
        <p className="text-2xl font-bold text-red-700">{itemCount || '—'}</p>
        <p className="text-xs text-red-600 font-medium">Items</p>
      </div>

      {/* Pricing Grid - 2 Columns */}
      <div className="grid grid-cols-2 gap-2">
        {/* Subtotal (Buy Only) */}
        {buySubtotal > 0 && (
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-300">
            <p className="text-xs text-gray-600 font-medium">Buy Subtotal</p>
            <p className="text-sm font-bold text-gray-700">₦{Number(buySubtotal).toLocaleString('en-NG')}</p>
          </div>
        )}

        {/* Discount (if applicable) */}
        {finalDiscountPercentage > 0 ? (
          <div className="bg-green-50 rounded-lg p-2 text-center border border-green-300">
            <p className="text-xs text-green-600 font-medium">Discount ({finalDiscountPercentage}%)</p>
            <p className="text-sm font-bold text-green-700">-₦{Number(finalDiscountAmount).toLocaleString('en-NG')}</p>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-300">
            <p className="text-xs text-blue-600 font-medium">After Discount</p>
            <p className="text-sm font-bold text-blue-700">₦{Number(finalSubtotalAfterDiscount).toLocaleString('en-NG')}</p>
          </div>
        )}

        {/* After Discount (if discount applied) */}
        {finalDiscountPercentage > 0 && (
          <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-300">
            <p className="text-xs text-blue-600 font-medium">After Discount</p>
            <p className="text-sm font-bold text-blue-700">₦{Number(finalSubtotalAfterDiscount).toLocaleString('en-NG')}</p>
          </div>
        )}

        {/* Rental Subtotal (if rentals exist) */}
        {rentalSubtotalWithDays > 0 && (
          <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-300">
            <p className="text-xs text-purple-600 font-medium">Rental ({rentalDays}d)</p>
            <p className="text-sm font-bold text-purple-700">₦{Number(rentalSubtotalWithDays).toLocaleString('en-NG')}</p>
          </div>
        )}

        {/* VAT - Using value extracted from checkout total */}
        <div className="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-300">
          <p className="text-xs text-yellow-600 font-medium">VAT (7.5%)</p>
          <p className="text-sm font-bold text-yellow-700">₦{Number(vat).toLocaleString('en-NG')}</p>
        </div>
      </div>

      {/* Final Total - Full Width */}
      <div className={`rounded-lg p-3 text-center border font-bold ${
        isPaid
          ? 'bg-green-50 border-green-300'
          : 'bg-red-50 border-red-300'
      }`}>
        <p className={`text-xs font-medium ${
          (isPaid || isApproved)
            ? 'text-green-600'
            : 'text-red-600'
        }`}>
          {(isPaid || isApproved) ? '✅ PAID' : '⏳ Total Due'}
        </p>
        <p className={`text-2xl font-bold ${
          (isPaid || isApproved)
            ? 'text-green-700'
            : 'text-red-700'
        }`}>
          ₦{Number(finalTotal).toLocaleString('en-NG')}
        </p>
      </div>
    </div>
  );
}
