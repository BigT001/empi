# CAUTION FEE QUICK REFERENCE CARD

## 🔍 WHAT IS A CAUTION FEE?

A **refundable deposit** charged to customers renting items to incentivize careful handling and return.

---

## 📐 THE MATH

```
CAUTION FEE = 50% of (Rental Items Subtotal)
           = 50% of (price × quantity)
           ≠ NOT multiplied by rental days
           ≠ Does NOT include sales items
```

### Example:
```
Order:
  - Red Gown (rent) ₦3,000 × 1 = ₦3,000
  - Gold Heels (rent) ₦2,000 × 1 = ₦2,000  
  - Tiara (sell) ₦500 × 1 = ₦500

Rental Subtotal: ₦3,000 + ₦2,000 = ₦5,000
Caution Fee: ₦5,000 × 0.5 = ₦2,500 ✓
```

---

## 📍 WHERE IT APPEARS

| Page | Status | Notes |
|------|--------|-------|
| Product Page | ❌ | Not needed |
| Shopping Cart | ✅ | Shown in summary |
| Checkout | ✅ | Prominent in breakdown |
| Order Confirmation | ✅ | Shown in email |
| Invoice | ✅ | Itemized section |
| Admin Dashboard | ✅ | Metrics & charts |
| Admin Order Detail | ✅ | Fee management |
| Customer Account | ✅ | In order history |

---

## 💾 KEY FILES

### Calculation
- `app/components/CartContext.tsx` (Line 249) - Where fee is calculated

### Validation  
- `lib/utils/cautionFeeUtils.ts` - Utility functions
- `app/api/orders/route.ts` (Line 63) - Order API validation

### Display
- `app/checkout/page.tsx` - Customer checkout
- `app/admin/components/EnhancedDashboard.tsx` - Admin metrics
- `app/admin/dashboard/components/PendingPanel/` - Order details

### Analytics
- `app/api/admin/analytics/route.ts` (Line 265) - Metrics aggregation

---

## 🔧 HOW TO USE IN YOUR CODE

### Display Current Fee
```typescript
import { useCart } from '@/app/components/CartContext';

export function MyComponent() {
  const { cautionFee, items } = useCart();
  
  return (
    <div>
      🔒 Caution Fee: ₦{Math.round(cautionFee).toLocaleString()}
    </div>
  );
}
```

### Calculate Fee for Order
```typescript
import { calculateCautionFeeAmount } from '@/lib/utils/cautionFeeUtils';

const rentalItems = order.items.filter(item => item.mode === 'rent');
const fee = calculateCautionFeeAmount(rentalItems);
```

### Validate Fee
```typescript
import { validateCautionFeeForOrder } from '@/lib/utils/cautionFeeUtils';

const isValid = validateCautionFeeForOrder(order.items, order.cautionFee);
if (!isValid) {
  console.error('Caution fee mismatch!');
}
```

### Get Dashboard Metrics
```typescript
const response = await fetch('/api/admin/analytics');
const data = await response.json();
const metrics = data.cautionFeeMetrics;

console.log('Collected:', metrics.totalCollected);
console.log('Refunded:', metrics.totalRefunded);
```

---

## 📊 DATABASE FIELDS

### Order Model
```typescript
{
  _id: ObjectId,
  items: [...],
  cautionFee: number,  // 50% of rental subtotal
  total: number,
  createdAt: Date
}
```

### CautionFeeTransaction Model
```typescript
{
  orderId: ObjectId,
  customerId: ObjectId,
  amount: number,
  status: 'pending_return' | 'refunded' | 'partially_refunded' | 'forfeited',
  refundAmount?: number,
  timeline: {
    collectedAt: Date,
    refundedAt?: Date,
    refundReason?: string
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

Quick way to verify the system is working:

- [ ] Create rental order → See caution fee in checkout
- [ ] Complete order → Fee stored in database
- [ ] Visit admin dashboard → Metrics show caution fees
- [ ] Open order details → Individual order shows fee
- [ ] Verify sales orders → NO caution fee (correct!)
- [ ] Check analytics API → Returns cautionFeeMetrics object

---

## 🐛 TROUBLESHOOTING

### Problem: Caution fee not showing in checkout
**Solution:**
1. Ensure order has rental items (mode: 'rent')
2. Check CartContext is calculating correctly
3. Verify useCart() hook is being imported
4. Check browser console for errors

### Problem: Dashboard shows 0 caution fees
**Solution:**
1. Verify orders exist with rental items
2. Check Order.cautionFee field has values in database
3. Verify analytics route is being called
4. Check API logs for aggregation results

### Problem: Caution fee calculation is wrong
**Solution:**
1. Verify calculation: price × quantity × 0.5 (NOT × days)
2. Check that only rental items (mode='rent') are included
3. Confirm sales items are excluded
4. Test with utility function: calculateCautionFeeAmount()

### Problem: Sales order has caution fee
**Solution:**
1. Check order API validation (line 64-68 in orders/route.ts)
2. Ensure order type is correctly identified
3. Verify calculateCautionFeeAmount() returns 0 for sales items

---

## 🚀 NEXT ACTIONS

### If starting implementation:
1. Read [CAUTION_FEE_PROPAGATION_GUIDE.md](CAUTION_FEE_PROPAGATION_GUIDE.md)
2. Pick one page from Section 2 (Customer pages)
3. Copy code template
4. Adapt to your structure
5. Test with sample order

### If expanding to new page:
1. Decide which section applies (customer vs admin)
2. Find code example in propagation guide
3. Import needed utilities:
   ```typescript
   import Order from '@/lib/models/Order';
   import { formatCurrency } from '@/lib/utils/format';
   ```
4. Add caution fee display section
5. Test with orders that have rental items

### If building admin feature:
1. Reference Section 3 or 4 of propagation guide
2. Import CautionFeeTransaction model if needed
3. Add action buttons for refund/deduction
4. Connect to backend endpoint
5. Show refund status updates

---

## 📞 COMMON QUESTIONS

**Q: Do all rental orders have caution fees?**  
A: Yes. If order has rental items (mode='rent'), caution fee is automatically charged.

**Q: Can sales items have caution fees?**  
A: No. System prevents it (validation in order API).

**Q: Can caution fee be 0?**  
A: No. If rental items exist, fee = 50% of their subtotal. If no rentals, field is omitted.

**Q: How is it refunded?**  
A: Create CautionFeeTransaction record with status='refunded'. Can be automated or manual.

**Q: Where's the money kept?**  
A: In company's bank account. Shows as liability in accounting (pending return).

**Q: Can I see trends?**  
A: Yes. Finance reports show monthly/yearly data (to be implemented).

---

## 📋 STATUS MEANINGS

**pending_return** = Customer has items, awaiting return  
**refunded** = Items returned, full refund processed  
**partially_refunded** = Items damaged, partial refund given  
**forfeited** = Items lost, fee kept by company

---

## 🎯 QUICK COPY-PASTE SNIPPETS

### Show caution fee with icon
```tsx
{cautionFee > 0 && (
  <div className="text-purple-900 font-semibold">
    🔒 Caution Fee: ₦{Math.round(cautionFee).toLocaleString()}
  </div>
)}
```

### Status badge
```tsx
const statusColors = {
  pending_return: 'bg-yellow-100 text-yellow-900',
  refunded: 'bg-green-100 text-green-900',
  partially_refunded: 'bg-orange-100 text-orange-900',
  forfeited: 'bg-red-100 text-red-900'
};

<span className={`px-3 py-1 rounded-full text-sm ${statusColors[status]}`}>
  {status}
</span>
```

### Info box
```tsx
<div className="bg-purple-50 border border-purple-200 p-4 rounded">
  <p className="font-semibold text-purple-900 mb-2">🔒 Caution Fee</p>
  <p className="text-sm text-gray-700">
    This refundable deposit ensures items are returned in good condition.
    You'll get a full refund within 7-10 business days.
  </p>
</div>
```

---

## ✨ PRO TIPS

1. **Always filter for rental items:** `items.filter(i => i.mode === 'rent')`
2. **Use utility function:** `calculateCautionFeeAmount()` instead of calculating manually
3. **Round for display:** `Math.round(cautionFee)` before showing
4. **Format currency:** `formatCurrency(amount)` for consistency
5. **Show icon:** 🔒 for caution fee universally recognized

---

**Last Updated:** 2024  
**System Status:** ✅ FULLY OPERATIONAL  
**Questions?** Refer to full documentation files
