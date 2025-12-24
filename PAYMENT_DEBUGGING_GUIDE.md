# 🔍 Payment Flow Debugging Guide

## Issue
Still seeing "Processing..." spinner and staying on checkout page after Paystack payment.

## Debug Steps

### Step 1: Open Browser Console
1. Open your browser (Chrome, Firefox, etc.)
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Look for messages starting with `[Checkout]`

### Step 2: Attempt Payment & Check Console

**What should happen:**

#### Before clicking payment button:
```
[Checkout] Auto-create order...
[Checkout] ✅ Order auto-created: {orderId}
[Checkout] ✅ Cart cleared after order creation
```

#### After clicking "Proceed to Payment":
```
[Checkout] 💳 Initializing Paystack payment...
[Checkout] Opening Paystack modal with config: {...}
```

#### After completing Paystack payment:
```
[Checkout] ❌ User closed payment modal without paying
  OR
[Checkout] ✅ Paystack payment successful - response: {reference: "orderId", ...}
[Checkout] Reference from Paystack: orderId
[Checkout] 🔄 Redirecting to /checkout?reference=orderId
```

Then page should reload automatically.

#### After page reload (this is where the issue might be):
```
[Checkout] 🔗 Paystack redirect detected with reference: orderId
[Checkout] 📡 Calling /api/verify-payment with reference: orderId
[Checkout] Verify response status: 200
[Checkout] Verify response data: {success: true, ...}
[Checkout] ✅ Payment verified successfully
[Checkout] 🚪 Opening delivery method modal
[Checkout] Verification complete, setting verifyingPayment to false
```

### Step 3: Identify Where It Stops

**If you see this and nothing after:**
```
[Checkout] Opening Paystack modal with config: {...}
```
→ **Problem:** Paystack modal might not be opening or `onSuccess` callback not firing
- Check: Is PaystackPop available? In console, type: `window.PaystackPop` and press Enter
- Should return: `function` or `object`, NOT `undefined`

**If you see:**
```
[Checkout] ❌ User closed payment modal without paying
```
→ You closed the modal instead of paying, click "Proceed to Payment" again and complete payment

**If page reloads but you don't see redirect messages:**
```
[Checkout] 🔗 Paystack redirect detected with reference:
```
→ **Problem:** Reference parameter not in URL after redirect
- Check URL in address bar: Should be `/checkout?reference=...`
- If not, the redirect from Paystack didn't work

**If you see verification logs but no modal:**
```
[Checkout] ✅ Payment verified successfully
[Checkout] 🚪 Opening delivery method modal
```
But Delivery Method Modal doesn't appear
→ **Problem:** Modal component not rendering
- The modal should open as a fixed overlay on top of everything

### Step 4: Check Network Requests

In Developer Tools, click **Network** tab and look for:

1. **POST /api/initialize-payment**
   - Should return: `{success: true, authorization_url: "..."}`
   - Status: **200 OK**

2. **GET /api/verify-payment?reference=...**
   - Should return: `{success: true, ...}`
   - Status: **200 OK**
   - If fails: Check order exists in database

### Step 5: Check Browser Resources

In Developer Tools, go to **Application** → **LocalStorage** → Look for:
- `empi_shipping_option` - Should exist

In **Cookies** - Check if Paystack sets any cookies

### Step 6: Check for JavaScript Errors

In console, look for any **red error messages**:
- `Uncaught` errors
- `TypeError` messages
- `Failed to fetch` errors

These would indicate why the payment flow is broken.

## Common Issues & Solutions

### ❌ "PaystackPop is not defined"
**Cause:** Paystack script not loaded
**Solution:**
1. Check `/app/layout.tsx` has `<script src="https://js.paystack.co/v1/inline.js"></script>`
2. Refresh the page
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try again

### ❌ "Cannot read property 'setup' of undefined"
**Cause:** Same as above - Paystack script not loaded
**Solution:** Same as above

### ❌ Modal doesn't show even though logs say it's opening
**Cause:** CSS z-index issue or modal not rendering
**Solution:**
1. In console, type: `document.querySelector('[class*="z-[9999]"]')` 
2. Should return the modal element
3. If nothing returned, modal isn't rendering

### ❌ Verification fails with "Order not found"
**Cause:** Order ID in Paystack doesn't match order in database
**Solution:**
1. Check database: Do you have an order with the reference ID?
2. The reference should match `createdOrderId`
3. In console, look for the ID being used

### ❌ Page keeps showing "Verifying your payment..." forever
**Cause:** `/api/verify-payment` is hanging or Paystack API unreachable
**Solution:**
1. Check network tab: Is `/api/verify-payment` request completing?
2. Check response: What status code? (200, 404, 500, etc.)
3. If failing: Check `PAYSTACK_SECRET_KEY` is correct in `.env.local`

## Quick Test Checklist

- [ ] F12 → Console open
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] See "Auto-create order" logs
- [ ] Click "Proceed to Payment"
- [ ] See "Initializing Paystack" logs
- [ ] Paystack modal appears
- [ ] Use test card: 4084084084084081
- [ ] Any expiry date (e.g., 12/30)
- [ ] Any CVV (e.g., 123)
- [ ] Click "Pay"
- [ ] See "✅ Paystack payment successful" in console
- [ ] Page redirects (URL changes to /checkout?reference=...)
- [ ] See "Verifying your payment..." spinner
- [ ] See "✅ Payment verified" in console
- [ ] Delivery Method Modal appears
- [ ] Select delivery method
- [ ] If EMPI: Fill delivery form and submit
- [ ] Success modal appears

## What to Share When Reporting Issue

If the flow still doesn't work, share:

1. **Console logs** (copy-paste the relevant `[Checkout]` messages)
2. **Network error** (if `/api/verify-payment` fails, show the response)
3. **Error message** displayed on page
4. **Browser & OS** you're using
5. **What happened exactly** (e.g., "modal didn't open", "page reloaded twice", etc.)

## Test Environment Settings

Make sure `.env.local` has:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PAYSTACK_KEY=pk_test_...  (must start with pk_test_)
PAYSTACK_SECRET_KEY=sk_test_...       (must start with sk_test_)
```

If using different keys, payment won't work.

## Advanced: Manual API Test

To test if APIs work independently:

**Test initialize-payment:**
```bash
curl -X POST http://localhost:3000/api/initialize-payment \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 9817500,
    "reference": "test-order-123",
    "firstname": "John",
    "lastname": "Doe",
    "phone": "08012345678"
  }'
```

Should return with `authorization_url`

**Test verify-payment** (after getting reference from above):
```bash
curl http://localhost:3000/api/verify-payment?reference=test-order-123
```

Should return `{success: true}` or error if order not found

---

**Next Steps:**
1. Check console following the steps above
2. Share what logs you see (or don't see)
3. Let me know where the flow stops
4. I'll fix that specific part
