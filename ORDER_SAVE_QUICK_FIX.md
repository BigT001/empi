# ❌ "Order save failed" - Quick Troubleshooting Guide

## What Happened
Payment was successful in Paystack, but the order couldn't be saved to the database.

## Why It Happens

### Most Common Causes (in order):

1. **Missing Customer Information**
   - Empty name, email, or phone
   - Incomplete form submission
   - **Fix:** Check console logs show all customer details before saving

2. **Empty Cart**
   - No items in cart
   - Items cleared before payment
   - **Fix:** Ensure items array has at least 1 item with name, quantity, price

3. **Database Connection Failed**
   - MongoDB not accessible
   - Network timeout
   - Authentication failed
   - **Fix:** Check MongoDB connection in server logs

4. **Duplicate Order Number**
   - Same Paystack reference used twice
   - Concurrent payment attempts
   - **Fix:** Check orders collection for duplicate orderNumbers

5. **Invoice Generation Failed**
   - Email service down
   - Email configuration error
   - Malformed order data
   - **Fix:** Check server logs for invoice error details

## How to Debug Now (Enhanced Logging)

### Step 1: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for logs starting with "💾 Saving order..."
4. **If you see error:** Check "Error details" - it will show specific error

Example output:
```
✅ Payment success handler called
Reference: paystackref_xyz123
💾 Saving order...
Order data: {
  reference: "paystackref_xyz123",
  customer: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+234901234567"
  },
  items: [
    { id: "prod_1", name: "Costume", price: 5000, quantity: 1, mode: "buy" }
  ],
  pricing: { subtotal: 5000, tax: 375, shipping: 2500, total: 7875 },
  status: "confirmed"
}
❌ Order save failed with status: 400
Error details: {
  "error": "firstName is required",
  "details": "firstName is required"
}
```

### Step 2: Check Server Console/Logs
Look for detailed error messages:

**Validation Error:**
```
❌ Order validation error: [validation error details]
error: "Order validation failed"
details: "firstName is required"
```

**Invoice Error:**
```
[Orders API] Invoice generation failed: [error message]
[Orders API] Invoice error details: Service error
```

**Database Error:**
```
❌ Error creating order: [database error]
Error stack: [full stack trace]
```

## Quick Fixes

### If Customer Data is Empty
```javascript
// In checkout page
const orderData = {
  customer: {
    name: buyer?.fullName,      // Make sure buyer is defined
    email: buyer?.email,         // Not empty string
    phone: buyer?.phone,
  },
  items: items,                  // Must have at least 1 item
  ...
};
```

### If Items are Empty
```javascript
// Verify cart has items before payment
if (!items || items.length === 0) {
  alert("Please add items to cart");
  return;
}
```

### If Getting Duplicate Error
```javascript
// Check if same payment being processed twice
// Look for duplicate POST /api/orders requests
// Check console for multiple "Payment success handler called" logs
```

## What's New (Enhanced Debugging)

✅ **Better Error Messages** - Shows exactly what went wrong
✅ **Detailed Logging** - Full order data logged before save
✅ **Order Validation** - Catches errors before database attempt
✅ **Invoice Error Details** - Shows if email/invoice generation failed
✅ **Status Codes** - Returns proper HTTP status with error type

## If Problem Persists

### Provide This Information:
1. **Full console error** from browser (copy entire error object)
2. **Server logs** around the time of failure
3. **Order data** that was being saved (in console logs)
4. **Steps to reproduce** what you did

### Check These Files:
- `/app/checkout/page.tsx` - Payment handler (lines 35-90)
- `/app/api/orders/route.ts` - Order creation API (lines 1-200)
- `/lib/createInvoiceFromOrder.ts` - Invoice generation (lines 1-230)

### Run These Tests:
```javascript
// Test 1: Verify buyer context has data
console.log("Buyer data:", buyer);

// Test 2: Verify cart items structure
console.log("Cart items:", items);
items.forEach(item => {
  console.log({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    mode: item.mode
  });
});

// Test 3: Verify order data structure
console.log("Order data structure:", {
  reference: "value",
  customer: { name, email, phone },
  items: "array",
  pricing: { subtotal, tax, shipping, total },
  status: "confirmed"
});
```

## Common Validation Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `firstName is required` | Name not provided | Ensure buyer.fullName is not empty |
| `email is required` | Email not provided | Ensure buyer.email is not empty |
| `items is required` | Cart empty | Add items before checkout |
| `E11000 duplicate key` | Order number exists | Paystack ref already used, clear cache |
| `Failed to parse JSON` | Malformed data | Check JSON stringification |
| `Connection timeout` | Database unavailable | Check MongoDB connection |

## Success Indicators

✅ **Order Saved Successfully**
- Console shows: "✅ Order saved"
- Invoice number logged: "Invoice generated: INV-..."
- Success modal appears: "Payment Successful"

❌ **Order Failed to Save**
- Console shows: "❌ Order save failed with status: [code]"
- Error details object displayed
- Success modal does NOT appear
- User sees error message

---

**Remember:** The enhanced logging will now tell you exactly what went wrong!  
Check your browser console first - it has all the answers.

**Status:** Active Debugging Enabled ✅
