# Paystack Setup - Quick Start

## Step 1: Add Environment Variables

Open `.env.local` and add these lines:

```env
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_afcc9e28bd9e9cd4e2b9461b9416f9653b31144e
PAYSTACK_SECRET_KEY=sk_test_4f825c56bae8506135465d036bbdedfa1d31c77b
```

**Note:** After restarting dev server, environment variables take effect.

## Step 2: Update Checkout Page

In your checkout page (`app/checkout/page.tsx`), import and use the payment button:

```tsx
import { PaystackPaymentButton } from "@/app/components/PaystackPaymentButton";

export default function CheckoutPage() {
  const { buyer } = useBuyer(); // or get from context
  const { cart, total } = useCart(); // or get from context

  return (
    <div>
      {/* ... other checkout content ... */}
      
      <PaystackPaymentButton
        email={buyer.email}
        amount={total} // in Naira
        orderId={orderId}
        onPaymentSuccess={(reference) => {
          console.log("Payment successful:", reference);
          // Handle success
        }}
        onPaymentError={(error) => {
          console.log("Payment error:", error);
          // Handle error
        }}
      />
    </div>
  );
}
```

## Step 3: Test Payment

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Go to checkout page and click "Pay" button

3. On Paystack payment page, use test card:
   ```
   Card Number: 4111 1111 1111 1111
   Expiry: 01/25
   CVV: 123
   OTP: 123456
   ```

4. After payment, you'll be redirected to `/checkout/payment-callback?reference=...`

## Step 4: API Endpoints Available

### Initialize Payment
```
POST /api/payments/paystack/initialize
Body: {
  "email": "customer@example.com",
  "amount": 50000,  // in kobo (Naira × 100)
  "orderId": "ORDER123"
}
```

### Verify Payment
```
GET /api/payments/paystack/verify?reference=ref_xyz
```

### Webhook (Paystack → Your App)
```
POST /api/webhooks/paystack
```

## IP Whitelisting: Do You Need It?

### Test Mode (Current)
- ✅ NO IP whitelisting needed
- Test credentials work from any IP (localhost, ngrok, etc.)
- Perfect for development

### Production
- ✅ YES, you should whitelist your server IP
- How to: Go to Paystack Dashboard → Settings → API Keys & Webhooks → IP Whitelist
- Add your server's public IP

Your server's IP can be found:
```bash
# On your server
curl ifconfig.me
```

## Webhook Testing (Local Development)

If you want to test webhooks locally:

### Using ngrok (Free)

1. Download ngrok: https://ngrok.com/download

2. In terminal:
   ```bash
   ngrok http 3000
   ```

3. You'll see:
   ```
   Forwarding → http://localhost:3000
   URL: https://xxxxx.ngrok.io
   ```

4. Add webhook in Paystack Dashboard:
   - Go to Settings → API Keys & Webhooks
   - Add Webhook URL: `https://xxxxx.ngrok.io/api/webhooks/paystack`

5. Copy Webhook Secret and add to `.env.local`:
   ```env
   PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx
   ```

## Testing Checklist

- [ ] Added `.env.local` variables
- [ ] Dev server running (`npm run dev`)
- [ ] Visited checkout page
- [ ] Clicked "Pay ₦..." button
- [ ] Redirected to Paystack checkout
- [ ] Entered test card details
- [ ] Payment successful
- [ ] Redirected to callback page

## Common Issues

| Issue | Solution |
|-------|----------|
| "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is undefined" | Restart dev server after adding `.env.local` |
| "Invalid public key" | Check public key is correct in `.env.local` |
| "Payment page shows error" | Verify test credentials are active in Paystack dashboard |
| "Webhook not working" | Use ngrok to expose local server for webhook testing |

## Next Steps

1. ✅ Complete testing with test credentials
2. Get live credentials from Paystack (when production-ready)
3. Update `.env.local` with live keys
4. Test end-to-end with real payments
5. Monitor Paystack dashboard for payment confirmations

## Resources

- Full Paystack Documentation: https://paystack.com/docs
- This Project's Integration: See `PAYSTACK_INTEGRATION.md`
- API Endpoints Created:
  - `app/api/payments/paystack/initialize/route.ts`
  - `app/api/payments/paystack/verify/route.ts`
  - `app/api/webhooks/paystack/route.ts`
  - `app/components/PaystackPaymentButton.tsx`
  - `app/checkout/payment-callback/page.tsx`
