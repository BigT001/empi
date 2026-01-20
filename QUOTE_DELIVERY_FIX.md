# Quote Delivery Fix - Complete Documentation

## Problem Statement

Admin quotes were not being delivered to customers. The quote data was being saved to the order correctly, but the customer notification message was failing with:

```
"Order not found with orderId: 696e9255c5b346eb672e34c6 or orderNumber: ORD-1768854101596-493"
```

## Root Cause Analysis

The system has **TWO different order model systems** that were not communicating:

### Legacy System
- Models: `CustomOrder`, `Order`
- Used by: Direct API calls, legacy endpoints
- Example: `/api/custom-orders`, `/api/orders`

### New Unified System
- Model: `UnifiedOrder`
- Used by: `/api/orders/unified` endpoints
- Purpose: Single source of truth for both custom and regular orders

### The Breakdown

When admin sends a quote via `CustomOrderCard`:

1. **Step 1: Save Quote** ✅
   ```
   PATCH /api/orders/unified/{orderId}
   → Uses UnifiedOrder model
   → Successfully finds and updates order
   → Saves: quoteItems, quotedPrice
   ```

2. **Step 2: Send Notification** ❌
   ```
   POST /api/messages
   → Was checking ONLY CustomOrder and Order
   → Could NOT find order in UnifiedOrder
   → Returned 404 error
   ```

## Solution Implemented

### File Modified
`app/api/messages/route.ts`

### Changes Made

#### 1. Added UnifiedOrder Import
```typescript
import UnifiedOrder from '@/lib/models/UnifiedOrder';
```

#### 2. Updated POST /api/messages Order Lookup

**When looking up by orderNumber:**
```typescript
// Before: Checked only CustomOrder, then Order
let order = await CustomOrder.findOne({ orderNumber });
if (!order) {
  order = await Order.findOne({ orderNumber });
}

// After: Check UnifiedOrder FIRST
let order = await UnifiedOrder.findOne({ orderNumber });
if (!order) {
  order = await CustomOrder.findOne({ orderNumber });
  if (!order) {
    order = await Order.findOne({ orderNumber });
  }
}
```

**When looking up by orderId:**
```typescript
// Before: Checked only CustomOrder, then Order
order = await CustomOrder.findById(orderId);
if (!order) {
  order = await Order.findById(orderId);
}

// After: Check UnifiedOrder FIRST
order = await UnifiedOrder.findById(orderId);
if (!order) {
  order = await CustomOrder.findById(orderId);
  if (!order) {
    order = await Order.findById(orderId);
  }
}
```

**In alternate lookup strategies:**
```typescript
// Updated to include UnifiedOrder
let altOrder = await UnifiedOrder.findOne({ _id: orderId });
if (!altOrder) {
  altOrder = await CustomOrder.findOne({ _id: orderId });
}
if (!altOrder) {
  altOrder = await Order.findOne({ _id: orderId });
}
```

**In orderNumber fallback:**
```typescript
// Updated to include UnifiedOrder
let orderByNumber = await UnifiedOrder.findOne({ orderNumber });
if (!orderByNumber) {
  orderByNumber = await CustomOrder.findOne({ orderNumber });
  if (!orderByNumber) {
    orderByNumber = await Order.findOne({ orderNumber });
  }
}
```

#### 3. Updated GET /api/messages Order Lookup

For fetching messages and checking handoff details:
```typescript
// Before: Checked only CustomOrder
let order = await CustomOrder.findOne(query).lean();

// After: Check UnifiedOrder FIRST
let order = await UnifiedOrder.findOne(query).lean();
if (!order) {
  order = await CustomOrder.findOne(query).lean();
}
```

## How It Works Now

### Quote Delivery Flow (Complete)

```
Admin sends quote
  ↓
CustomOrderCard.handleSendQuote()
  ├─ Step 1: PATCH /api/orders/unified/{orderId}
  │   └─ Saves: quoteItems, quotedPrice to UnifiedOrder ✅
  │
  └─ Step 2: POST /api/messages
      └─ Messages API now finds order in UnifiedOrder ✅
         └─ Creates message notification
            └─ Customer receives quote in UI ✅
```

### Lookup Priority Order

The messages API now uses this priority when looking up orders:

1. **UnifiedOrder** (new system - priority)
2. **CustomOrder** (legacy system)
3. **Order** (regular orders)

This ensures both old and new order data are accessible.

## Testing

### Test Script
A test script has been provided: `test-quote-message.js`

**Run with:**
```bash
node test-quote-message.js
```

**What it does:**
1. Fetches a custom order from database
2. Sends a test quote message via `/api/messages`
3. Verifies the message was created and retrieved

**Expected output:**
```
✅ Found 2 custom orders
✅ Message sent successfully!
   Message ID: [mongo-id]
   Quote: ₦50000

✅ Retrieved 1 messages for this order
   Quote messages: 1
✅ Quote message test PASSED!
```

## Validation

- ✅ No TypeScript/compilation errors
- ✅ Messages API successfully finds orders in UnifiedOrder
- ✅ Quote messages are created and stored in database
- ✅ Customers can retrieve quotes via GET /api/messages
- ✅ Backward compatibility maintained (still works with CustomOrder and Order)

## Impact

### What's Fixed
- ✅ Admin quotes now reach customers
- ✅ Message notifications are created successfully
- ✅ Customers see "Quote Received!" status
- ✅ Quote items visible in customer chat

### What Remains Unchanged
- Quote saving logic (still works)
- Message schema and structure
- Customer-side polling and UI
- Admin quote creation form

## Migration Path

The system now works with:
1. **New orders**: Created via `/api/orders/unified` → stored in `UnifiedOrder`
2. **Legacy orders**: Using `CustomOrder` directly (still work)
3. **Regular orders**: Using `Order` model (still work)

All three types can now receive message notifications properly.

## Future Considerations

As the codebase transitions fully to `UnifiedOrder`, the `CustomOrder` and `Order` lookups in the messages API can be kept as fallbacks for backward compatibility, or eventually removed once all data is migrated.

Currently recommended: Keep all three for maximum compatibility.

## Files Changed

- `app/api/messages/route.ts` - Added UnifiedOrder lookup to both GET and POST handlers

## Deployment Notes

No database migrations required. The fix is backward compatible and doesn't modify any data structures.
