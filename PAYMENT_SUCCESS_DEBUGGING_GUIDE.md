# Payment Success Flow - Debugging & Testing Guide

## Current Implementation Status

### ✅ What's Implemented

1. **Checkout Page** (`/app/checkout/page.tsx`)
   - Professional gradient UI with billing and delivery info
   - Paystack payment handler configured
   - onSuccess callback that:
     - Saves order to `/api/orders`
     - Generates invoice to `/api/invoices` (NEWLY ADDED)
     - Clears localStorage
     - Redirects to `/order-confirmation?ref={reference}`

2. **Order API** (`/api/orders/route.ts`)
   - POST endpoint to save orders
   - GET endpoint to retrieve orders by reference

3. **Invoice API** (`/api/invoices/route.ts`)
   - POST endpoint to create invoices
   - GET endpoint to retrieve invoices

4. **Order Confirmation Page** (`/app/order-confirmation/page.tsx`)
   - Displays order details after payment
   - Fetches order by reference

## Issue: "Processing..." Button Stuck

When payment completes successfully, the "Processing..." button remains on screen instead of:
- ✅ Completing the redirect
- ✅ Showing order confirmation
- ✅ Displaying success message

## Root Causes (Potential)

### Cause 1: API Endpoint Failing (Most Likely)
- `/api/orders` POST might return error
- `/api/invoices` POST might be blocking the flow
- Network request might be timing out

### Cause 2: Redirect Not Working
- `router.push()` might not be executing
- Page might load but UI not updating
- Redirect happening but to wrong URL

### Cause 3: Paystack Reference Format
- Reference format might not match what's expected
- Could be missing or malformed

### Cause 4: localStorage.removeItem() Failing
- If delivery quote is stored incorrectly
- Could cause exception in onSuccess

## Step-by-Step Debugging

### Debug Session 1: Network Inspection

**Steps:**

1. Open Browser DevTools: `F12`
2. Go to `Network` tab
3. Fill checkout form completely:
   - Billing info (name, email, phone)
   - Delivery selection (state, location, vehicle type)
4. Click "Pay ₦268,541.50"
5. Paystack modal opens
6. Enter test card: `5399 8343 1234 5678`
7. Expiry: `12/25` (or any future date)
8. CVV: `123` (or any 3 digits)
9. OTP: `123456`
10. Click "Pay"

**Expected Results:**

After payment, you should see in Network tab:
- ✅ POST `/api/orders` → Status 201 or 200
- ✅ POST `/api/invoices` → Status 201 or 200
- ✅ Page navigation to `/order-confirmation?ref=...`

**If API Calls Show Errors:**

- Click on the failed request
- Go to `Response` tab
- Check the error message
- Screenshot the error and share

### Debug Session 2: Console Inspection

**Steps:**

1. Open Browser DevTools: `F12`
2. Go to `Console` tab
3. Complete payment (same as Debug Session 1)
4. Watch console for messages

**Expected Console Messages:**

```
✅ Invoice generated: INV-EMPI-1234567890-abc123
✅ Order saved successfully
[Navigation to /order-confirmation]
```

**If You See Errors:**

- Screenshot the error
- Common errors:
  - `TypeError: Cannot read property 'reference' of undefined`
  - `Failed to fetch /api/orders`
  - `JSON.stringify() error`

### Debug Session 3: Response Structure

If POST `/api/orders` is returning an error, check what's being sent.

**To See Request Body:**

1. Network tab → POST `/api/orders` request
2. Click `Request` tab
3. Scroll down to `Request Payload`
4. Verify it includes:
   ```json
   {
     "reference": "EMPI-1234567890-abc123",
     "customer": {
       "name": "Full Name",
       "email": "email@example.com",
       "phone": "+2349012345678"
     },
     "items": [...],
     "shipping": {...},
     "pricing": {...},
     "status": "completed",
     "createdAt": "2024-01-..."
   }
   ```

## Quick Test: API Endpoints Directly

### Test 1: Create Order via API

Using Postman or curl:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST-12345",
    "customer": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "09012345678"
    },
    "items": [
      {
        "name": "Test Product",
        "quantity": 1,
        "price": 1000,
        "mode": "buy"
      }
    ],
    "shipping": {
      "option": "pickup",
      "cost": 0
    },
    "pricing": {
      "subtotal": 1000,
      "tax": 75,
      "shipping": 0,
      "total": 1075
    },
    "status": "completed",
    "createdAt": "2024-01-15T10:00:00Z"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Order saved successfully",
  "orderId": "507f1f77bcf86cd799439011"
}
```

### Test 2: Create Invoice via API

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-TEST-12345",
    "orderNumber": "TEST-12345",
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "09012345678",
    "subtotal": 1000,
    "shippingCost": 0,
    "taxAmount": 75,
    "totalAmount": 1075,
    "items": [
      {
        "name": "Test Product",
        "quantity": 1,
        "price": 1000,
        "mode": "buy"
      }
    ],
    "type": "automatic",
    "status": "paid"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Invoice saved successfully",
  "invoiceNumber": "INV-TEST-12345",
  "invoice": {...}
}
```

### Test 3: Retrieve Order

```bash
curl http://localhost:3000/api/orders?ref=TEST-12345
```

Should return:
```json
{
  "order": {...},
  "message": "Order retrieved successfully"
}
```

## If APIs Work But Payment Flow Still Stuck

### Check 1: MongoDB Connection

Verify MongoDB is running:

```bash
# Check if MongoDB is running
mongosh --version

# Or try to connect
mongosh
```

In MongoDB shell:
```javascript
// Check if orders collection exists
db.orders.countDocuments()

// Check if invoices collection exists
db.invoices.countDocuments()

// View latest order
db.orders.find().sort({_id: -1}).limit(1)

// View latest invoice
db.invoices.find().sort({_id: -1}).limit(1)
```

### Check 2: Environment Variables

Verify `.env.local` has correct Paystack key:

```bash
# Show env vars
cat .env.local

# Should show:
# NEXT_PUBLIC_PAYSTACK_KEY=pk_test_xxxxx (NOT pk_live)
# PAYSTACK_SECRET_KEY=sk_test_xxxxx (NOT sk_live)
```

### Check 3: Next.js App Compilation

Check if there are any build errors:

```bash
npm run build
```

Should complete without errors.

## Solution Template: If API Endpoints Fail

If `/api/orders` or `/api/invoices` endpoints return errors, here's how to fix:

### For Orders API:

Check `/api/orders/route.ts`:
- Verify MongoDB connection works
- Verify Order model schema matches data
- Check field names match exactly
- Add console.log for debugging

### For Invoices API:

Check `/api/invoices/route.ts`:
- Verify Invoice model exists
- Verify all required fields are present
- Check for validation errors
- Add console.log for debugging

## Expected Success Flow (After Fix)

```
1. User fills checkout form
2. Clicks "Pay ₦268,541.50"
3. Paystack modal opens
4. User enters test card details
5. Paystack processes payment
6. onSuccess callback fires
   ├─ POST /api/orders (201 response)
   ├─ POST /api/invoices (201 response)
   ├─ Clear localStorage
   └─ router.push('/order-confirmation?ref=...')
7. Page redirects to /order-confirmation
8. Order details display
9. User sees "Order Confirmed!" message
10. Can download invoice or continue shopping
```

## Next Steps

### Option 1: Test Payment Flow

1. Follow "Debug Session 1" above
2. Screenshot network requests
3. Share what you see
4. I'll help fix issues

### Option 2: Verify APIs Work

1. Follow "Quick Test" section above
2. Try creating orders/invoices via curl
3. Confirm they save to MongoDB
4. Then retry payment flow

### Option 3: Check Logs

1. Open terminal where Next.js is running
2. Run payment flow
3. Check console output
4. Share any error messages

## Files Ready for Testing

| File | Status | Purpose |
|------|--------|---------|
| `/app/checkout/page.tsx` | ✅ Ready | Payment form with updated onSuccess |
| `/api/orders/route.ts` | ✅ Ready | Order save endpoint |
| `/api/invoices/route.ts` | ✅ Ready | Invoice creation endpoint |
| `/app/order-confirmation/page.tsx` | ✅ Ready | Success page |
| `/lib/models/Order.ts` | ✅ Ready | Order schema |
| `/lib/models/Invoice.ts` | ✅ Ready | Invoice schema |
| `.env.local` | ✅ Ready | Test keys configured |

## What's Next After Payment Works

1. **Success Modal** - Create modal component instead of redirect
2. **Dashboard** - Build user dashboard to view orders/invoices
3. **Invoice PDF** - Add PDF generation for download
4. **Email** - Send order confirmation email
5. **Webhooks** - Listen for Paystack webhooks

---

**Status: Ready for Testing** ✅

All code is in place. Now we need to test and debug the payment flow to see where it's getting stuck.
