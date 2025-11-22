# Paystack Integration Guide

## Overview
This guide explains how to integrate Paystack payment gateway into the EMPI project for handling customer payments.

## Test Credentials
```
Test Secret Key: sk_test_4f825c56bae8506135465d036bbdedfa1d31c77b
Test Public Key: pk_test_afcc9e28bd9e9cd4e2b9461b9416f9653b31144e
```

## Step 1: Add Environment Variables

Add these to your `.env.local` file:

```env
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_afcc9e28bd9e9cd4e2b9461b9416f9653b31144e
PAYSTACK_SECRET_KEY=sk_test_4f825c56bae8506135465d036bbdedfa1d31c77b
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_key_here
```

**Note:** 
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is prefixed with `NEXT_PUBLIC_` because it's used in the frontend (browser)
- `PAYSTACK_SECRET_KEY` is kept private and only used on the backend (server-side)
- Get your webhook secret from Paystack dashboard under Webhooks

## Step 2: IP Whitelisting (Optional but Recommended)

### Do you need to add an IP?
**For Local Development:** No IP whitelisting needed in test mode. Test credentials work from any IP.

**For Production:** Yes, you should whitelist your server IP in Paystack dashboard.

### How to whitelist IP on Paystack:
1. Log in to your Paystack account (https://dashboard.paystack.com)
2. Go to **Settings > API Keys & Webhooks**
3. Look for **"IP Whitelist"** section
4. Click **"Add New IP"** and enter your server IP
5. Your server's public IP can be found with `curl ifconfig.me` (on server terminal)

For now, skip this - test credentials don't require IP whitelisting.

## Step 3: Webhook Configuration

### What are Webhooks?
Webhooks allow Paystack to notify your app when payments are completed.

### Set up webhook in Paystack dashboard:
1. Log in to Paystack dashboard
2. Go to **Settings > API Keys & Webhooks**
3. Scroll to **Webhooks** section
4. Click **Add Webhook URL**
5. Enter your webhook endpoint: `https://yourdomain.com/api/webhooks/paystack`
   - For local testing: use ngrok to expose your local server (see Testing section below)
6. Copy the **Webhook Secret** and add it to `.env.local` as `PAYSTACK_WEBHOOK_SECRET`

## Step 4: API Endpoints

### Create Payment Endpoint
File: `app/api/payments/paystack/route.ts`

This endpoint initializes a Paystack payment transaction.

### Webhook Endpoint
File: `app/api/webhooks/paystack/route.ts`

This endpoint receives payment confirmation from Paystack.

## Step 5: Frontend Integration

### Install Paystack React SDK
```bash
npm install @paystack/inline-js
# or if using a React wrapper
npm install react-paystack
```

### Usage in Checkout Page
```tsx
import { usePaystackPayment } from 'react-paystack';

// Initialize payment
const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const initializePayment = usePaystackPayment();

const config = {
  reference: new Date().getTime().toString(),
  email: buyerEmail,
  amount: totalAmount * 100, // Paystack expects amount in kobo (100 kobo = 1 naira)
  publicKey: publicKey,
};

const onSuccess = (reference) => {
  // Verify payment on backend
  // Update order status to paid
};

const onClose = () => {
  // Handle payment cancellation
};

// Trigger payment
initializePayment(config, onSuccess, onClose);
```

## Step 6: Amount Format

**Important:** Paystack expects amounts in **kobo** (smallest currency unit):
- 1 Naira = 100 kobo
- So: amount in Naira × 100 = amount in kobo

Example:
```javascript
const amountInNaira = 50000; // ₦50,000
const amountInKobo = amountInNaira * 100; // 5,000,000 kobo
```

## API Reference

### Initialize Transaction (Backend)
```bash
POST /api/payments/paystack/initialize
Content-Type: application/json

{
  "email": "customer@example.com",
  "amount": 5000000,  // in kobo
  "orderId": "ORDER123",
  "metadata": {
    "custom_fields": [
      {
        "display_name": "Order ID",
        "variable_name": "order_id",
        "value": "ORDER123"
      }
    ]
  }
}
```

Response:
```json
{
  "status": true,
  "message": "Authorization URL created",
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "xyz",
    "reference": "ref_123"
  }
}
```

### Verify Transaction (Backend)
```bash
GET /api/payments/paystack/verify?reference=ref_123
```

## Testing Paystack

### Test Cards
```
Card Number: 4111 1111 1111 1111
Expiry: 01/25
CVV: 123
OTP: 123456
```

### Local Testing with ngrok
If you need to test webhooks locally:

1. Install ngrok: https://ngrok.com
2. Start ngrok:
   ```bash
   ngrok http 3000
   ```
3. Your local app is now accessible at: `https://xxxxx.ngrok.io`
4. Add webhook URL in Paystack: `https://xxxxx.ngrok.io/api/webhooks/paystack`

## Implementation Checklist

- [ ] Add `.env.local` variables
- [ ] Create payment initialization endpoint
- [ ] Create webhook verification endpoint
- [ ] Install Paystack SDK package
- [ ] Add Paystack payment UI to checkout page
- [ ] Test with test credentials
- [ ] Verify webhook events
- [ ] Set up payment success/failure handlers
- [ ] For production: whitelist IP and update credentials

## Common Issues

### "Invalid public key"
- Check that `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is correct
- Verify it's in `.env.local`
- Restart dev server after adding env vars

### "Reference not found" (webhook error)
- Ensure webhook endpoint is publicly accessible
- Check webhook secret matches in `.env.local`
- Verify HMAC signature verification is correct

### "Amount too small" or "Amount too large"
- Remember to multiply amount by 100 (Naira to kobo conversion)
- Check Paystack limits: min 100 kobo (₦1), max varies by account

## Resources

- Paystack Docs: https://paystack.com/docs
- API Reference: https://paystack.com/docs/api/
- ngrok: https://ngrok.com
- React Paystack: https://github.com/ifeoluwanimie/react-paystack

## Next Steps

1. Add test credentials to `.env.local`
2. Create payment endpoints (see implementation files below)
3. Update checkout page with payment UI
4. Test with test cards
5. When ready for production, swap test keys with live keys
