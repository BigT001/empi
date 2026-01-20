# Debug Guide: Complete Quote Delivery Flow

## What to check in Browser Console when Admin sends a quote:

### PHASE 1: Admin sends quote (via Admin Dashboard)
Look for logs from `app/admin/dashboard/components/CustomOrderCard.tsx`:
```
[CustomOrderCard] 📊 Quote Details Being Sent:
  ├─ orderId: 696f0efd71c8ff6ad366fe94
  ├─ quotedPrice: 26875
  ├─ quoteItemsCount: 1
  └─ Full Payload: {quoteItems: Array(1), quotedPrice: 26875}

[CustomOrderCard] ✅ PATCH response status: 200
[CustomOrderCard] API Response Order: {quotedPrice: 26875, quoteItemsCount: 1}
```

**Expected**: Admin should see the quote was sent (status 200) and the response should contain `quotedPrice`.

---

### PHASE 2: API saves quote to database
Look for logs from `/app/api/orders/unified/[id]/route.ts` (PATCH endpoint):
```
[Unified Orders API] PATCH /api/orders/unified/[id] called:
  id: 696f0efd71c8ff6ad366fe94
  quotedPrice: 26875
  quoteItemsCount: 1

[Unified Orders API] ✅ PATCH - Order updated, checking saved data:
  ├─ Saved quotedPrice: 26875
  ├─ Saved quoteItems count: 1
  ├─ Saved quoteItems: [...]
  └─ ALL order fields: [...]

[Unified Orders API] ✅ Returning to admin with: {
  quotedPrice: 26875,
  quoteItemsCount: 1,
  quoteItems: [...]
}
```

**Expected**: The quote should be saved to the database with all fields preserved.

---

### PHASE 3: User Dashboard fetches fresh data
Look for logs from `/app/dashboard/page.tsx`:
```
[Dashboard] 🔄 Fetching unified custom orders with: email=user@example.com&orderType=custom

[Dashboard] ✅ Fetched 1 custom orders

[Dashboard] Custom Order: ORD-1768886013270-7318
  requiredQuantity: 5
  quotedPrice: 26875                    ← CRITICAL: Should be 26875
  quoteItemsCount: 1                    ← CRITICAL: Should be > 0
  quoteItems: [...]
```

**Expected**: Dashboard should receive the quote from API with `quotedPrice` and `quoteItems`.

---

### PHASE 4: OrdersTab passes props to CustomOrderCard
Look for logs from `/app/dashboard/OrdersTab.tsx`:
```
[OrdersTab] Rendering custom order card:
  orderNumber: ORD-1768886013270-7318
  orderId: 696f0efd71c8ff6ad366fe94
  quotedPrice: 26875                    ← CRITICAL: Should be 26875
  quoteItemsCount: 1                    ← CRITICAL: Should be > 0
  hasQuoteData: true
```

**Expected**: OrdersTab should have the quote data and be passing it as props to the card.

---

### PHASE 5: CustomOrderCard receives and syncs props
Look for logs from `/app/dashboard/CustomOrderCard.tsx`:

**On Component Mount:**
```
[UserCustomOrderCard] Initialized with:
  orderId: 696f0efd71c8ff6ad366fe94
  quotedPriceFromProps: 26875           ← CRITICAL: Should be 26875
  quoteItemsFromProps: 1
```

**Prop Sync Effect:**
```
[UserCustomOrderCard] 🔄 Prop Sync - quotedPrice: 26875 quoteItems count: 1

[UserCustomOrderCard] 💰 Syncing quotedPrice prop to state: 26875
[UserCustomOrderCard] 📋 Syncing quoteItems prop to state: [...]
[UserCustomOrderCard] 🖼️ Syncing designUrls prop to state: 1 URLs

[UserCustomOrderCard] ✅ Quote received via props, stopping poll
```

**Expected**: Props should be synced to state. If this doesn't happen, quote won't display.

---

### PHASE 6: CustomOrderCard rendering
Look for logs from render method:
```
[UserCustomOrderCard] 🎨 RENDERING:
  orderNumber: ORD-1768886013270-7318
  orderId: 696f0efd71c8ff6ad366fe94
  hasQuote: true                        ← CRITICAL: Should be TRUE
  currentQuote: 26875                   ← CRITICAL: Should be 26875
  currentQuoteItems: 1
  isPolling: false
  currentDesignUrls: 1
```

**Expected**: `hasQuote` should be `true` and `currentQuote` should have the value.

---

## Debugging Steps:

### Step 1: Admin sends quote
1. Go to Admin Dashboard
2. Find a pending custom order
3. Send a quote (e.g., 26,875)
4. **Check logs**: Admin should see PATCH response with quotedPrice

**If failed**: Check if quote items are properly formatted

---

### Step 2: Check if saved in database
1. Open browser console on Admin dashboard
2. Look for `[Unified Orders API] ✅ PATCH - Order updated`
3. Check if `Saved quotedPrice: 26875` appears

**If failed**: Quote isn't being saved to database

---

### Step 3: Refresh User Dashboard
1. User should open `/dashboard`
2. Look for `[Dashboard] Custom Order: ORD-...` log
3. Check if `quotedPrice: 26875` is present

**If failed**: API isn't returning the quote data

---

### Step 4: Check OrdersTab
1. Look for `[OrdersTab] Rendering custom order card` log
2. Check if `quotedPrice: 26875` is shown

**If failed**: Dashboard got quote but didn't pass to child

---

### Step 5: Check CustomOrderCard state
1. Look for `[UserCustomOrderCard] 🔄 Prop Sync` log
2. Check if it says `💰 Syncing quotedPrice prop to state: 26875`
3. Look for `[UserCustomOrderCard] 🎨 RENDERING` log
4. Check if `hasQuote: true` and `currentQuote: 26875`

**If Step 5 fails**:
- Props aren't being synced
- State isn't being updated
- Component isn't re-rendering

---

## Common Issues and Solutions:

### Issue 1: Admin shows quote sent but it's not saved
**Logs to check**: 
- Admin: `API Response Order: {quotedPrice: undefined}`
- API: No "Saved quotedPrice" log

**Solution**: API `.lean()` call might not be working. Check that PATCH endpoint has `.lean()` on findByIdAndUpdate.

---

### Issue 2: Dashboard fetches but quote not returned
**Logs to check**:
- Dashboard: `quotedPrice: undefined`
- API GET: No `quotedPrice` in logging

**Solution**: Order in MongoDB doesn't have the quote. Either PATCH didn't save it, or GET isn't returning it.

---

### Issue 3: OrdersTab has quote, but card doesn't show it
**Logs to check**:
- OrdersTab: `quotedPrice: 26875, hasQuoteData: true`
- CustomOrderCard: `quotedPriceFromProps: undefined`

**Solution**: Props aren't being passed correctly. Check if OrdersTab is actually passing `quotedPrice={order.quotedPrice}`.

---

### Issue 4: Card receives props but doesn't update state
**Logs to check**:
- CustomOrderCard init: `quotedPriceFromProps: 26875`
- But: No "Syncing quotedPrice prop to state" log appears

**Solution**: Prop sync effect isn't running. Check if dependencies are correct: `[quotedPrice, quoteItems, designUrls]`.

---

### Issue 5: State has quote but doesn't render
**Logs to check**:
- RENDERING: `currentQuote: 26875, hasQuote: true`
- But: Still shows "WAITING FOR QUOTE" on screen

**Solution**: Component might not be re-rendering. Check if state update actually triggered a re-render.

---

## Quick Checklist:

When debugging, check these logs in order:

- [ ] Admin console: `API Response Order: {quotedPrice: 26875}`
- [ ] API logs: `Saved quotedPrice: 26875`
- [ ] Dashboard: `[Dashboard] Custom Order: ... quotedPrice: 26875`
- [ ] OrdersTab: `quotedPrice: 26875`
- [ ] CustomOrderCard init: `quotedPriceFromProps: 26875`
- [ ] Prop sync: `💰 Syncing quotedPrice prop to state: 26875`
- [ ] Render: `hasQuote: true, currentQuote: 26875`
- [ ] **UI shows Quote Received!** with amount

If all these pass but quote still doesn't show, it's a React rendering issue.

