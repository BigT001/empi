# Auto Status Update Fix - Custom Orders Move to Approved

## Problem Identified

The custom order status was not automatically moving from "pending" to "approved" after payment because:

1. **Orders API was not updating CustomOrder**: When a payment was completed, the `/api/orders` endpoint was creating a regular Order but NOT updating the original CustomOrder record status.

2. **Dashboard was not polling full order data**: The CustomOrdersPanel was polling `pollMessageCounts()` instead of `fetchOrders()`, so it wasn't getting updated status information even if it had been changed.

---

## Changes Made

### 1. **`/app/api/orders/route.ts`** - Added CustomOrder Import

**Before:**
```typescript
import Order from '@/lib/models/Order';
import Buyer from '@/lib/models/Buyer';
```

**After:**
```typescript
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import Buyer from '@/lib/models/Buyer';
```

### 2. **`/app/api/orders/route.ts`** - Added CustomOrder Status Update

**Location:** After order is saved (line ~104)

**Added Logic:**
```typescript
// If this is a custom order payment, update the custom order status to "approved"
if (body.isCustomOrder && body.customOrderId) {
  try {
    const customOrder = await CustomOrder.findByIdAndUpdate(
      body.customOrderId,
      { status: 'approved' },
      { new: true }
    );
    console.log('[Orders API] ✅ Custom order status updated to approved:', customOrder?.orderNumber);
  } catch (customOrderError) {
    console.error('[Orders API] ⚠️ Failed to update custom order status:', customOrderError);
    // Don't fail the whole process if custom order update fails
  }
}
```

**What it does:**
- Checks if the order being created is from a custom order quote (`body.isCustomOrder === true`)
- If yes, finds the original CustomOrder by ID and updates its status to "approved"
- Logs success or error without failing the order creation
- CustomOrder is updated before invoice generation

### 3. **`/app/admin/dashboard/CustomOrdersPanel.tsx`** - Fixed Polling

**Before:**
```typescript
const pollingInterval = setInterval(() => {
  if (!document.hidden) {
    console.log('[CustomOrdersPanel] Polling for message updates...');
    pollMessageCounts();  // ❌ Only polls message counts, not status changes
  }
}, 5000);
```

**After:**
```typescript
const pollingInterval = setInterval(() => {
  if (!document.hidden) {
    console.log('[CustomOrdersPanel] Polling for order updates...');
    fetchOrders();  // ✅ Fetches full order data including status
  }
}, 5000);
```

**What it does:**
- Changed polling to fetch FULL order data every 5 seconds
- Now includes status changes from the database
- Admin dashboard will reflect pending → approved transition immediately

---

## Complete Flow Now

```
1. Customer Completes Payment via Paystack
   ↓
2. Checkout Page Calls /api/orders (with isCustomOrder=true, customOrderId=<id>)
   ↓
3. Orders API:
   ├─ Creates regular Order record
   ├─ Updates CustomOrder status: pending → approved ✅ (NEW)
   └─ Generates invoice
   ↓
4. CustomOrdersPanel Polling (every 5 seconds):
   ├─ Calls fetchOrders() ✅ (CHANGED)
   ├─ Gets updated status from database
   └─ UI updates: card moves from pending to approved ✅
```

---

## Data Flow with Fix

### Before (Broken)
```
CustomOrder.status = "pending"
   ↓ (Customer pays)
Order created with status = "confirmed"
   ↓ (CustomOrder status NOT updated)
CustomOrder.status = "pending" ❌ (Still pending!)
   ↓
Dashboard polls but sees no change
   ↓
Admin still sees card in Pending tab ❌
```

### After (Fixed)
```
CustomOrder.status = "pending"
   ↓ (Customer pays)
Order created + CustomOrder status updated to "approved" ✅
   ↓
CustomOrder.status = "approved" ✅
   ↓
Dashboard polls every 5 seconds
   ↓
Admin sees card move to Approved tab ✅
```

---

## What Admin Sees Now

### Timeline:
1. **Before Payment**: Custom order in "Pending" tab
2. **Payment Made**: Customer completes Paystack payment
3. **Immediately After** (within 5 seconds):
   - Card moves to "Approved" tab automatically
   - Invoice is generated and available
   - Admin can start production

### No Manual Action Needed:
- ✅ Status update is automatic
- ✅ Dashboard refresh is automatic (polling)
- ✅ Invoice generation is automatic

---

## Polling Details

The dashboard now:
- Calls `fetchOrders()` every 5 seconds
- Only polls when the browser tab is visible (stops when tab is hidden)
- Updates the `orders` state in React
- Triggers UI re-render to show status changes
- Shows pending → approved transition immediately

**Polling Interval:** 5000ms (5 seconds)  
**Visibility Check:** Only polls if document is visible

---

## Code Safety

The custom order update:
- ✅ Does NOT fail order creation if it fails
- ✅ Wrapped in try-catch for error handling
- ✅ Logs success and errors for debugging
- ✅ Only runs if `isCustomOrder` and `customOrderId` are provided
- ✅ Uses safe Mongoose `findByIdAndUpdate()` method

---

## Testing Checklist

To verify the fix is working:

1. ✅ Create a custom order in chat
2. ✅ Admin sends quote
3. ✅ Customer clicks "Pay Now"
4. ✅ Customer completes Paystack payment
5. ✅ **Admin Dashboard Update** (watch for):
   - Card should move from "Pending" to "Approved" within 5 seconds
   - Invoice should be generated
   - Status badge should show "✓ Approved"

---

## Related Changes Previously Made

This fix complements the previous implementation:
- ✅ Verify-payment route generates invoice (done)
- ✅ Verify-payment route updates status via polling (now polling works properly)
- ✅ Orders API updates CustomOrder status (NEW - was missing)
- ✅ Dashboard polls for updates (FIXED - was polling wrong data)

---

## Files Modified

1. `/app/api/orders/route.ts`
   - Added CustomOrder import
   - Added custom order status update after order save

2. `/app/admin/dashboard/CustomOrdersPanel.tsx`
   - Changed polling from `pollMessageCounts()` to `fetchOrders()`

---

## Logging for Debugging

When a payment is completed, you'll see these logs in the console:

**Orders API:**
```
[Orders API] ✅ Custom order status updated to approved: ORD-1234567890
```

**Dashboard:**
```
[CustomOrdersPanel] Polling for order updates...
[CustomOrdersPanel] ðŸ"‹ Fetching orders...
```

If anything fails:
```
[Orders API] ⚠️ Failed to update custom order status: [error details]
```

---

## Why This Was Needed

The previous implementation only updated the status through the `verify-payment` API, which:
- Only ran when payment was verified
- Only worked for regular orders
- Didn't properly handle custom orders

Now the status is updated in TWO places:
1. **Orders API** - When order is created from custom quote (fixes custom orders)
2. **Verify-payment API** - When payment is verified (fixes regular orders)

This ensures BOTH custom and regular orders get their status updated.
