# 🎯 Test Invoice Delivery to Customer - Step by Step

## What Was Fixed
The customer/buyer now receives the invoice email after payment, in addition to the admin.

## Test Instructions

### Step 1: Navigate to Checkout
1. Go to `http://localhost:3000/checkout` (or your deployment URL)
2. Make sure you're not logged in (use guest checkout for clearest test)

### Step 2: Add Items to Cart
1. Add some items from the catalog
2. Choose shipping option if available
3. Proceed to payment

### Step 3: Fill Customer Information
**⚠️ IMPORTANT: Use a REAL EMAIL you can check!**

```
Full Name: John Doe (or your name)
Email: your-real-email@example.com  ← Use YOUR email!
Phone: +2341234567890
```

### Step 4: Start Payment
1. Click "Pay with Paystack" button
2. Paystack modal should open
3. **Keep browser DevTools open (F12)** to watch the console

### Step 5: Complete Payment
Paystack modal shows:
```
Card Number: 4111 1111 1111 1111
Expiry Date: 12/25 (any future date)
CVV: 123 (any 3 digits)
```

1. Enter card details
2. Click "Pay"
3. Modal should say "Payment successful"

### Step 6: Watch Console
After payment, check browser console (F12 → Console tab).

**Look for these messages:**
```
✅ Payment success handler called
Reference: ref_xxxxx
📊 Payment data extracted:
   - Reference: ref_xxxxx
   - Amount: 50000
   - Customer Email: your-real-email@example.com  ← Your email!
   - Email Source: Query Parameter ✅              ← This should say "Query Parameter ✅"
📧 Sending invoice email to customer
✅ Invoice email sent to: your-real-email@example.com
```

### Step 7: Check Your Email
After ~30 seconds, check your email inbox for:

**Email Details:**
- **From:** noreply@empicostumes.com (or configured email)
- **Subject:** Your Invoice INV-xxx | EMPI Costumes
- **Contains:** Invoice number, items, amount, due date

### Step 8: Verify Success Modal
1. After email sending starts, you should see success modal
2. Shows order reference and amount
3. Button to continue shopping

---

## What Should Happen

| Step | Status | Details |
|------|--------|---------|
| **1. Payment Processed** | ✅ Paystack | "Payment successful" message |
| **2. verify-payment Called** | ✅ Backend | Email source: Query Parameter |
| **3. Invoice Created** | ✅ Database | With paymentVerified: true |
| **4. Email to Customer** | ✅ Sent | To your-email@example.com |
| **5. Email to Admin** | ✅ Sent | To admin@example.com |
| **6. Order Created** | ✅ Database | status: "confirmed" |
| **7. Success Modal Shows** | ✅ Frontend | Shows reference & amount |

---

## Troubleshooting

### Issue: Console shows "Email Source: Empty ⚠️"
**Cause:** Email not passed to verify-payment

**Fix:**
1. Make sure you filled in email field on checkout
2. Check that the Paystack modal shows your email info
3. The email should be passed as query parameter to verify-payment

### Issue: Email not received
**Check 1:** Verify RESEND_API_KEY is configured
```bash
grep RESEND_API_KEY .env.local
```

If not configured:
```bash
# Add to .env.local:
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@yourdomain.com
```

**Check 2:** Look for error in server logs
```
[verify-payment] ❌ Failed to send invoice email: [error details]
```

**Check 3:** Check spam/junk folder in your email

### Issue: Success modal doesn't show
**Cause:** Order creation might have failed

**Check:**
1. Look for "Order save failed" in console
2. Check if MONGODB_URI is correct
3. Verify database connection

---

## Expected Console Output

### Good Flow
```
✅ Payment success handler called
Reference: ref_1234567890
💾 Saving order...
Order data: {...}
✅ Order saved
Invoice generated: INV-1767118xxx-ABC123
Order ID: 6954165139ded2f62b1734b5
📊 Payment data extracted:
   - Reference: ref_1234567890
   - Amount: 50000
   - Customer Email: john@example.com
   - Customer Name: John Doe
   - Email Source: Query Parameter ✅
📄 Creating invoice: INV-1767118xxx-ABC123
✅ Invoice created: INV-1767118xxx-ABC123
📧 Sending invoice email to customer
✅ Invoice email sent to: john@example.com
📨 Sending payment notification messages (admin + buyer)
✅ Payment notification messages sent successfully
🎉 Payment successful!
```

### Bad Flow (Missing Email)
```
📧 Sending invoice email to customer
✅ Invoice email sent to:                    ← Empty! No email!
❌ Invoice email results - Customer: ❌, Admin: ✅
```

---

## Quick Summary

✅ **Fixed:** Customer email is now properly passed from checkout to verify-payment
✅ **Verified:** Email parameter is prioritized in verify-payment
✅ **Expected:** Invoice sent to both customer AND admin after payment

**Next Steps:**
1. Make a test payment with YOUR email
2. Check console for "Email Source: Query Parameter ✅"
3. Check your email for invoice
4. Confirm admin also gets copy

---

## Success Criteria ✅

Test is successful when:
1. ✅ Console shows: "Email Source: Query Parameter ✅"
2. ✅ You receive invoice email at your address
3. ✅ Admin also receives copy of invoice
4. ✅ Success modal appears with order reference
5. ✅ Database has invoice with paymentVerified: true

**Once all 5 are confirmed, invoice generation is working perfectly!**
