# 📊 Checkout Page Features Summary - Quick Reference

## Page Overview

**Location:** `/app/checkout/page.tsx`  
**Total Lines:** 1,074  
**Type:** Client Component with Context  
**Purpose:** Order review and payment processing  

---

## Main Sections (In Display Order)

### 1. **Page Header**
- Icon: CreditCard (gradient purple-blue box)
- Title: "Order Review" (4xl bold gradient)
- Subtitle: "Step 2 of 2 - Review and Pay"
- Always visible

### 2. **Order Items**
- Lists all cart items with mode badges (Rental/Buy)
- Shows quantity and price
- Price calculation: `price × qty × days` (rental) or `price × qty` (buy)
- Always visible if items exist

### 3. **Custom Order Details** (Quote Mode Only)
- Shows product image from database
- Order number, customer name
- Full description text
- Quantity and location (city, state)
- Contact info (email, phone)
- Grid layout: Image (left) + Details (right)
- Condition: `{isFromQuote && customOrderDetails}`

### 4. **Custom Order Quote** (Quote Mode Only)
- Unit price with quantity multiplier
- Discount (if applicable) with percentage
- VAT (7.5%)
- Total amount (large, gradient display)
- Lime/green color scheme
- Condition: `{isFromQuote && customOrderQuote}`

### 5. **Rental Schedule** (If Rentals Exist)
- Pickup date and time
- Return date
- Rental duration
- Purple/pink color scheme
- Condition: `{rentalSchedule && items.some(i => i.mode === 'rent')}`

### 6. **Delivery Information** (If EMPI Delivery)
- Distance in km
- Estimated delivery time
- Delivery address
- Green/emerald color scheme
- Condition: `{shippingOption === "empi" && deliveryQuote}`

### 7. **Billing Information**
- Customer name (or "Guest Customer")
- Email (or "Not provided")
- Phone (or "Not provided")
- Always visible

### 8. **Error Message** (Conditional)
- Red alert box with AlertCircle icon
- Shows payment errors
- Condition: `{orderError}`

### 9. **Action Buttons**
- **Back to Cart:** Gray button linking to `/cart`
- **Pay:** Gradient purple-blue button with payment logic
- Shows total amount: `Pay ₦{totalAmount.toLocaleString()}`
- Shows spinner when processing

---

## Sidebar (Sticky on Desktop)

### Order Summary (Regular Mode)
```
📦 Items Breakdown
   ├─ Each item name, qty, price
   └─ Mode-specific calculation shown

💰 Subtotal
   └─ ₦{total}

🎉 Bulk Discount (if applicable)
   ├─ Percentage and amount
   ├─ Applied on X buy items
   └─ Subtotal after discount

🛡️ Caution Fee (if rentals)
   ├─ 50% of rental total
   └─ Applied on rental items

🚚 Shipping
   ├─ EMPI Delivery (₦2,500) OR Self Pickup (FREE)
   └─ Shows selected option

📊 VAT (7.5%)
   └─ ₦{taxEstimate}

💳 TOTAL AMOUNT
   └─ ₦{totalAmount} (large gradient text)

✅ Status
   └─ Ready for Payment
```

### Order Summary (Quote Mode)
```
📋 Quote Details
   ├─ Order Number
   └─ Quantity

💰 Pricing Breakdown
   ├─ Unit Price: ₦{quotedPrice} × {qty}
   ├─ Discount (if any): -{₦discountAmount}
   └─ VAT (7.5%): ₦{quotedVAT}

💳 TOTAL AMOUNT
   └─ ₦{quotedTotal} (large gradient text)

✅ Status
   └─ Ready for Payment
```

### Security Badge
- Lock icon (green)
- "SECURE PAYMENT"
- Message about encryption and Paystack

---

## Key Calculations

| Calculation | Formula | When Applied |
|-------------|---------|--------------|
| **Rental Total** | `price × qty × days` | For rental items only |
| **Caution Fee** | `rentalTotal × 0.5` | If rentals exist |
| **Buy Subtotal** | `price × qty` | For buy items only |
| **Bulk Discount** | `buySubtotal × discount%` | 10% (10+), 7% (6-9), 5% (3-5) items |
| **Subtotal for VAT** | `buySubAfterDiscount + rentalTotal` | Always (excludes caution fee) |
| **VAT Amount** | `subtotalForVAT × 0.075` | 7.5% tax |
| **Subtotal with Caution** | `subtotalForVAT + cautionFee` | Display purposes |
| **Total Order** | `subtotalWithCaution + shipping + tax` | Final payment amount |

---

## State Management

**From Context:**
- `items` - Cart items with price, quantity, mode
- `total` - Subtotal
- `rentalSchedule` - Pickup/return dates
- `deliveryQuote` - Distance, duration, address
- `buyer` - Customer info (name, email, phone)

**Local State:**
- `shippingOption` - "empi" or "self"
- `isFromQuote` - Is this a quote order?
- `customOrderQuote` - Quote data from chat
- `customOrderDetails` - Full order details
- `loadingCustomOrder` - Loading state
- `successModalOpen` - Show success?
- `isProcessing` - Processing payment?
- `orderError` - Error message
- Plus validation states and payment states

---

## API Calls

| Endpoint | Method | When | Purpose |
|----------|--------|------|---------|
| `/api/custom-orders/[id]` | GET | Quote mode | Fetch order details with image |
| `/api/custom-orders/update-payment` | POST | Quote payment | Update status to "paid" |
| `/api/orders` | POST | Regular payment | Save order to database |
| `/api/invoices` | POST | After payment | Generate invoice |
| `/api/verify-payment` | GET | Payment confirmation | Verify Paystack payment |
| `/api/initialize-payment` | POST | Pay click | Initialize Paystack |

---

## Payment Flow

```
User clicks "Pay"
    ↓
Validate requirements (rental schedule, delivery, buyer info)
    ↓ (if invalid → show validation modal, return)
    ↓ (if valid → continue)
Create payment reference: EMPI-{timestamp}-{random}
    ↓
Calculate total amount in Kobo (kobo = naira × 100)
    ↓
Store in localStorage: empi_pending_payment
    ↓
Try Paystack Modal (if available)
    ├─ Success: handlePaymentSuccess()
    └─ Close: verifyAndProcessPayment()
    ↓ (if modal failed, use redirect)
Redirect to Paystack authorization URL
    ↓
User completes payment on Paystack
    ↓
Callback → handlePaymentSuccess()
    ├─ If Quote:
    │  ├─ POST /api/custom-orders/update-payment
    │  ├─ POST /api/invoices (quote invoice)
    │  └─ Remove sessionStorage.customOrderQuote
    └─ If Regular:
       ├─ POST /api/orders (save cart order)
       ├─ POST /api/invoices (regular invoice)
       └─ Clear cart
    ↓
Show PaymentSuccessModal with reference
```

---

## Conditional Rendering Tree

```
if (!isHydrated) return null

if (items.length === 0 && !isFromQuote)
    return <EmptyCartPage>

if (isFromQuote && loadingCustomOrder)
    return <LoadingSpinner>

// Main checkout page renders:

  Main Content:
  ├─ Page Header
  ├─ Order Items (always)
  ├─ Custom Order Details (if isFromQuote && customOrderDetails)
  ├─ Custom Order Quote (if isFromQuote && customOrderQuote)
  ├─ Rental Schedule (if rentalSchedule && has rentals)
  ├─ Delivery Info (if shippingOption="empi" && deliveryQuote)
  ├─ Billing Info (always)
  ├─ Error Message (if orderError)
  └─ Action Buttons (always)

  Sidebar:
  ├─ Order Summary or Quote Summary
  │  ├─ Quote Details (if quote mode)
  │  ├─ Items Breakdown (if regular)
  │  ├─ Discounts/Fees (conditional)
  │  └─ Total & Status
  ├─ Security Badge
```

---

## Mobile-Specific Behavior

- **Auth Modal:** Shows on mobile if user not logged in
- **Layout:** 1-column stack instead of 3-column grid
- **Sidebar:** Moves below content on small screens
- **Buttons:** Full-width on mobile
- **Grid internals:** Responsive classes (md:) adjust on tablet+

---

## Color System Summary

| Type | Regular Order | Quote Order | Rentals | Delivery |
|------|---------------|-------------|---------|----------|
| Section BG | White | Lime-50→Green-50 | Purple-50→Pink-50 | Green-50→Emerald-50 |
| Border | Gray-100 | Lime-300 | Purple-200 | Green-200 |
| Icon Box | Blue-100 | Lime-100 | Purple-100 | Green-100 |
| Text Color | Gray-900 | Gray-900 | Gray-900 | Gray-900 |
| Accent | Purple-600→Blue-600 | Lime-600→Green-600 | Purple-600 | Green-600 |
| Info Box | Gray-50 | White/60 | White/60 | White/60 |

---

## Typography Summary

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page Title | 4xl | bold | gradient |
| Section Header | xl | bold | gray-900 |
| Label | xs | semibold | gray-600 |
| Price | lg/xl | bold | gray-900 or gradient |
| Total Amount | 3xl/4xl | black | gradient |
| Description | sm | regular | gray-700 |
| Subtext | xs/sm | regular | gray-600 |

---

## What to Copy to Dashboard

✅ **Must Copy Exactly:**
1. All state variables (copy the initialization)
2. All useEffect hooks (with exact same logic)
3. All calculation logic (caution fee, discounts, VAT)
4. All conditional renders (same conditions)
5. All sections and their structure
6. All styling classes and gradients
7. All API endpoints and calls
8. All modal interactions
9. Payment flow and validation
10. localStorage/sessionStorage keys

✅ **Can Adjust Slightly:**
- Header component (may be different on dashboard)
- Footer component (may be different on dashboard)
- Context usage (may have different context names)

❌ **Must NOT Change:**
- Calculation logic (keep same)
- Color schemes (keep same)
- Component structure (keep same)
- Responsive breakpoints (keep same)
- Payment logic (keep same)
- State management (keep same)

---

## Testing Checklist

- [ ] All sections visible in correct order
- [ ] Colors and gradients match exactly
- [ ] Calculations are correct
- [ ] Quote mode displays image and details
- [ ] Regular mode shows items and pricing breakdown
- [ ] Rental schedule shows if rentals exist
- [ ] Delivery info shows if EMPI selected
- [ ] Sidebar sticks on desktop
- [ ] Mobile layout stacks vertically
- [ ] Auth modal shows on mobile if not logged in
- [ ] Payment button works and validates
- [ ] Success modal appears after payment
- [ ] Responsive design works at all breakpoints
- [ ] All icons display correctly
- [ ] Error messages appear and disappear properly
- [ ] localStorage/sessionStorage used correctly

---

## Documentation Files Created

1. **CHECKOUT_PAGE_COMPLETE_ANALYSIS.md** - Full technical breakdown
2. **CHECKOUT_PAGE_VISUAL_DESIGN_REFERENCE.md** - Design system details
3. **This file** - Quick reference summary

Use these three together when implementing the checkout experience on dashboard.

