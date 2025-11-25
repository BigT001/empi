# Cart Page Integration Guide

## Step-by-Step Integration into `/app/cart/page.tsx`

### Step 1: Find the Current DeliverySelector
Search for this line in your cart page:

```typescript
import DeliverySelector from '@/app/components/DeliverySelector';
```

### Step 2: Replace the Import
Change it to:

```typescript
import EnhancedDeliverySelector from '@/app/components/EnhancedDeliverySelector';
```

### Step 3: Find the Component Usage
Look for where DeliverySelector is being used (usually in the JSX):

```typescript
<DeliverySelector 
  onChange={handleDeliveryChange}
/>
```

### Step 4: Replace the Component
Change it to:

```typescript
<EnhancedDeliverySelector 
  items={cartItems}
  onDeliveryChange={handleDeliveryChange}
/>
```

### Step 5: Update the Handler (if needed)
Make sure your handler accepts the DeliveryQuote object:

```typescript
const handleDeliveryChange = (deliveryQuote: DeliveryQuote) => {
  setSelectedDelivery(deliveryQuote);
  // Update cart total with delivery fee
  updateCartTotal(cartItems, deliveryQuote.fee);
};
```

---

## Full Example Cart Page Structure

```typescript
'use client';

import { useState } from 'react';
import EnhancedDeliverySelector from '@/app/components/EnhancedDeliverySelector';
import { DeliveryQuote } from '@/app/lib/deliveryCalculator';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([...]);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);

  const handleDeliveryChange = (quote: DeliveryQuote) => {
    setDeliveryQuote(quote);
  };

  const itemsTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryQuote?.fee || 0;
  const tax = (itemsTotal + deliveryFee) * 0.1;
  const total = itemsTotal + deliveryFee + tax;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {/* Cart Items */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 pb-4 border-b">
              <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">₦{item.price.toLocaleString()}</p>
                <p className="text-sm">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary with Delivery */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            {/* Delivery Selector - THIS IS THE KEY PART */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Delivery Options</h3>
              <EnhancedDeliverySelector 
                items={cartItems}
                onDeliveryChange={handleDeliveryChange}
              />
            </div>

            {/* Order Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Items Total:</span>
                <span>₦{itemsTotal.toLocaleString()}</span>
              </div>
              
              {deliveryQuote && (
                <div className="flex justify-between border-t pt-2">
                  <span>Delivery Fee:</span>
                  <span>₦{deliveryQuote.fee.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>₦{Math.round(tax).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>₦{Math.round(total).toLocaleString()}</span>
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## What EnhancedDeliverySelector Returns

The component passes a `DeliveryQuote` object with this structure:

```typescript
{
  fee: 3936,                              // Total delivery fee in ₦
  vehicle: "CAR",                         // Selected vehicle type
  zone: "intra_lagos",                    // Delivery zone
  breakdown: {
    zone: "intra_lagos",
    zoneName: "Ojo Pickup Point",         // Pickup point name
    requiredVehicle: "CAR",
    baseDeliveryFee: 3000,                // Base fee
    vehicleFee: 260,                      // Distance-based fee
    sizeFee: 0,
    subtotal: 3260,
    modifiers: [],
    total: 3936,
    estimatedDays: {
      min: 0.01,                          // Min days
      max: 0.02                           // Max days
    },
    breakdown: {
      zone: "intra_lagos",
      vehicle: "CAR",
      size: "MEDIUM",
      modifiers: ["Fragile", "Rush"]
    }
  },
  estimatedDays: {
    min: 0.01,
    max: 0.02
  },
  warnings: [],
  recommendations: []
}
```

---

## How to Access Delivery Info in Checkout

In your checkout page (`/app/checkout/page.tsx`), you can display delivery details:

```typescript
import { DeliveryQuote } from '@/app/lib/deliveryCalculator';

export default function CheckoutPage() {
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);

  // Get from cart state or session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('deliveryQuote');
    if (stored) {
      setDeliveryQuote(JSON.parse(stored));
    }
  }, []);

  return (
    <div>
      {/* ... payment form ... */}

      {deliveryQuote && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-3">📍 Delivery Details</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Pickup Point:</span> {deliveryQuote.breakdown.zoneName}
            </p>
            <p>
              <span className="font-medium">Vehicle:</span> {deliveryQuote.vehicle}
            </p>
            <p>
              <span className="font-medium">Estimated Delivery:</span> 
              {' '}{Math.round(deliveryQuote.estimatedDays.min * 24 * 60)}-{Math.round(deliveryQuote.estimatedDays.max * 24 * 60)} minutes
            </p>
            <p className="font-semibold text-blue-600 text-base">
              Delivery Fee: ₦{deliveryQuote.fee.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Order total including delivery */}
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <div className="flex justify-between font-bold text-lg">
          <span>Order Total:</span>
          <span>₦{(orderTotal + (deliveryQuote?.fee || 0)).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing the Integration

### 1. After Integration
- [ ] Cart page loads without errors
- [ ] EnhancedDeliverySelector component displays
- [ ] Location permission prompt appears
- [ ] Map shows with pickup points
- [ ] Delivery fee displays in order summary

### 2. User Interaction
- [ ] User can select vehicle type (Bike/Car/Van)
- [ ] Price updates when vehicle changes
- [ ] User can select pickup point
- [ ] Rush delivery checkbox works
- [ ] Price updates correctly with all selections

### 3. Data Flow
- [ ] DeliveryQuote passed to parent state
- [ ] Fee displayed in order summary
- [ ] DeliveryQuote can be retrieved in checkout
- [ ] All required fields present in quote object

---

## Troubleshooting

### Issue: "Module not found" error
**Solution:** Verify import path is correct:
```typescript
import EnhancedDeliverySelector from '@/app/components/EnhancedDeliverySelector';
```

### Issue: Component doesn't display
**Solution:** Check props are passed correctly:
```typescript
<EnhancedDeliverySelector 
  items={cartItems}                    // Required
  onDeliveryChange={handleDeliveryChange}  // Required
/>
```

### Issue: Delivery fee not updating
**Solution:** Verify handler is updating state:
```typescript
const handleDeliveryChange = (quote: DeliveryQuote) => {
  setDeliveryQuote(quote);  // Must update state
};
```

### Issue: TypeScript errors
**Solution:** Import DeliveryQuote interface:
```typescript
import { DeliveryQuote } from '@/app/lib/deliveryCalculator';
```

### Issue: Geolocation not working
**Solution:** Check browser permissions:
1. Ensure HTTPS in production
2. User must allow location access
3. Check browser geolocation is enabled
4. Look for permission prompt

---

## API Integration

The EnhancedDeliverySelector calls this endpoint internally:

```
POST /api/delivery/calculate-distance
```

You don't need to call it directly - the component handles it automatically!

---

## Next Steps After Integration

1. ✅ Replace component in cart page (this guide)
2. ✅ Test with real coordinates
3. ✅ Display delivery info in checkout
4. ✅ Verify all prices calculate correctly
5. ✅ Deploy to production

---

**That's it! Your Uber-like delivery system is now integrated.**

