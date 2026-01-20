# BULK DISCOUNT TESTING - QUICK REFERENCE

## Quick Test Cases

### Test 1: Create Quote with 5 Items (5% Discount)
1. Go to Admin Dashboard → Pending Orders
2. Click on a custom order
3. In Quote Builder, add items with total quantity = 5
4. System shows:
   - Subtotal: ₦X
   - Discount (5%): -₦X×5%
   - VAT: ₦(X×95%)×7.5%
   - Total: ₦Y
5. Click "Send Quote"
6. ✅ Quote saved with discount

### Test 2: Change Items to Trigger Different Tier
1. In same order, add 1 more item (total qty = 6)
2. System recalculates:
   - Discount changes from 5% to 7%
   - All amounts update automatically
3. ✅ Discount tier updates on quantity change

### Test 3: Verify Discount in Checkout
1. Go to Checkout
2. Load custom order quote
3. Verify pricing shows:
   - **🎁 Bulk Discount (5%) -₦X,XXX** (with green background)
   - Tax calculated on discounted subtotal
4. ✅ Discount displayed correctly

### Test 4: Verify Discount in Payment
1. Process payment for custom order
2. After payment verified, check:
   - Email received with invoice
   - Invoice shows: **🎉 Bulk Discount (5%) -₦X,XXX**
3. ✅ Discount on invoice

---

## All Discount Tiers

| Qty | Discount | Example Payment |
|-----|----------|-----------------|
| 1 | 0% | ₦10,750 |
| 2 | 0% | ₦21,500 |
| 3 | 5% | ₦30,363 |
| 4 | 5% | ₦40,450 |
| 5 | 5% | ₦50,538 |
| 6 | 7% | ₦59,175 |
| 7 | 7% | ₦69,038 |
| 8 | 7% | ₦78,900 |
| 9 | 7% | ₦88,763 |
| 10 | 10% | ₦96,750 |

---

## Where to See Discount

### Admin Creating Quote
- Quote Builder section → Pricing Summary
- "Discount (X%)": -₦X,XXX

### Admin After Sending Quote  
- PAYMENT VERIFIED section → Blue badge
- 🎁 Bulk Discount Applied: X% (-₦X,XXX)

### Customer in Checkout
- Pricing breakdown section
- 🎁 Bulk Discount (X%) -₦X,XXX (green background)

### Customer Invoice (Email)
- Invoice HTML
- 🎉 Bulk Discount (X%) -₦X,XXX (green styling)

---

## Verification Checklist

```
QUOTE CREATION:
☐ Add items with 5+ quantity
☐ Discount % shows in pricing summary
☐ Discount amount calculated correctly
☐ VAT calculated on discounted subtotal

QUOTE SENDING:
☐ Click "Send Quote"
☐ API receives discount fields
☐ Database saved (check with /api/orders/unified/[id])
☐ Customer receives message with quoted price

CHECKOUT:
☐ Custom quote loads
☐ Discount shows with emoji and %
☐ Final total matches quote
☐ All pricing correct

PAYMENT:
☐ Customer pays final total
☐ Paystack shows correct amount
☐ Order status updates

INVOICE:
☐ Email received
☐ Invoice shows discount
☐ Invoice total matches payment
☐ All amounts match throughout
```

---

## Troubleshooting

### Discount not showing in Quote Builder
- [ ] Check CustomOrderCard.tsx line 218-245
- [ ] Verify getDiscountPercentage imported
- [ ] Check VAT_RATE is 0.075

### Discount not sent with quote
- [ ] Verify PATCH payload includes discount fields (line 297-306)
- [ ] Check API request body in network tab
- [ ] Verify UnifiedOrder schema has fields

### Discount not in checkout
- [ ] Check customQuote loaded from sessionStorage
- [ ] Verify discount extracted (line 477-479)
- [ ] Check HTML shows discountPercentage > 0

### Discount not in invoice
- [ ] Check invoice creation includes bulkDiscountPercentage
- [ ] Verify professionalInvoice.ts supports it
- [ ] Check email HTML rendering

---

## Database Queries

### Check if Order Has Discount
```javascript
db.unifiedorders.findOne({
  orderNumber: "ORD-...",
  $or: [
    { discountPercentage: { $gt: 0 } },
    { discountAmount: { $gt: 0 } }
  ]
})
```

### Get Orders with Discounts
```javascript
db.unifiedorders.find({
  discountPercentage: { $gt: 0 }
}).count()
```

### Verify Discount Saved
```javascript
db.unifiedorders.findOne(
  { _id: ObjectId("...") },
  { discountPercentage: 1, discountAmount: 1, subtotalAfterDiscount: 1 }
)
```

---

## Expected Behavior Summary

### ✅ Should Work
- Admin creates quote with 5+ items
- System shows 5% discount automatically
- Quote sent with discount included
- Customer sees discount in checkout
- Invoice shows discount with emoji
- Multiple discount tiers work independently

### ⚠️ Edge Cases
- Qty 1-2: No discount (0%) - shows no discount line
- Multiple items: Discounts by TOTAL qty, not per item
- Tier changes: Immediate UI update when qty changes
- Payment: Amount includes discount (no separate charge)

### ❌ Should NOT Work (Normal)
- Discount can't be manually overridden by customer
- Discount not applied to shipping
- Discount not applied to caution fee
- Discount applies once per quote, not per item

---

## Performance Notes

- Quote calculation: Instant (O(n) items)
- Tier lookup: <1ms (O(1) max 4 iterations)
- Database save: Normal API speed
- Display: Instant update on item change
- No performance impact observed

---

## FAQ

**Q: Can admin change the discount?**
A: No - discount is auto-calculated by quantity tier. Admin could override via direct DB if needed.

**Q: Does discount apply to shipping?**
A: No - only to items subtotal.

**Q: Does discount apply to caution fee?**
A: No - only to items subtotal.

**Q: What if customer changes quantity at checkout?**
A: Checkout uses database quote - quantity locked once sent.

**Q: Can we combine discount + coupon code?**
A: Not yet - enhancement for future.

**Q: Are old orders affected?**
A: No - discount fields default to 0% (no discount).

---

## Support Info

All discount-related code:
- Admin calculation: `/app/admin/dashboard/components/CustomOrderCard.tsx`
- Database: `/lib/models/UnifiedOrder.ts`
- Checkout: `/app/checkout/page.tsx`
- Invoice: `/app/api/verify-payment/unified/route.ts`
- Tiers: `/lib/discountCalculator.ts`

---
