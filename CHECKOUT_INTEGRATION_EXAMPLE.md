# Integration Example: Adding Paystack to Checkout Page

This shows how to integrate Paystack into your existing checkout page.

## Current Checkout Flow

Your checkout page likely has:
1. Order summary (products + total)
2. Buyer information
3. Payment method selection
4. Order placement button

## Updated Checkout Flow with Paystack

### Step 1: Import the Payment Component

```tsx
import { PaystackPaymentButton } from "@/app/components/PaystackPaymentButton";
```

### Step 2: Create Order First

Before showing the payment button, create the order:

```tsx
const handleCreateOrder = async () => {
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerId: buyer.id,
        items: cart,
        total: cartTotal,
        shippingAddress: shippingData,
        // ... other order data
      }),
    });

    const order = await response.json();
    setOrderId(order._id);
    setShowPaymentButton(true);
  } catch (err) {
    console.error("Failed to create order:", err);
  }
};
```

### Step 3: Show Payment Button

```tsx
{showPaymentButton && (
  <PaystackPaymentButton
    email={buyer.email}
    amount={cartTotal} // in Naira
    orderId={orderId}
    onPaymentSuccess={(reference) => {
      console.log("✅ Payment successful:", reference);
      // Optional: redirect to confirmation
      router.push(`/order-confirmation?reference=${reference}`);
    }}
    onPaymentError={(error) => {
      console.log("❌ Payment error:", error);
      setError(error);
    }}
  />
)}
```

## Full Checkout Page Example

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuyer } from "@/app/context/BuyerContext";
import { useCart } from "@/app/components/CartContext";
import { PaystackPaymentButton } from "@/app/components/PaystackPaymentButton";

export default function CheckoutPage() {
  const router = useRouter();
  const { buyer } = useBuyer();
  const { cart, calculateTotal } = useCart();

  const [orderId, setOrderId] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cartTotal = calculateTotal();

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create order on backend
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: buyer.id,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: cartTotal,
          status: "pending", // will become "paid" after payment
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const order = await orderResponse.json();
      setOrderId(order._id);
      setShowPayment(true);
      
    } catch (err: any) {
      setError(err.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  if (!buyer) {
    return <div>Please log in to checkout</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {!showPayment ? (
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {/* Order Summary */}
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₦{(item.price * item.quantity).toLocaleString("en-NG")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 font-bold text-lg">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>₦{cartTotal.toLocaleString("en-NG")}</span>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg"
            >
              {loading ? "Processing..." : "Continue to Payment"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700">Order created successfully!</p>
              <p className="text-sm text-green-600">Order ID: {orderId}</p>
            </div>

            {/* Paystack Payment Button */}
            <PaystackPaymentButton
              email={buyer.email}
              amount={cartTotal}
              orderId={orderId}
              onPaymentSuccess={(reference) => {
                console.log("✅ Payment successful:", reference);
                // Clear cart and redirect
                router.push(`/order-confirmation?orderId=${orderId}&reference=${reference}`);
              }}
              onPaymentError={(error) => {
                setError(error);
                setShowPayment(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

## Webhook Handling (Automatic)

The webhook endpoint (`/api/webhooks/paystack`) automatically:
1. Receives payment confirmation from Paystack
2. Verifies the signature
3. Updates order status to "paid"
4. Stores payment reference

No additional setup needed - it's automatic!

## Testing the Complete Flow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Log in as buyer and go to checkout**

3. **Fill order details and click "Continue to Payment"**

4. **On Paystack page, use test card:**
   - Card: 4111 1111 1111 1111
   - Expiry: 01/25
   - CVV: 123
   - OTP: 123456

5. **Payment processes → webhook triggers → order updates → redirect to confirmation**

## Order Status Flow

```
┌─────────┐
│ Cart    │
└────┬────┘
     │
     ▼
┌──────────────────┐
│ Order Created    │◄── Status: "pending"
│ (POST /orders)   │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Paystack Payment │◄── User enters card details
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Webhook Received │◄── Paystack confirms
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Order Updated    │◄── Status: "paid"
│ (PUT /orders)    │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Confirmation     │
│ Page Shown       │
└──────────────────┘
```

## Debugging Tips

### Check Order was Created
```bash
# In browser console
const orders = await fetch("/api/orders").then(r => r.json());
console.log(orders);
```

### Check Payment Reference
```bash
# In browser console
// After payment callback
const params = new URLSearchParams(window.location.search);
console.log("Reference:", params.get("reference"));
```

### View Paystack Logs
1. Go to Paystack Dashboard
2. Click "Logs" → "Webhooks"
3. See all webhook events and responses

### View App Logs
Check Next.js dev server console for:
- "✅ Paystack payment initialized"
- "✅ Order updated to PAID"
- Any error messages

## Additional Features to Add Later

- [ ] Email receipts after payment
- [ ] Payment history in buyer dashboard
- [ ] Refund processing
- [ ] Multiple payment methods (Flutterwave, Stripe, etc.)
- [ ] Installment payments (Paystack Split API)
- [ ] Invoice PDF download
