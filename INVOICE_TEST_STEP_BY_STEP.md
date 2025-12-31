# 🎯 Step-by-Step Invoice Generation Test

## Current System State

### ✅ Code is Ready
- Invoice model has payment tracking fields
- verify-payment route creates invoices from Paystack data
- Email service is configured
- Notification system is ready
- Database is connected and working

### ⏳ Waiting for Manual Test
Invoice generation from payments hasn't been tested yet because no Paystack payments have been made through the actual payment flow.

---

## Complete Payment Flow (How It Works Now)

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER JOURNEY                         │
└─────────────────────────────────────────────────────────────┘

1️⃣  User goes to /checkout
    ↓
2️⃣  Adds items to cart
    ↓
3️⃣  Fills in customer info
    ↓
4️⃣  Clicks "Pay with Paystack"
    ↓
5️⃣  Paystack modal opens
    ↓
6️⃣  User enters card details: 4111 1111 1111 1111
    ↓
7️⃣  Payment processed by Paystack
    ↓
8️⃣  Paystack redirects to: /checkout?reference=ref_xxxxx
    ↓
┌─────────────────────────────────────────────────────────────┐
│  /api/verify-payment?reference=ref_xxxxx IS CALLED          │
│  (This is where invoice should be created)                  │
└─────────────────────────────────────────────────────────────┘
    ↓
9️⃣  ✅ verify-payment:
    • Confirms payment with Paystack API
    • Creates invoice immediately with:
      - invoiceNumber
      - orderNumber (Paystack reference)
      - customerName, customerEmail
      - totalAmount
      - paymentVerified: true
      - paymentReference: ref_xxxxx
    • Sends email to customer with invoice
    • Sends message to admin: "💰 Payment Received!"
    ↓
🔟  Success modal shows in browser
    • Shows order reference
    • Shows amount
    • Button: "Continue Shopping" or "View Order"
    ↓
1️⃣1️⃣  User clicks "Continue" button
    ↓
1️⃣2️⃣  /api/orders endpoint called
    • Creates Order document in database
    • Generates second invoice (from order data)
    ↓
✅ COMPLETE!
   • Invoice created in verify-payment
   • Email sent
   • Admin notified
   • Order created
```

---

## Test Instructions

### BEFORE Testing
1. Make sure Paystack test keys are configured
2. Check `.env.local` for PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY
3. Verify RESEND_API_KEY is set for email testing (optional but recommended)

```bash
# Check configuration
grep -E "PAYSTACK|RESEND" .env.local
```

### DURING Testing

#### Step 1: Open Browser DevTools (F12)
```
- Open /checkout in browser
- Press F12 to open Developer Tools
- Go to Console tab
- Keep this visible during test
```

#### Step 2: Create Test Order
```
1. On checkout page, add items to cart
2. Fill in customer info:
   - Full Name: "Test Customer"
   - Email: "your-email@example.com"
   - Phone: "+2341234567890"
3. Click "Pay with Paystack"
```

#### Step 3: Complete Payment
```
Paystack modal opens:
- Card Number: 4111 1111 1111 1111
- Expiry: Any future date (e.g., 12/25)
- CVV: 123 (any 3 digits)
- Click "Pay"
```

#### Step 4: Wait for Redirect
```
- Paystack processes payment
- Should say "Payment successful"
- Browser redirects back to /checkout?reference=ref_xxxxx
- Console shows: "✅ Payment verified!"
```

#### Step 5: Check Console Output
**Look for these messages in order:**

```
✅ Payment success handler called
Reference: ref_xxxxx
💾 Saving order...
...order data...
✅ Order saved
Invoice generated: INV-1767118xxx-ABC123
Order ID: 6954165139ded2f62b1734b5
🎉 Payment successful!
```

---

## AFTER Testing - Verify Invoice Was Created

### Method 1: Check Database Directly

```bash
# Run this in terminal
node -e "
const mongoose = require('mongoose');

async function check() {
  const uri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri);
  
  const invoices = await mongoose.connection.db.collection('invoices')
    .find({ paymentVerified: true })
    .sort({ createdAt: -1 })
    .toArray();
  
  console.log('\\n✅ Invoices with paymentVerified=true:');
  invoices.forEach(inv => {
    console.log('');
    console.log('  Invoice:', inv.invoiceNumber);
    console.log('  Customer:', inv.customerName);
    console.log('  Email:', inv.customerEmail);
    console.log('  Amount: ₦' + inv.totalAmount);
    console.log('  Payment Ref:', inv.paymentReference);
    console.log('  Created:', new Date(inv.createdAt).toLocaleString());
  });
  
  if (invoices.length === 0) {
    console.log('  ⚠️  No invoices with paymentVerified=true found yet');
  } else {
    console.log('\\n✅ INVOICE GENERATION FROM PAYMENTS IS WORKING!');
  }
  
  await mongoose.disconnect();
}

check();
"
```

### Method 2: Check Email
```
Check inbox for email with:
- Subject: "Your Invoice INV-xxx | EMPI Costumes"
- Sent to: your-email@example.com
- Contains: invoice number, items, amount, due date
```

### Method 3: Check Admin Notifications
```
Log in as admin and check inbox:
- Look for message: "💰 Payment Received!"
- Shows: customer name, amount, payment reference
- Created: immediately after payment
```

---

## Expected Results When Working ✅

| Check | Should See |
|-------|-----------|
| **Console** | Payment verified, Order saved, Invoice generated |
| **Success Modal** | Shows order reference and amount |
| **Email** | Invoice email from noreply@... |
| **Database** | New invoice with `paymentVerified: true` |
| **Admin Inbox** | New message "💰 Payment Received!" |
| **Order Document** | `status: "confirmed"` with items |

---

## Troubleshooting

### Issue: Console shows error during verify-payment

**Check 1: Is Paystack response correct?**
```
Look for: [verify-payment] ✅ Got response from Paystack
If missing: Paystack API call failed
Solution: Check PAYSTACK_SECRET_KEY in .env.local
```

**Check 2: Is invoice being created?**
```
Look for: [verify-payment] 📄 Creating invoice: INV-xxx-xxx
If missing: Payment verification failed
Solution: Check payment was actually successful in Paystack
```

### Issue: Email not received

**Cause:** RESEND_API_KEY not configured

**Check:**
```bash
grep RESEND_API_KEY .env.local
```

**If missing:**
1. Get key from https://resend.com
2. Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@yourdomain.com
```
3. Restart dev server
4. Make another test payment

### Issue: Admin notification not showing

**Check 1: Is send-payment-notification being called?**
```
Look for: [verify-payment] 📨 Sending payment notification messages
Solution: Check if endpoint call succeeds
```

**Check 2: Are messages being created?**
```bash
node -e "
const mongoose = require('mongoose');

async function check() {
  const uri = 'mongodb+srv://sta99175_db_user:n45LxR23xyyf7D9l@cluster0.w7fvrkw.mongodb.net/?appName=Cluster0';
  await mongoose.connect(uri);
  
  const messages = await mongoose.connection.db.collection('messages')
    .find({ messageType: 'system' })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  console.log('Recent system messages:');
  messages.forEach(m => {
    console.log('- ', m.content?.substring(0, 50));
  });
  
  await mongoose.disconnect();
}

check();
"
```

---

## Success Criteria

✅ Invoice generation is working when:
1. Console shows "Invoice generated: INV-xxx-xxx"
2. Database has invoice with `paymentVerified: true`
3. Email received with invoice
4. Admin sees notification message
5. Order created with `status: "confirmed"`

---

## Quick Summary

1. **Go to /checkout** with test items
2. **Make payment** with test card `4111 1111 1111 1111`
3. **Check console** (F12) for success messages
4. **Verify database** for invoice with `paymentVerified: true`
5. **Check email** for invoice
6. **Check admin inbox** for payment notification

Everything is ready - just need the manual test! 🚀
