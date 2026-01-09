import { getDiscountPercentage, VAT_RATE } from "@/lib/discountCalculator";

interface OrderStatsProps {
  itemCount: number;
  total: number;
  isPaid: boolean;
  items?: Array<{ name?: string; quantity: number; price: number; mode?: 'buy' | 'rent'; rentalDays?: number }>;
  rentalDays?: number;
  cautionFee?: number;
}

export function OrderStats({ itemCount, total, isPaid, items, rentalDays = 1, cautionFee = 0 }: OrderStatsProps) {
  // The order.total is the source of truth from checkout
  // We calculate rental subtotal from items (with rental days) for display
  
  console.log('[OrderStats] items:', items);
  console.log('[OrderStats] rentalDays:', rentalDays);
  console.log('[OrderStats] items.length:', items?.length);
  
  // Calculate discount ONLY on buy items, NOT rentals
  const buyItems = items?.filter(item => item.mode === 'buy') || [];
  const rentalItems = items?.filter(item => item.mode === 'rent') || [];
  
  console.log('[OrderStats] buyItems:', buyItems);
  console.log('[OrderStats] rentalItems:', rentalItems);
  
  // Fallback: if no items have mode set, treat all as rentals (for legacy orders)
  const allItemsHaveMode = items && items.some(item => item.mode);
  const actualRentalItems = allItemsHaveMode ? rentalItems : (items || []);
  const actualBuyItems = allItemsHaveMode ? buyItems : [];
  
  console.log('[OrderStats] allItemsHaveMode:', allItemsHaveMode);
  console.log('[OrderStats] actualRentalItems:', actualRentalItems);
  console.log('[OrderStats] actualBuyItems:', actualBuyItems);
  
  // Calculate buy subtotal
  const buySubtotal = actualBuyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  
  // Calculate total buy quantity for discount tier
  const buyQuantity = actualBuyItems.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  // Get discount percentage (only applies to buy items)
  const discountPercentage = getDiscountPercentage(buyQuantity);
  const discountAmount = buySubtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = buySubtotal - discountAmount;
  
  // Rental subtotal WITH rental days applied (multiply by rentalDays)
  const rentalSubtotalWithDays = actualRentalItems.reduce((sum, item) => {
    // IMPORTANT: Use the order's rentalDays prop, NOT item.rentalDays
    // item.rentalDays is often 1 from the checkout, the real rental days are in the order.rentalSchedule
    const days = rentalDays || 1;
    const itemTotal = item.price * item.quantity * days;
    console.log('[OrderStats] rental item:', item.name, 'price:', item.price, 'qty:', item.quantity, 'usedDays:', days, 'itemTotal:', itemTotal);
    return sum + itemTotal;
  }, 0) || 0;
  
  console.log('[OrderStats] rentalSubtotalWithDays:', rentalSubtotalWithDays);
  
  // Total goods = buy after discount + rental (with days)
  const goodsSubtotal = subtotalAfterDiscount + rentalSubtotalWithDays;
  
  // VAT is calculated on goods subtotal (after rental days multiplication)
  const vat = goodsSubtotal * VAT_RATE;
  
  // Final total = goods + VAT (order.total from checkout is source of truth)
  const finalTotal = total;

  return (
    <div className="space-y-3 pt-3 border-t border-red-200">
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
        {discountPercentage > 0 ? (
          <div className="bg-green-50 rounded-lg p-2 text-center border border-green-300">
            <p className="text-xs text-green-600 font-medium">Discount ({discountPercentage}%)</p>
            <p className="text-sm font-bold text-green-700">-₦{Number(discountAmount).toLocaleString('en-NG')}</p>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-300">
            <p className="text-xs text-blue-600 font-medium">After Discount</p>
            <p className="text-sm font-bold text-blue-700">₦{Number(subtotalAfterDiscount).toLocaleString('en-NG')}</p>
          </div>
        )}

        {/* After Discount (if discount applied) */}
        {discountPercentage > 0 && (
          <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-300">
            <p className="text-xs text-blue-600 font-medium">After Discount</p>
            <p className="text-sm font-bold text-blue-700">₦{Number(subtotalAfterDiscount).toLocaleString('en-NG')}</p>
          </div>
        )}

        {/* Rental Subtotal (if rentals exist) */}
        {rentalSubtotalWithDays > 0 && (
          <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-300">
            <p className="text-xs text-purple-600 font-medium">Rental ({rentalDays}d)</p>
            <p className="text-sm font-bold text-purple-700">₦{Number(rentalSubtotalWithDays).toLocaleString('en-NG')}</p>
          </div>
        )}

        {/* VAT */}
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
          isPaid
            ? 'text-green-600'
            : 'text-red-600'
        }`}>
          {isPaid ? '✅ PAID' : '⏳ Total Due'}
        </p>
        <p className={`text-2xl font-bold ${
          isPaid
            ? 'text-green-700'
            : 'text-red-700'
        }`}>
          ₦{Number(finalTotal).toLocaleString('en-NG')}
        </p>
      </div>
    </div>
  );
}
