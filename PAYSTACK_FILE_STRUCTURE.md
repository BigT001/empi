# Paystack Integration - File Structure & Setup

## New Files Created

```
project/
├── PAYSTACK_SUMMARY.md                           # Overview (start here!)
├── PAYSTACK_QUICK_START.md                       # Step-by-step setup
├── PAYSTACK_INTEGRATION.md                       # Detailed technical docs
├── CHECKOUT_INTEGRATION_EXAMPLE.md               # How to integrate with checkout
│
├── app/
│   ├── api/
│   │   ├── payments/
│   │   │   └── paystack/
│   │   │       ├── initialize/
│   │   │       │   └── route.ts                  # Initialize Paystack transaction
│   │   │       └── verify/
│   │   │           └── route.ts                  # Verify payment
│   │   └── webhooks/
│   │       └── paystack/
│   │           └── route.ts                      # Receive payment notifications
│   │
│   ├── components/
│   │   └── PaystackPaymentButton.tsx             # React payment button component
│   │
│   └── checkout/
│       └── payment-callback/
│           └── page.tsx                          # Payment success/error page
```

## Setup Checklist

```
STEP 1: Add Environment Variables
[ ] Open .env.local
[ ] Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
[ ] Add PAYSTACK_SECRET_KEY
[ ] Save and restart dev server

STEP 2: Integrate with Checkout
[ ] Import PaystackPaymentButton in your checkout page
[ ] Pass email, amount, and orderId props
[ ] Handle onPaymentSuccess callback
[ ] Handle onPaymentError callback

STEP 3: Test
[ ] Start dev server (npm run dev)
[ ] Go to checkout page
[ ] Click "Pay" button
[ ] Use test card: 4111 1111 1111 1111
[ ] Complete payment
[ ] Verify order status updated to "paid"
[ ] Check webhook logs

STEP 4: IP Whitelisting (Optional - Production Only)
[ ] When going live, get live credentials
[ ] In Paystack Dashboard: Settings → IP Whitelist
[ ] Add your server's public IP
```

## Environment Variables

### .env.local
```env
# Paystack - Test Mode
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_afcc9e28bd9e9cd4e2b9461b9416f9653b31144e
PAYSTACK_SECRET_KEY=sk_test_4f825c56bae8506135465d036bbdedfa1d31c77b

# Optional - for webhook verification
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

### .env.production (When Going Live)
```env
# Paystack - Live Mode
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
```

## Component Usage Example

```tsx
// In your checkout page
import { PaystackPaymentButton } from "@/app/components/PaystackPaymentButton";

export default function CheckoutPage() {
  const [orderId, setOrderId] = useState("");

  return (
    <PaystackPaymentButton
      email="customer@example.com"
      amount={50000} // in Naira
      orderId={orderId}
      onPaymentSuccess={(reference) => {
        console.log("Payment successful:", reference);
        router.push("/order-confirmation");
      }}
      onPaymentError={(error) => {
        console.error("Payment failed:", error);
      }}
    />
  );
}
```

## API Endpoints Summary

### Backend Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/paystack/initialize` | POST | Start payment transaction |
| `/api/payments/paystack/verify` | GET | Verify payment status |
| `/api/webhooks/paystack` | POST | Receive payment notifications |

### Frontend Components Created

| Component | Purpose |
|-----------|---------|
| `PaystackPaymentButton` | Payment button & modal |
| `/checkout/payment-callback` | Success/error page |

## Amount Format Important ⚠️

**Paystack uses KOBO (not Naira)**

- 1 Naira = 100 Kobo
- ₦1 = 100 kobo
- ₦1,000 = 100,000 kobo
- ₦50,000 = 5,000,000 kobo

The `PaystackPaymentButton` automatically converts:
- Input: `amount={50000}` (Naira)
- Sends: `5000000` (Kobo)

## Testing Steps

1. **Setup .env.local**
   ```bash
   # Add these to .env.local
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_afcc9e28bd9e9cd4e2b9461b9416f9653b31144e
   PAYSTACK_SECRET_KEY=sk_test_4f825c56bae8506135465d036bbdedfa1d31c77b
   ```

2. **Restart dev server**
   ```bash
   npm run dev
   ```

3. **Test payment**
   - Go to checkout
   - Click pay button
   - Use test card: `4111 1111 1111 1111`
   - Expiry: `01/25`
   - CVV: `123`
   - OTP: `123456`

4. **Verify**
   - Check order status changed to "paid"
   - Check webhook in Paystack logs
   - See payment reference in browser console

## Do You Need to Add IP? Summary

| Scenario | IP Whitelist Needed? | When? |
|----------|:-------------------:|-------|
| Local testing | ❌ No | Now (dev) |
| Testing on ngrok | ❌ No | Now (dev) |
| Production server | ✅ Yes | Before launch |

## What Each File Does

### `PAYSTACK_INTEGRATION.md`
Complete technical documentation covering:
- Paystack API reference
- Implementation details
- Webhook setup
- Testing with ngrok
- Common issues

### `PAYSTACK_QUICK_START.md`
Step-by-step setup guide:
- Add environment variables
- Start dev server
- Test payment
- IP whitelisting explanation

### `CHECKOUT_INTEGRATION_EXAMPLE.md`
Code examples showing:
- How to integrate with existing checkout
- Order creation flow
- Payment button usage
- Order status tracking

### Backend Routes

**`app/api/payments/paystack/initialize/route.ts`**
- Receives: email, amount, orderId
- Calls Paystack API to create transaction
- Returns: authorization URL and reference
- Used by: PaystackPaymentButton

**`app/api/payments/paystack/verify/route.ts`**
- Receives: payment reference from Paystack
- Verifies payment on Paystack servers
- Returns: payment details and status
- Used by: Payment callback page

**`app/api/webhooks/paystack/route.ts`**
- Receives: webhook from Paystack (automatic)
- Verifies webhook signature
- Updates order status to "paid"
- Updates order with payment reference
- No manual action needed

### Frontend Components

**`PaystackPaymentButton.tsx`**
- React component for payment button
- Handles amount conversion (Naira → Kobo)
- Shows loading state
- Error handling
- Redirects to Paystack checkout

**`payment-callback/page.tsx`**
- Shows payment status (success/error)
- Displays order details and reference
- Auto-redirects to order confirmation
- Fallback error handling

## Quick Reference

```bash
# Start dev server
npm run dev

# View logs in browser console
console.log("Payment reference:", reference);

# Test card (always succeeds in test mode)
4111 1111 1111 1111

# Paystack Dashboard
https://dashboard.paystack.com

# API Reference
https://paystack.com/docs/api/
```

## Next Phase: Production Setup

When ready to go live:

1. Create live account in Paystack
2. Get live credentials
3. Update `.env.production`
4. Find your server IP: `curl ifconfig.me`
5. Whitelist IP in Paystack Dashboard
6. Deploy with live keys
7. Monitor transactions in Paystack dashboard

## Support & Resources

- **Paystack Docs**: https://paystack.com/docs
- **API Reference**: https://paystack.com/docs/api/
- **Test Cards**: https://paystack.com/docs/test-cards/
- **ngrok** (for webhook testing): https://ngrok.com

---

**You're all set!** 🎉

Start with `PAYSTACK_QUICK_START.md` and follow the steps.
