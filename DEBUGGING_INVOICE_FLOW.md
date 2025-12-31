# 🔍 Invoice Generation - Comprehensive Debugging Guide

## Comprehensive Logging Added
Logging has been added at every step of the invoice flow. This guide will help you identify exactly where the problem is.

---

## Step 1: Make a Test Payment and Monitor Logs

### In Browser (F12 Console):
```
[Dashboard] ========== FETCHING INVOICES ==========
[Dashboard] buyer.email: chisom@gmail.com
[Dashboard] buyer.id: NOT SET (guest)
[Dashboard] Using guest fetch: /api/invoices?email=chisom%40gmail.com
[Dashboard] 📡 Calling API: /api/invoices?email=chisom%40gmail.com
```

**Check:** Does it show "Using guest fetch" or "Using logged-in user fetch"?

### In Server Logs:
Look for these sections in order:

#### 1️⃣ VERIFY-PAYMENT CREATES INVOICE
```
========== PAYMENT VERIFICATION START ==========
[verify-payment] 📋 Reference: ref_1234567890
[verify-payment] ✅✅✅ PAYMENT VERIFIED AS SUCCESSFUL!
[verify-payment] 📝 Invoice Details:
[verify-payment]   - orderNumber: ref_1234567890
[verify-payment]   - customerEmail: chisom@gmail.com
[verify-payment]   - paymentVerified: true
[verify-payment]   - type: automatic
[verify-payment] ✅ Invoice created: INV-1234567890-ABC123
[verify-payment] 📊 Invoice saved to DB:
[verify-payment]   - invoiceNumber: INV-1234567890-ABC123
[verify-payment]   - _id: 1234567890abcdef
[verify-payment]   - orderNumber: ref_1234567890
[verify-payment]   - paymentVerified: true
[verify-payment]   - customerEmail: chisom@gmail.com
========== PAYMENT VERIFICATION SUCCESS ==========
```

**Check 1:** Do you see this section?
- If NO: Payment verification didn't complete
- If YES: Invoice was created ✅

**Check 2:** Does `orderNumber` match `ref_1234567890`?
- This is critical for linking later!

---

#### 2️⃣ ORDERS API LINKS INVOICE
After payment, when order is saved:

```
[Orders API] 🔗 LINKING INVOICE TO BUYER
[Orders API]   Order Number: ref_1234567890
[Orders API]   Email: chisom@gmail.com
[Orders API]   BuyerId: N/A (guest)
[Orders API] 🔍 Searching for invoice with:
[Orders API]   - orderNumber: ref_1234567890
[Orders API]   - paymentVerified: true
```

**Check 1:** Does orderNumber match what verify-payment created?

```
[Orders API] ✅ FOUND existing invoice!
[Orders API]   - invoiceNumber: INV-1234567890-ABC123
[Orders API]   - _id: 1234567890abcdef
[Orders API]   - Current customerEmail: chisom@gmail.com
[Orders API]   - Current buyerId: NONE
```

**Check 2:** Is it finding the invoice?
- If YES ✅: Go to Check 3
- If NO ❌: Invoice wasn't created in verify-payment

```
[Orders API] 📝 Updating invoice with:
[Orders API]   - buyerId: STILL NO BUYERID!
[Orders API]   - customerName: John Doe
[Orders API]   - customerEmail: chisom@gmail.com
[Orders API]   - totalAmount: 50000
[Orders API] ✅✅✅ INVOICE LINKED AND UPDATED!
[Orders API]   - invoiceNumber: INV-1234567890-ABC123
[Orders API]   - buyerId: 1234567890abcdef
[Orders API]   - customerEmail: chisom@gmail.com
[Orders API]   - totalAmount: 50000
```

**Check 3:** Is the invoice being updated?
- If YES ✅: Invoice linked to buyer
- If NO ❌: Check for error between "Searching" and "Updating"

**If NO INVOICE FOUND:**
```
[Orders API] ❌ NO INVOICE FOUND for orderNumber: ref_1234567890
[Orders API] This might mean:
[Orders API]   1. verify-payment was not called
[Orders API]   2. Invoice was created with different orderNumber
[Orders API]   3. Invoice was created with paymentVerified: false
```

---

#### 3️⃣ DASHBOARD FETCHES FROM API
When you go to dashboard:

```
[Dashboard] ========== FETCHING INVOICES ==========
[Dashboard] buyer.email: chisom@gmail.com
[Dashboard] buyer.id: NOT SET (guest)
[Dashboard] Using guest fetch: /api/invoices?email=chisom%40gmail.com
[Dashboard] 📡 Calling API: /api/invoices?email=chisom%40gmail.com
[Dashboard] ✅ Got response from API
[Dashboard] 📊 Number of invoices: 1
[Dashboard] First invoice details:
[Dashboard]   - invoiceNumber: INV-1234567890-ABC123
[Dashboard]   - buyerId: 1234567890abcdef
[Dashboard]   - customerEmail: chisom@gmail.com
[Dashboard]   - totalAmount: 50000
[Dashboard] ✅✅✅ INVOICES SET: 1
```

**Check:** Does it show "Number of invoices: 1"?
- If YES ✅: Invoice should be visible!
- If NO ❌: API query returned nothing

---

#### 4️⃣ API ENDPOINT PROCESSES QUERY
Server-side:

```
========== GET /api/invoices CALLED ==========
🔍 Query params: { email: 'chisom@gmail.com' }
🔎 SEARCHING BY EMAIL: chisom@gmail.com
📋 FINAL QUERY: { "customerEmail": "chisom@gmail.com" }
📊 RESULT: Found 1 invoices
📄 First 3 invoices:
   1. INV-1234567890-ABC123 - chisom@gmail.com - ₦50000 - buyerId: 1234567890abcdef
✅ RETURNING 1 serialized invoices
========== GET /api/invoices COMPLETED ==========
```

**Check:** Does it show "Found X invoices"?
- If 0 ❌: Email doesn't match what's in database
- If > 0 ✅: Invoice exists in database

---

## Troubleshooting Decision Tree

```
1. Does verify-payment create invoice?
   ├─ NO → Check Paystack secret key, check if payment succeeds
   └─ YES → Go to 2

2. Does orders API find the invoice?
   ├─ NO → Check if orderNumber matches
   │       Check if paymentVerified: true
   └─ YES → Go to 3

3. Does orders API UPDATE the invoice?
   ├─ NO → Check for error in logs
   │       Check if guest buyer was created
   └─ YES → Go to 4

4. Does dashboard fetch from API?
   ├─ NO → Check buyer.email is set
   │       Check API fetch URL
   └─ YES → Go to 5

5. Does API return invoices?
   ├─ NO → Check customerEmail case sensitivity
   │       Check if invoice exists with that email
   └─ YES → Invoice should display! ✅
```

---

## Quick Diagnosis Steps

### Step 1: Check Verify-Payment
**Look for in server logs:**
```
[verify-payment] ✅ Invoice created: INV-
```
- If missing: verify-payment didn't run
- Note the invoiceNumber

### Step 2: Check Invoice Linking
**Look for in server logs:**
```
[Orders API] ✅ FOUND existing invoice!
```
- If missing: Can't find invoice (orderNumber mismatch?)
- If present: Go to next check

### Step 3: Check Dashboard API Call
**In browser console:**
```javascript
fetch('/api/invoices?email=chisom@gmail.com')
  .then(r => r.json())
  .then(d => {
    console.log('Invoices from API:', d);
    console.log('Count:', d.length);
  })
```
- If 0 invoices: Email doesn't match
- If > 0 invoices: Check if correct buyerId is set

### Step 4: Check Database Directly
**From browser console:**
```javascript
// This will show what's in the DB
fetch('/api/invoices')
  .then(r => r.json())
  .then(d => {
    console.log('All invoices:', d);
    d.forEach(inv => {
      console.log(`${inv.invoiceNumber}: ${inv.customerEmail} - buyerId: ${inv.buyerId}`);
    });
  })
```

---

## Most Common Issues & Fixes

### ❌ Issue: "NO INVOICE FOUND for orderNumber"
**Cause:** Invoice wasn't created in verify-payment
**Fix:** 
1. Check if verify-payment ran at all
2. Verify `orderNumber` is set to Paystack reference
3. Verify `paymentVerified: true` is set

### ❌ Issue: "Found 0 invoices" in API
**Cause:** Email doesn't match
**Possible fixes:**
1. Check case sensitivity (should be lowercase)
2. Check if there are extra spaces
3. Verify invoice was created with correct email

### ❌ Issue: Found invoice but NO buyerId
**Cause:** Invoice wasn't linked during order creation
**Fix:**
1. Check orders API logs for "FOUND existing invoice"
2. If not found: orderNumber mismatch
3. If found but not updated: Check for error in update step

---

## Log Collection Command

To capture complete logs from one payment:
```bash
# Keep this ready and trigger logs when customer makes payment
# Then share the full output here
```

---

## Next Steps

1. **Make a test payment as guest**
2. **Check browser console** (F12) for Dashboard logs
3. **Check server logs** for all four sections
4. **Report which section is missing or failing**
5. **Share the logs** from that section

Once we see the logs, we'll know exactly which step is broken!
