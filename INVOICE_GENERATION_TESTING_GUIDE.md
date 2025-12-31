# 🔬 Invoice Generation Testing Guide

## Current Status
- ✅ Invoice model has correct schema with `paymentVerified` and `paymentReference` fields
- ✅ Invoice generation works from `/api/orders` endpoint (13 invoices in DB)
- ✅ verify-payment route is updated to generate invoices
- ⏳ **Pending:** Test actual Paystack payment to trigger verify-payment invoice generation

---

## How Invoice Generation Works (Current Flow)

### Path 1: From Order Creation (✅ Already Working)
```
User clicks "Pay with Paystack" 
  → Opens Paystack modal
  → Payment processed
  → Paystack redirects to /checkout?reference=xyz
  → /api/verify-payment called
  → (Currently NOT creating invoices in this step)
  → User clicks "Continue" on success modal
  → /api/orders endpoint called
  → ✅ Invoice generated here with order data
```

### Path 2: Direct from Payment (🔧 What We Just Fixed)
```
/api/verify-payment should:
  1. Verify payment with Paystack API
  2. Create invoice immediately from Paystack data
  3. Send email to customer
  4. Send notification to admin
  → (This is what the code now does)
```

---

## Code Verification Checklist

### 1. Invoice Model ✅
- **File:** `/lib/models/Invoice.ts`
- **Status:** VERIFIED
  - ✅ `paymentVerified?: boolean` field exists
  - ✅ `paymentReference?: string` field exists
  - ✅ Schema allows setting these on creation
  
**Test:** Check if new invoices can have these fields set
```typescript
const invoice = new Invoice({
  paymentVerified: true,
  paymentReference: 'ref_xyz',
  // ... other fields
});
```

### 2. Verify-Payment Route ✅
- **File:** `/app/api/verify-payment/route.ts`
- **Status:** VERIFIED - Complete rewrite in place

**Key sections:**
- ✅ Lines 1-45: Setup and Paystack API call
- ✅ Lines 45-120: Extract payment data from Paystack
- ✅ Lines 120-160: Create invoice with `paymentVerified: true`
- ✅ Lines 160-180: Send invoice email
- ✅ Lines 180-210: Call `/api/send-payment-notification`

**What it does:**
```typescript
// Uses Paystack payment data directly
const invoice = new Invoice({
  invoiceNumber,
  orderNumber: paymentReference,
  customerName,
  customerEmail,
  totalAmount: paymentAmount,
  paymentVerified: true,        // ← Mark as verified
  paymentReference: paymentReference,  // ← Store Paystack ref
  // ...
});

await invoice.save();
await sendInvoiceEmail(...);
await fetch('/api/send-payment-notification', {...});
```

### 3. Email Service ✅
- **File:** `/lib/email.ts`
- **Status:** VERIFIED
  - ✅ `sendInvoiceEmail()` function exists
  - ✅ Sends to customer and admin
  - ✅ Handles missing RESEND_API_KEY gracefully
  
**Requirements for emails to work:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@yourdomain.com
```

**Current status:** Check .env.local
```bash
grep -i "RESEND" .env.local
```

### 4. Notification System ✅
- **File:** `/app/api/send-payment-notification/route.ts`
- **Status:** VERIFIED
  - ✅ Endpoint exists
  - ✅ Calls proper notification functions
  - ✅ Creates messages in Message collection

---

## Testing Invoice Generation

### Test 1: Check Database Current State
**What:** See how many invoices exist and their types

```bash
node -e "
const mongoose = require('mongoose');

async function check() {
  const uri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri);
  
  const invoices = await mongoose.connection.db.collection('invoices')
    .find({})
    .project({ invoiceNumber: 1, paymentVerified: 1, type: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  console.log('Recent invoices:');
  invoices.forEach(inv => {
    console.log('✓', inv.invoiceNumber, 
      'verified:', inv.paymentVerified ? 'YES' : 'NO',
      'type:', inv.type);
  });
  
  await mongoose.disconnect();
}

check();
"
```

**Expected output for working flow:**
```
Recent invoices:
✓ INV-1234567-ABC123 verified: YES type: automatic ← From Paystack payment
✓ INV-1234567-XYZ789 verified: NO  type: automatic  ← From order creation
```

### Test 2: Manual Payment Test (Complete Flow)
**What to do:**
1. Go to `/checkout` in your browser
2. Add items to cart
3. Click "Pay with Paystack"
4. Enter test card: **4111 1111 1111 1111**
5. Any future expiry date
6. Any CVV (e.g., 123)
7. Wait for payment confirmation

**What to check:**
1. ✅ Success modal appears with order number
2. ✅ Check email inbox for invoice (if RESEND_API_KEY configured)
3. ✅ Check admin inbox for "💰 Payment Received!" message
4. ✅ Run the database check above to verify invoice was created with `paymentVerified: true`

### Test 3: Check Logs
**Look for in browser console (F12):**
```
[verify-payment] ✅✅✅ PAYMENT VERIFIED AS SUCCESSFUL!
[verify-payment] 💳 Payment data extracted:
[verify-payment] 📄 Creating invoice: INV-xxx-xxx
[verify-payment] ✅ Invoice created: INV-xxx-xxx
[verify-payment] 📧 Sending invoice email to customer
[verify-payment] 📨 Sending payment notification messages
```

**Look for in server logs:**
```
========== PAYMENT VERIFICATION START ==========
[verify-payment] 🔍 Verifying payment for reference: ref_xxxx
[verify-payment] ✅ Got response from Paystack
[verify-payment] ✅✅✅ PAYMENT VERIFIED AS SUCCESSFUL!
[verify-payment] 📄 Creating invoice: INV-xxx-xxx
[verify-payment] ✅ Invoice created with paymentVerified: true
========== PAYMENT VERIFICATION SUCCESS ==========
```

---

## Troubleshooting

### Issue: Email Not Sent
**Cause:** RESEND_API_KEY not configured

**Solution:**
1. Get API key from https://resend.com
2. Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@yourdomain.com
```
3. Restart dev server

### Issue: Invoice Not Created
**Check:**
1. ✅ Are you getting "PAYMENT VERIFIED AS SUCCESSFUL!" in logs?
2. ✅ Check MongoDB for new invoice: `paymentVerified: true`
3. ✅ Check browser console for errors during verify-payment

### Issue: No Admin Notification
**Check:**
1. ✅ `/api/send-payment-notification` endpoint is being called
2. ✅ Check if Message collection has new entries
3. ✅ Check admin inbox component for fetching messages

---

## Next Steps

1. **If you haven't made a Paystack payment yet:**
   - Go to `/checkout`
   - Add items
   - Complete payment with test card
   - Watch for success modal

2. **After payment:**
   - Run database check to verify invoice created
   - Check email for invoice
   - Check admin inbox for notification

3. **If issues occur:**
   - Check browser console (F12)
   - Check server logs
   - Verify RESEND_API_KEY is configured
   - Re-run database check

---

## Summary

✅ Code is ready for testing
⏳ Waiting for you to make a Paystack payment to trigger invoice generation
📋 Follow this guide to test and verify

The system should now:
1. Accept Paystack payment
2. Create invoice immediately from payment data
3. Send email to customer
4. Create notification for admin
5. All without requiring pre-existing order
