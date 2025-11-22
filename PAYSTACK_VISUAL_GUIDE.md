# Paystack Setup Visual Guide

## 📋 Your Complete Setup Checklist

```
PHASE 1: Configuration
├─ [ ] Add .env.local variables
├─ [ ] Verify dev server running (npm run dev)
└─ [ ] Test credentials loaded

PHASE 2: Integration  
├─ [ ] Import PaystackPaymentButton in checkout
├─ [ ] Add props: email, amount, orderId
└─ [ ] Handle callbacks

PHASE 3: Testing
├─ [ ] Go to checkout page
├─ [ ] Click Pay button
├─ [ ] Use test card
├─ [ ] Verify payment success
└─ [ ] Check order status → "paid"

PHASE 4: Production (Later)
├─ [ ] Get live credentials
├─ [ ] Whitelist server IP
├─ [ ] Update .env.production
└─ [ ] Deploy
```

## 🔑 Your Credentials

**Test Mode** (Use Now):
```
Public:  pk_test_afcc9e28bd9e9cd4e2b9461b9416f9653b31144e
Secret:  sk_test_4f825c56bae8506135465d036bbdedfa1d31c77b
```

**Production** (Use Later):
```
Public:  pk_live_xxxxxxxxxxxxx  (you'll get when ready)
Secret:  sk_live_xxxxxxxxxxxxx  (you'll get when ready)
```

## 💻 Terminal Commands

```bash
# Start development
npm run dev

# After adding .env.local, restart with:
npm run dev  # (stop with Ctrl+C, then run again)

# Find your server IP (for production IP whitelist)
curl ifconfig.me
```

## 🎨 UI Components Available

### PaystackPaymentButton Component

**Location:** `app/components/PaystackPaymentButton.tsx`

**Usage:**
```tsx
import { PaystackPaymentButton } from "@/app/components/PaystackPaymentButton";

<PaystackPaymentButton
  email="customer@example.com"
  amount={50000}           // Naira
  orderId="ORDER123"
  onPaymentSuccess={(ref) => console.log("Success:", ref)}
  onPaymentError={(err) => console.log("Error:", err)}
/>
```

**Props:**
- `email` (string, required) - Customer email
- `amount` (number, required) - Amount in Naira
- `orderId` (string, required) - Order ID for tracking
- `onPaymentSuccess` (function) - Called after successful payment
- `onPaymentError` (function) - Called on error
- `disabled` (boolean, optional) - Disable button

**Shows:**
- Loading state while initializing
- Error messages
- "Pay ₦50,000" button with formatted amount

### Payment Callback Page

**Location:** `app/checkout/payment-callback/page.tsx`

**Accessed:** `http://localhost:3000/checkout/payment-callback?reference=ref_xyz`

**Shows:**
- Payment status (success/error/loading)
- Order details
- Amount charged
- Payment reference
- Auto-redirect to confirmation

## 🔄 Payment Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  Customer at Checkout                               │
│  (Cart total: ₦50,000)                              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Click Pay Button   │
        └────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ PaystackPaymentButton      │
    │ Converts: Naira → Kobo     │
    │ (50,000 → 5,000,000)       │
    └────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │ Backend: /api/payments/paystack/ │
  │ initialize                       │
  │ - Validates input               │
  │ - Calls Paystack API            │
  │ - Returns auth URL              │
  └────────┬─────────────────────────┘
           │
           ▼
┌───────────────────────────────────────┐
│ Paystack Hosted Checkout Page         │
│                                       │
│ Card: 4111 1111 1111 1111             │
│ Expiry: 01/25                         │
│ CVV: 123                              │
│ OTP: 123456                           │
│                                       │
│ [Process Payment] button              │
└────────┬────────────────────────────┘
         │
         ▼
  ┌────────────────────────────┐
  │ Paystack Processes Payment │
  │                            │
  │ ✅ Payment Successful      │
  └────────┬───────────────────┘
           │
           ▼
 ┌──────────────────────────────────┐
 │ Webhook: /api/webhooks/paystack  │
 │                                  │
 │ Paystack sends:                  │
 │ - Payment reference              │
 │ - Status: "success"              │
 │ - Amount: 50000 (Naira)          │
 │ - Order ID                       │
 │                                  │
 │ Backend updates:                 │
 │ - Order status → "paid"          │
 │ - Stores reference               │
 └────────┬─────────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│ Payment Callback Page                │
│ /checkout/payment-callback           │
│ ?reference=ref_xyz                   │
│                                      │
│ Shows:                               │
│ ✅ Payment Successful!               │
│ Amount: ₦50,000                      │
│ Reference: ref_xyz                   │
│ Order ID: ORDER123                   │
│                                      │
│ [View Order] (auto-redirect)         │
└──────────────────────────────────────┘
```

## 💾 Database Updates

### Order Document After Payment

**Before Payment:**
```json
{
  "_id": "ORDER123",
  "buyerId": "BUYER456",
  "items": [...],
  "totalAmount": 50000,
  "status": "pending"  // ← Before
}
```

**After Webhook:**
```json
{
  "_id": "ORDER123",
  "buyerId": "BUYER456",
  "items": [...],
  "totalAmount": 50000,
  "status": "paid",                    // ← Updated
  "paymentReference": "ref_xyz",       // ← Added
  "paymentMethod": "paystack",         // ← Added
  "paidAt": "2025-11-22T10:30:00Z"    // ← Added
}
```

## 📊 Test with This Card

```
╔════════════════════════════════════╗
║ TEST CARD DETAILS                  ║
╠════════════════════════════════════╣
║ Card Number: 4111 1111 1111 1111  ║
║ Expiry Month: 01                   ║
║ Expiry Year: 25                    ║
║ CVV: 123                           ║
║ OTP: 123456                        ║
║ PIN: 1234                          ║
╚════════════════════════════════════╝
```

**This will:**
- Always succeed in test mode
- Never charge your account
- Show payment as "paid" in logs

## 🌐 IP Whitelist Locations

### Paystack Dashboard
```
https://dashboard.paystack.com
  └─ Settings
      └─ API Keys & Webhooks
          └─ IP Whitelist
              └─ [Add New IP]
```

### Finding Your IP

```bash
# On your server terminal
curl ifconfig.me

# Output: 192.168.1.100  (example)
```

## 📝 Environment Variable Setup

### Step 1: Locate .env.local

```
c:\Users\Acer Nitro\Desktop\empi\.env.local
```

### Step 2: Add These Lines

```env
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_afcc9e28bd9e9cd4e2b9461b9416f9653b31144e
PAYSTACK_SECRET_KEY=sk_test_4f825c56bae8506135465d036bbdedfa1d31c77b
```

### Step 3: Verify

```bash
# In terminal (PowerShell)
Get-Content .env.local

# Should show:
# NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
# PAYSTACK_SECRET_KEY=sk_test_...
```

## 🧪 Testing Checklist

```
BEFORE TESTING:
✓ .env.local has both keys
✓ Dev server restarted
✓ Dev server running on http://localhost:3000
✓ Paystack credentials are correct

DURING TESTING:
✓ Go to /checkout page
✓ Click "Pay ₦..." button
✓ Redirected to Paystack page
✓ Enter test card: 4111 1111 1111 1111
✓ Enter expiry: 01/25
✓ Enter CVV: 123
✓ Enter OTP: 123456
✓ Click Process/Pay

AFTER TESTING:
✓ See "Payment Successful!" message
✓ Check order status in database → "paid"
✓ See payment reference: ref_xyz...
✓ Check Next.js logs for success message

VERIFY WEBHOOK (Optional):
✓ Go to Paystack Dashboard → Logs → Webhooks
✓ See your webhook event
✓ Status: 200 (success)
```

## 🐛 Debug Tips

### Check Environment Variables Loaded
```bash
# In browser console (F12)
console.log(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY)

# Should show your public key
# If undefined, restart dev server
```

### View Payment Logs
```bash
# Terminal where dev server runs
# Look for messages like:
# ✅ Paystack payment initialized
# ✅ Order updated to PAID
```

### View Webhook Logs
```bash
# Paystack Dashboard
# https://dashboard.paystack.com
# Settings → Logs → Webhooks
# See all webhook events and responses
```

## 🚀 Quick Start Summary

```
1. Open .env.local
   ↓
2. Add Paystack keys
   ↓
3. Save and restart dev server
   ↓
4. Go to checkout page
   ↓
5. Click Pay button
   ↓
6. Use test card
   ↓
7. Complete payment
   ↓
8. See success page
   ↓
9. ✅ Done! Payment integration works!
```

---

**Ready?** Start with Step 1: Add your credentials to `.env.local`
