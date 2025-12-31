# Payment Flow Quick Reference ⚡

## The Complete Flow in 60 Seconds

```
1️⃣  Customer makes payment via Paystack
        ↓
2️⃣  System verifies with Paystack API
        ↓
3️⃣  ✅ Invoice auto-generated
4️⃣  ✅ Admin notified automatically  
5️⃣  ✅ Success modal shows to customer
        ↓
6️⃣  Customer sees: "📦 Track Your Order"
        ↓
7️⃣  Admin sees: "💰 Payment Received!" message
8️⃣  Admin clicks "Approve"
        ↓
9️⃣  Order → Production ✅
```

---

## What Each Step Does

### Step 1: Payment Made
- User clicks "Pay with Paystack"
- Paystack modal opens securely
- User enters card details (handled by Paystack)
- Paystack processes payment and confirms

### Step 2: Verification with Paystack ⭐ CRITICAL
**File:** `/api/verify-payment/route.ts`

```typescript
// Calls Paystack API to confirm payment
GET /api/verify-payment?reference=EMPI-1767116896870-mf2b3vbvu

// Paystack responds: status = 'success' ✅
```

### Step 3: Invoice Auto-Generated ⭐ CRITICAL
**File:** `/api/verify-payment/route.ts` (lines 136-193)

What gets created:
- Invoice document in MongoDB
- Invoice PDF email sent to customer
- Invoice number: `INV-1735555200000-ab3c5f`

### Step 4: Admin Notified ⭐ CRITICAL
**File:** `/lib/paymentNotifications.ts`

What admin sees:
```
💰 Payment Received!

✅ Payment confirmed for order #EMPI-1767116896870-mf2b3vbvu

👤 Customer: John Doe
📧 Email: john@example.com
💵 Amount: ₦50,000
🔖 Payment Reference: response123456

📄 [View Invoice]
```

### Step 5: Success Modal Shows
**File:** `/components/PaymentSuccessModal.tsx`

```
✅ Payment Successful!

📦 Track Your Order

Order Reference: EMPI-1767116896870-mf2b3vbvu
Amount Paid: ₦50,000.00

[Go to Dashboard Orders] [Continue Shopping]
```

### Step 6-7: Customer & Admin Actions
- **Customer:** Can see order in dashboard
- **Admin:** Reviews and approves order

---

## Key Files

| File | Purpose |
|------|---------|
| `/api/initialize-payment/route.ts` | Creates payment session with Paystack |
| `/api/verify-payment/route.ts` | **Verifies, creates invoice, notifies admin** |
| `/components/PaymentSuccessModal.tsx` | Shows success message to customer |
| `/lib/paymentNotifications.ts` | Creates admin notification messages |
| `/lib/email.ts` | Sends invoice email |
| `/checkout/page.tsx` | Handles payment flow on frontend |

---

## Critical Verification Points

### ✅ Paystack API Always Checks
```
System NEVER trusts frontend payment confirmation
↓
Always calls Paystack API with reference
↓
Only proceeds if Paystack says status = 'success'
↓
Then creates invoice and notifies admin
```

### ✅ Invoice is Created Immediately
```
Payment verified ✅
    ↓
Invoice created ✅ (same second)
    ↓
Email sent ✅ (immediately)
    ↓
Admin notified ✅ (immediately)
```

### ✅ Admin Gets Automatic Message
```
No manual email needed
No need to check dashboard manually
Message appears in admin inbox automatically
Unread indicator shows new notification
```

---

## How to Test

1. Go to `/checkout`
2. Add items or use custom quote
3. Enter customer info
4. Click "Pay with Paystack"
5. Use test card: `4111 1111 1111 1111` (any future expiry, any CVV)
6. Watch success modal appear ✅
7. Check admin panel → see "💰 Payment Received!" message ✅
8. Admin clicks approve ✅
9. Order → Production ✅

---

## What's Included

- ✅ Paystack integration
- ✅ Payment verification with Paystack API
- ✅ Automatic invoice generation
- ✅ Invoice email to customer
- ✅ Automatic admin notification
- ✅ Success modal with order details
- ✅ Admin approval workflow
- ✅ Order status tracking

---

## Environment Variables Needed

```
NEXT_PUBLIC_PAYSTACK_KEY=pk_live_xxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxx
```

---

**Status:** ✅ Complete and working  
**Last Updated:** December 30, 2025
