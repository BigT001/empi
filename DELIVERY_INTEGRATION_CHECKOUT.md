# EMPI Delivery System - Checkout Integration Guide

## Overview

This guide walks you through integrating the complete delivery system into your existing checkout page.

---

## Current State

Your checkout page currently has:
- ✅ Simple shipping options (EMPI vs Self-Pickup with fixed fees)
- ❌ No dynamic fee calculation
- ❌ No vehicle selection
- ❌ No location-based pricing
- ❌ No delivery tracking

**Goal**: Upgrade to intelligent delivery system with automatic fee calculation.

---

## Integration Process

### Phase 1: Prepare the Components

#### Step 1.1: Update Cart Items Structure

Your current CartItem needs delivery metadata:

**Current**:
```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  mode: "buy" | "rent";
  quantity: number;
}
```

**Updated**:
```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  mode: "buy" | "rent";
  quantity: number;
  // NEW: Delivery metadata
  size?: "small" | "medium" | "large";  // Item size category
  weight?: number;                      // Weight in kg (per unit)
  fragile?: boolean;                    // Requires special handling
}
```

**Where to update**: `/app/components/CartContext.tsx`

#### Step 1.2: Update Product Data

When fetching or creating products, include delivery metadata:

**Before**:
```typescript
const product = {
  name: "Cotton Shirt",
  sellPrice: 5000,
  rentPrice: 500,
  imageUrl: "..."
};
```

**After**:
```typescript
const product = {
  name: "Cotton Shirt",
  sellPrice: 5000,
  rentPrice: 500,
  imageUrl: "...",
  size: "small",
  weight: 0.3,
  fragile: false
};
```

Use the PRODUCT_PRESETS for quick assignment:

```typescript
import { PRODUCT_PRESETS } from "../lib/productModel";

const preset = PRODUCT_PRESETS["shirt"];
// { size: "small", weight: 0.3, fragile: false }

const product = {
  ...baseProductData,
  ...preset  // Spreads size, weight, fragile
};
```

---

### Phase 2: Update Checkout Page

#### Step 2.1: Add Imports

```typescript
// /app/checkout/page.tsx

import { DeliverySelector } from "../components/DeliverySelector";
import { CartItemDelivery } from "../lib/deliveryCalculator";
import { ItemSize } from "../lib/deliverySystem";
```

#### Step 2.2: Add State for Delivery

In your checkout component:

```typescript
export default function CheckoutPage() {
  // ... existing states
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [selectedState, setSelectedState] = useState("");

  // ... rest of component
}
```

#### Step 2.3: Convert Cart Items for Delivery

Add a helper function to convert your cart items to delivery format:

```typescript
function convertCartItemsToDelivery(items: CartItem[]): CartItemDelivery[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    size: (item.size || "medium") as ItemSize,
    weight: item.weight || 1,  // Default 1kg if not specified
    totalWeight: (item.weight || 1) * item.quantity,
    fragile: item.fragile || false,
  }));
}
```

Call it when calculating order:

```typescript
const deliveryItems = convertCartItemsToDelivery(items);
```

#### Step 2.4: Add Delivery Selector to Form

Add the DeliverySelector component to your checkout form section:

```tsx
// In your checkout form JSX:

<div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
  <h2 className="text-2xl font-bold mb-6">Delivery Information</h2>

  {/* NEW: Delivery Selector */}
  <DeliverySelector
    items={deliveryItems}
    state={selectedState}
    onDeliveryChange={(quote) => {
      setDeliveryQuote(quote);
      setDeliveryFee(quote?.fee || 0);
      // Optional: Save to localStorage
      localStorage.setItem("empi_delivery_quote", JSON.stringify(quote));
    }}
    isCheckout={true}
  />
</div>
```

---

### Phase 3: Update Order Summary

#### Step 3.1: Modify Price Breakdown

Replace your fixed shipping fee with dynamic delivery fee:

**Before**:
```tsx
const shippingCost = SHIPPING_OPTIONS[shippingOption].cost;
const taxEstimate = total * 0.075;
const totalAmount = total + shippingCost + taxEstimate;

// Display:
<div className="flex justify-between text-sm">
  <span>Shipping ({shippingOption === "empi" ? "EMPI" : "Pickup"})</span>
  <span>{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
</div>
```

**After**:
```tsx
// Use delivery fee from quote instead
const shippingCost = deliveryFee || 0;
const taxEstimate = total * 0.075;
const totalAmount = total + shippingCost + taxEstimate;

// Display:
<div className="flex justify-between text-sm">
  <span>
    Delivery
    {deliveryQuote && (
      <span className="text-xs text-gray-600 ml-2">
        ({deliveryQuote.breakdown.requiredVehicle})
      </span>
    )}
  </span>
  <span>{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
</div>
```

#### Step 3.2: Add Delivery Details to Summary

Show delivery details in your order summary:

```tsx
{deliveryQuote && (
  <div className="bg-blue-50 rounded-lg p-4 mt-4 border border-blue-200">
    <h4 className="font-semibold text-gray-900 mb-2">Delivery Details</h4>
    <div className="space-y-1 text-sm text-gray-700">
      <p>Zone: {deliveryQuote.breakdown.zoneName}</p>
      <p>Vehicle: {deliveryQuote.vehicle}</p>
      <p>
        Estimated Delivery: {deliveryQuote.estimatedDays.min}-
        {deliveryQuote.estimatedDays.max} days
      </p>
    </div>
  </div>
)}
```

---

### Phase 4: Update Form Handling

#### Step 4.1: Add State Field

Your form needs to capture buyer's state:

```typescript
interface FormData {
  // ... existing fields
  state: string;  // NEW: Buyer's state
  city?: string;
  address: string;
  phoneNumber: string;
  // ... rest
}

// In form:
<select
  name="state"
  value={formData.state}
  onChange={handleInputChange}
  required
  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
>
  <option value="">Select your state...</option>
  {ALL_AVAILABLE_STATES.map(state => (
    <option key={state} value={state}>{state}</option>
  ))}
</select>
```

#### Step 4.2: Update Form Submission

When submitting checkout form:

```typescript
async function handleCheckout() {
  // Validate delivery quote
  if (!deliveryQuote) {
    alert("Please select a delivery state");
    return;
  }

  // Prepare order data
  const orderData = {
    items: items,
    delivery: {
      zone: deliveryQuote.zone,
      vehicle: deliveryQuote.vehicle,
      fee: deliveryQuote.fee,
      estimatedDays: deliveryQuote.estimatedDays,
      status: "PENDING",
      state: selectedState,
      address: formData.address,
      phoneNumber: formData.phoneNumber,
    },
    buyer: {
      email: formData.email,
      name: formData.fullName,
      state: formData.state,
      address: formData.address,
      phone: formData.phoneNumber,
    },
    subtotal: total,
    deliveryFee: deliveryFee,
    tax: taxEstimate,
    totalAmount: total + deliveryFee + taxEstimate,
  };

  // Save to database
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });

  const order = await response.json();

  // Redirect to payment or tracking
  router.push(`/order/${order._id}`);
}
```

---

### Phase 5: Create Backend Endpoints

#### Step 5.1: Delivery Calculation Endpoint

```typescript
// /app/api/delivery/calculate/route.ts

import { calculateDeliveryFee } from "@/app/lib/deliveryCalculator";

export async function POST(req: Request) {
  try {
    const { state, items, options } = await req.json();

    if (!state || !items || items.length === 0) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const quote = calculateDeliveryFee(state, items, options);

    if (!quote) {
      return Response.json(
        { error: "Delivery not available to this location" },
        { status: 400 }
      );
    }

    return Response.json(quote);
  } catch (error) {
    console.error("Delivery calculation error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Step 5.2: Order Creation with Delivery

```typescript
// /app/api/orders/route.ts

import Order from "@/app/models/Order";

export async function POST(req: Request) {
  try {
    const orderData = await req.json();

    const order = new Order({
      items: orderData.items,
      delivery: {
        zone: orderData.delivery.zone,
        vehicle: orderData.delivery.vehicle,
        fee: orderData.delivery.fee,
        estimatedDays: orderData.delivery.estimatedDays,
        status: "PENDING",
        state: orderData.delivery.state,
        address: orderData.delivery.address,
        timeline: [
          {
            status: "PENDING",
            timestamp: new Date(),
            location: "EMPI Warehouse",
          },
        ],
      },
      buyer: orderData.buyer,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      tax: orderData.tax,
      total: orderData.totalAmount,
      status: "PENDING_PAYMENT",
      createdAt: new Date(),
    });

    await order.save();

    return Response.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    return Response.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
```

---

### Phase 6: Complete Example

Here's a complete, updated checkout page structure:

```tsx
"use client";

import { useState, useEffect } from "react";
import { DeliverySelector } from "../components/DeliverySelector";
import { useCart } from "../components/CartContext";
import { CartItemDelivery } from "../lib/deliveryCalculator";
import { ALL_AVAILABLE_STATES } from "../lib/deliverySystem";

export default function CheckoutPage() {
  const { items, total } = useCart();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
  });

  // Delivery state
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || items.length === 0) return null;

  // Convert cart items to delivery format
  const deliveryItems: CartItemDelivery[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    size: (item.size || "medium") as any,
    weight: item.weight || 1,
    totalWeight: (item.weight || 1) * item.quantity,
    fragile: item.fragile || false,
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeliveryChange = (quote: any) => {
    setDeliveryQuote(quote);
    setDeliveryFee(quote?.fee || 0);
  };

  const taxEstimate = total * 0.075;
  const finalTotal = total + deliveryFee + taxEstimate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryQuote) {
      alert("Please select a delivery location");
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        items: items,
        delivery: {
          zone: deliveryQuote.zone,
          vehicle: deliveryQuote.vehicle,
          fee: deliveryQuote.fee,
          estimatedDays: deliveryQuote.estimatedDays,
          status: "PENDING",
          state: formData.state,
          address: formData.address,
        },
        buyer: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          state: formData.state,
          address: formData.address,
        },
        subtotal: total,
        deliveryFee: deliveryFee,
        tax: taxEstimate,
        totalAmount: finalTotal,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Order creation failed");

      const order = await response.json();
      
      // Redirect to payment
      window.location.href = `/checkout/payment?orderId=${order._id}`;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Buyer Information */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
              <form className="space-y-4">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </form>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Delivery Information</h2>
              <form className="space-y-4 mb-6">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select your state...</option>
                  {ALL_AVAILABLE_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="address"
                  placeholder="Delivery Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </form>

              {/* Delivery Selector Component */}
              <DeliverySelector
                items={deliveryItems}
                state={formData.state}
                onDeliveryChange={handleDeliveryChange}
                isCheckout={true}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? "Pending" : `₦${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (7.5%)</span>
                  <span className="font-semibold">₦{taxEstimate.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold mb-6 pb-6 border-b border-gray-200">
                <span>Total</span>
                <span className="text-lime-600">₦{finalTotal.toLocaleString()}</span>
              </div>

              {deliveryQuote && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200 text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{deliveryQuote.breakdown.zoneName}</p>
                  <p>Vehicle: {deliveryQuote.vehicle}</p>
                  <p>
                    ETA: {deliveryQuote.estimatedDays.min}-{deliveryQuote.estimatedDays.max} days
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading || !deliveryQuote}
                className="w-full bg-lime-600 hover:bg-lime-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
              >
                {isLoading ? "Processing..." : "Proceed to Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Select Lagos state → See bike option with low fee
- [ ] Select far state → See van option with higher fee
- [ ] Select multiple large items → See vehicle upgrade
- [ ] Try rush delivery option → See fee increase
- [ ] Add fragile item → See fragile modifier fee
- [ ] Submit form → Order created with delivery info
- [ ] Check database → Order has delivery details
- [ ] Try tracking → See timeline from API

---

## Troubleshooting

### Issue: "No delivery available"
- Check if state is in STATE_TO_ZONE mapping
- Verify zone is marked as "active"
- Check vehicle availability for zone

### Issue: Fee looks wrong
- Verify item weights are set correctly
- Check distance calculation (default 10km)
- Validate vehicle selection logic
- Review modifiers being applied

### Issue: DeliverySelector not showing
- Ensure items array is not empty
- Check that state is a valid string
- Verify imports are correct
- Check browser console for errors

---

## Next: Order Tracking

Once orders are created with delivery info, create a tracking page:

```tsx
// /app/order/[id]/page.tsx

import { DeliveryTracker } from "@/app/components/DeliveryTracker";

export default function OrderPage({ params }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(setOrder);
  }, [params.id]);

  if (!order) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <DeliveryTracker
        tracking={order.delivery}
        onContact={(partner) => {
          window.location.href = `tel:${partner.phone}`;
        }}
      />
    </div>
  );
}
```

---

**Status**: Ready to Implement
**Difficulty**: Medium
**Time**: 2-4 hours
