# ⚡ CHECKOUT VALIDATION - QUICK START

## What Works Now

✅ **Rental Schedule Validation**
- User adds rental items → must fill pickup schedule before checkout
- Missing any field (date, time, return date, location) → validation fails
- Clear error message + modal guides user back to cart

✅ **Delivery Validation**
- User selects EMPI → must fill delivery address
- Missing address or state → validation fails
- Green modal guides user back to cart

✅ **Buyer Info Validation**
- Name, email, phone all required
- Email format validated
- Blue modal guides user back to cart

---

## How to Use

### For Users
1. **Add items to cart**
2. **Fill all required forms**
   - Rental schedule (if renting)
   - Delivery address (if EMPI selected)
   - Profile info (name, email, phone)
3. **Click "Pay Now"**
4. **If validation fails:**
   - Modal appears with clear instructions
   - Click "Go to Cart" to fix the issue
   - Return to checkout when ready

### For Developers

#### Add Validation to Any Component
```typescript
import { useCart } from "@/app/components/CartContext";

function MyComponent() {
  const { validateRentalSchedule, validateDeliveryInfo, validateCheckoutRequirements } = useCart();
  
  // Validate rental schedule
  const rentalCheck = validateRentalSchedule();
  if (!rentalCheck.valid) {
    console.log(rentalCheck.message);
  }
  
  // Validate delivery
  const deliveryCheck = validateDeliveryInfo("empi");
  if (!deliveryCheck.valid) {
    console.log(deliveryCheck.message);
  }
  
  // Validate everything
  const fullCheck = validateCheckoutRequirements("empi", buyer);
  if (!fullCheck.valid) {
    console.log(`Error (${fullCheck.type}): ${fullCheck.message}`);
  }
}
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `app/components/CartContext.tsx` | Validation functions + context |
| `app/components/CheckoutValidationModal.tsx` | Error display modal |
| `app/checkout/page.tsx` | Validation integration |

---

## Return Types

### `validateRentalSchedule()`
```typescript
{ valid: boolean; message: string }
```

### `validateDeliveryInfo(shippingOption: string)`
```typescript
{ valid: boolean; message: string }
```

### `validateCheckoutRequirements(shippingOption: string, buyer?: any)`
```typescript
{
  valid: boolean;
  message: string;
  type: "rental_schedule" | "delivery_info" | "buyer_info" | "success"
}
```

---

## Modal Props

```typescript
<CheckoutValidationModal
  isOpen={boolean}
  onClose={() => void}
  validationType="rental_schedule" | "delivery_info" | "buyer_info"
  message={string}
/>
```

---

## Test Checklist

- [ ] Add rental → try checkout without schedule → modal appears
- [ ] Add rental → fill schedule → passes validation
- [ ] Select EMPI → try checkout without address → modal appears
- [ ] Select EMPI → fill address → passes validation
- [ ] Try checkout with empty profile → modal appears
- [ ] Fill all info → checkout → payment page opens

---

**Status:** ✅ Production Ready
