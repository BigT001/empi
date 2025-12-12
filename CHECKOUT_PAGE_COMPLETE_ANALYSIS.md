# ✅ Complete Checkout Page Analysis & Feature Inventory

**Document Purpose:** Complete breakdown of ALL features, sections, logic, and user experience on the checkout page. Use this as the reference for ensuring dashboard mirrors checkout exactly.

**Status:** Analysis Complete - Ready for Implementation

---

## 📋 Quick Overview

**File:** `/app/checkout/page.tsx` (1074 lines)  
**Type:** Client Component (`"use client"`)  
**Framework:** Next.js 16+ with TypeScript  
**Styling:** Tailwind CSS with gradient backgrounds  
**Icons:** Lucide React  

---

## 🏗️ Page Structure & Layout

```
CHECKOUT PAGE STRUCTURE
├─ Header Component (top)
├─ Main Content Grid (lg:grid-cols-3)
│  ├─ Left Column (lg:col-span-2) - 70% width
│  │  ├─ Page Header (with icon & title)
│  │  ├─ Order Items Section
│  │  ├─ [CONDITIONAL] Custom Order Details (Quote mode only)
│  │  ├─ [CONDITIONAL] Custom Order Quote Section (Quote mode only)
│  │  ├─ [CONDITIONAL] Rental Schedule (if rentals exist)
│  │  ├─ [CONDITIONAL] Delivery Information (if EMPI delivery)
│  │  ├─ Billing Information
│  │  ├─ [CONDITIONAL] Error Message
│  │  └─ Action Buttons (Back to Cart + Pay)
│  │
│  └─ Right Column (lg:col-span-1) - Sticky Sidebar - 30% width
│     ├─ Order Summary / Quote Summary Card
│     │  ├─ [CONDITIONAL] Quote Details (Quote mode)
│     │  ├─ [CONDITIONAL] Pricing Breakdown
│     │  └─ [REGULAR] Items Breakdown, Subtotal, Discounts, Shipping, VAT, Total
│     └─ Security Badge
│
└─ Footer Component (bottom)
```

---

## 🎨 Color Scheme & Design System

| Section | Colors | Icon | Purpose |
|---------|--------|------|---------|
| **Order Items** | Blue gradient (100→50), green/purple badges | ShoppingBag | List all items |
| **Custom Order Details** | White with borders, gray tones | ShoppingBag | Show image + details |
| **Custom Order Quote** | Lime/Green gradient (50→50), lime border | FileText | Quote pricing breakdown |
| **Rental Schedule** | Purple/Pink gradient (50→50), purple border | Clock | Pickup & return dates |
| **Delivery Information** | Green/Emerald gradient (50→50), green border | Truck | Distance, time, address |
| **Billing Information** | White with gray tones | Lock | Customer details |
| **Order Summary (Regular)** | White with purple/blue gradient bottom | - | Total pricing |
| **Order Summary (Quote)** | Lime/Green gradient (50→50), lime border | - | Quote pricing |
| **Security Badge** | Green/Emerald gradient (50→50), green border | Lock | Trust indicators |
| **Pay Button** | Purple→Blue gradient | Lock | Primary action |

---

## 📊 State Variables (Complete List)

```typescript
// Hydration & Basic
const [isHydrated, setIsHydrated] = useState(false);

// Shipping
const [shippingOption, setShippingOption] = useState<"empi" | "self">("empi");

// Payment & Modal States
const [successModalOpen, setSuccessModalOpen] = useState(false);
const [successReference, setSuccessReference] = useState("");
const [isProcessing, setIsProcessing] = useState(false);
const [orderError, setOrderError] = useState<string | null>(null);
const [authModalOpen, setAuthModalOpen] = useState(false);
const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");
const [validationModalOpen, setValidationModalOpen] = useState(false);
const [validationType, setValidationType] = useState<"rental_schedule" | "delivery_info" | "buyer_info">("rental_schedule");
const [validationMessage, setValidationMessage] = useState("");

// Custom Order Quote (from Chat "Pay Now")
const [customOrderQuote, setCustomOrderQuote] = useState<any>(null);
const [isFromQuote, setIsFromQuote] = useState(false);
const [customOrderDetails, setCustomOrderDetails] = useState<any>(null);
const [loadingCustomOrder, setLoadingCustomOrder] = useState(false);
```

---

## ⚙️ Core Calculations

### 1. Caution Fee (Rental Only)
```typescript
const rentalTotal = items.reduce((sum, item) => {
  if (item.mode === 'rent') {
    const days = rentalSchedule?.rentalDays || 1;
    return sum + (item.price * item.quantity * days);
  }
  return sum;
}, 0);
const cautionFee = rentalTotal * 0.5; // 50% of rental total
```

### 2. Bulk Discount (Buy Items Only)
```typescript
// Discount Tiers:
// - 10% for 10+ sets
// - 7% for 6-9 sets
// - 5% for 3-5 sets

let discountPercentage = 0;
if (totalBuyQuantity >= 10) discountPercentage = 10;
else if (totalBuyQuantity >= 6) discountPercentage = 7;
else if (totalBuyQuantity >= 3) discountPercentage = 5;

const discountAmount = buySubtotal * (discountPercentage / 100);
const buySubtotalAfterDiscount = buySubtotal - discountAmount;
```

### 3. VAT Calculation
```typescript
// VAT is ONLY on goods/services, NOT on caution fee
const subtotalForVAT = buySubtotalAfterDiscount + rentalTotal;
const taxEstimate = subtotalForVAT * 0.075; // 7.5% VAT
```

### 4. Total Amount
```typescript
const subtotalWithCaution = subtotalForVAT + cautionFee;
const shippingCost = shippingOption === "empi" ? 2500 : 0;
const totalAmount = subtotalWithCaution + shippingCost + taxEstimate;
```

---

## 🔄 useEffect Hooks

### Effect 1: Initialization & Data Loading (Lines 99-130)
```typescript
useEffect(() => {
  setIsHydrated(true);
  
  // Load shipping preference from localStorage
  const saved = localStorage.getItem("empi_shipping_option");
  if (saved) setShippingOption(saved as "empi" | "self");
  
  // Load custom order quote from sessionStorage (from chat Pay Now)
  const quoteData = sessionStorage.getItem('customOrderQuote');
  if (quoteData) {
    const parsedQuote = JSON.parse(quoteData);
    setCustomOrderQuote(parsedQuote);
    setIsFromQuote(true);
  }
  
  // Check if user is logged in on mobile - show auth modal if not
  if (!buyer && typeof window !== "undefined") {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setAuthModalOpen(true);
    }
  }
}, [buyer]);
```

### Effect 2: Fetch Custom Order Details (Lines 132-155)
```typescript
useEffect(() => {
  if (isFromQuote && customOrderQuote?.orderId) {
    const fetchCustomOrder = async () => {
      try {
        setLoadingCustomOrder(true);
        const response = await fetch(`/api/custom-orders/${customOrderQuote.orderId}`);
        if (response.ok) {
          const data = await response.json();
          setCustomOrderDetails(data);
        }
      } catch (error) {
        console.error('[Checkout] Error loading custom order:', error);
      } finally {
        setLoadingCustomOrder(false);
      }
    };
    fetchCustomOrder();
  }
}, [isFromQuote, customOrderQuote?.orderId]);
```

---

## 🎯 Page Sections (Detailed Breakdown)

### SECTION 1: Page Header
**Lines:** ~365-380  
**Condition:** Always visible  
**Content:**
- Icon: CreditCard in gradient box
- Title: "Order Review" (h1, 4xl, gradient purple→blue)
- Subtitle: "Step 2 of 2 - Review and Pay" (gray-600)

---

### SECTION 2: Order Items
**Lines:** ~390-430  
**Condition:** Always visible (if items exist)  
**Features:**
- Header with ShoppingBag icon (blue)
- Item count badge
- Lists each item with:
  - Badge: "🔄 Rental" (purple) or "🛍️ Buy" (green)
  - Item name
  - Quantity
  - **Price Calculation:**
    - Rentals: `price × quantity × rentalDays`
    - Buy: `price × quantity`
  - Breakdown text showing calculation

---

### SECTION 3: Custom Order Details (QUOTE MODE ONLY)
**Lines:** ~435-585  
**Condition:** `{isFromQuote && customOrderDetails && (...)}`  
**Features:**
- Header: "Order Details" with ShoppingBag icon (blue)
- **Grid Layout (md:grid-cols-3):**
  - Left (md:col-span-1): Image Display
    - Image container: bg-gray-100, rounded-xl, h-64, object-cover
    - Fallback: Gray placeholder with ShoppingBag icon + "No image available"
  - Right (md:col-span-2): Details Section with spacing
    - **Order Number & Name:** orderNumber (lg bold), fullName
    - **Description:** Full text, gray-700, leading-relaxed (after border-top)
    - **Quantity & Location:** 2-column grid
      - Qty: `{quantity} unit(s)`
      - Location: city, state (if available)
    - **Contact Info:** Gradient bg (blue-50→transparent), rounded-lg, p-4
      - Email: customOrderDetails.email
      - Phone: customOrderDetails.phone

---

### SECTION 4: Custom Order Quote (QUOTE MODE ONLY)
**Lines:** ~595-655  
**Condition:** `{isFromQuote && customOrderQuote && (...)}`  
**Background:** Gradient lime-50→green-50 with lime border  
**Features:**
- Header: "Custom Order Quote" (FileText icon, lime)
- **Pricing Breakdown:**
  1. **Unit Price Box:**
     - Label: "Unit Price"
     - Subtext: "Per item quoted by admin"
     - Price: `₦{quotedPrice?.toLocaleString()}`
     - Qty: `× {quantity || 1}`
     - Background: white/60, lime-200 border
  
  2. **Discount Box** (if discountPercentage > 0):
     - Label: "Discount ({discountPercentage}%)"
     - Subtext: "Special offer from admin"
     - Amount: `-₦{discountAmount?.toLocaleString()}`
     - Background: green-50, green-200 border
  
  3. **VAT Box:**
     - Label: "VAT (7.5%)"
     - Subtext: "Tax on quoted amount"
     - Amount: `₦{quotedVAT?.toLocaleString()}`
     - Background: blue-50, blue-200 border
  
  4. **Total Box:**
     - Background: lime-100→green-100 gradient
     - Border: lime-400
     - Label: "Total Amount to Pay" (xs, bold, uppercase)
     - Amount: LARGE 4xl bold gradient text
     - Amount: `₦{quotedTotal?.toLocaleString()}`

---

### SECTION 5: Rental Schedule (CONDITIONAL)
**Lines:** ~660-680  
**Condition:** `{rentalSchedule && items.some(i => i.mode === 'rent') && (...)}`  
**Background:** Purple-50→pink-50 gradient, purple border  
**Features:**
- Header: "Rental Schedule" (Clock icon, purple)
- **2-Column Grid (md:grid-cols-2):**
  - **Pickup Box:**
    - Label: "Pickup" (uppercase, xs, bold)
    - Date: `{rentalSchedule.pickupDate}` (bold)
    - Time: `at {rentalSchedule.pickupTime}` (sm, bold)
  
  - **Return Box:**
    - Label: "Return" (uppercase, xs, bold)
    - Date: `{rentalSchedule.returnDate}` (bold)
    - Days: `{rentalSchedule.rentalDays} {plural}`

---

### SECTION 6: Delivery Information (CONDITIONAL)
**Lines:** ~685-710  
**Condition:** `{shippingOption === "empi" && deliveryQuote && (...)}`  
**Background:** Green-50→emerald-50 gradient, green border  
**Features:**
- Header: "Delivery Details" (Truck icon, green)
- **2-Column Grid (md:grid-cols-2) + Full Width:**
  - **Distance Box:**
    - Label: "Distance" (uppercase, xs, bold)
    - Value: `{distance?.toFixed(1) || 'N/A'} km` (lg, bold)
  
  - **Time Box:**
    - Label: "Estimated Time" (uppercase, xs, bold)
    - Value: `{duration || 'N/A'}` (lg, bold)
  
  - **Address Box (md:col-span-2):**
    - Label: "Delivery Address" (uppercase, xs, bold)
    - Value: `{deliveryPoint?.address || 'Not specified'}` (bold)

---

### SECTION 7: Billing Information
**Lines:** ~715-745  
**Condition:** Always visible  
**Background:** White with blue icon  
**Features:**
- Header: "Billing Information" (Lock icon, blue)
- **3 Information Fields:**
  1. **Name:** `{buyer?.fullName || "Guest Customer"}`
  2. **Email:** `{buyer?.email || "Not provided"}`
  3. **Phone:** `{buyer?.phone || "Not provided"}`
- Each field: gradient bg, gray border, flex justify-between

---

### SECTION 8: Error Message (CONDITIONAL)
**Lines:** ~750-760  
**Condition:** `{orderError && (...)}`  
**Background:** Red-50 with red left border (4px)  
**Features:**
- Alert icon (AlertCircle, red)
- Bold title: "Payment Error"
- Error message text

---

### SECTION 9: Action Buttons
**Lines:** ~765-900+ (Pay button logic is ~140 lines)  
**Features:**
- **2-Column Layout (flex gap-3):**
  1. **Back to Cart Button:**
     - Link to `/cart`
     - Background: gray-200, hover: gray-300
     - Text: gray-800, bold
     - Icon: "←"
  
  2. **Pay Button:**
     - Background: purple-600→blue-600 gradient
     - Hover: purple-700→blue-700 gradient
     - Disabled: gray-400
     - Text: bold white
     - Icon: Lock
     - Text: `Pay ₦{totalAmount.toLocaleString()}`
     - When processing: Spinner + "Processing..."

---

### SECTION 10: Sidebar - Order Summary / Quote Summary
**Lines:** ~905-1040  
**Position:** `sticky top-24` (fixed while scrolling)  
**Condition:** Always visible on lg+ screens  
**Two Modes:**
#### Mode A: QUOTE SUMMARY (if isFromQuote && customOrderQuote)
**Background:** Lime-50→green-50 with lime border  
**Content:**
1. **Quote Details Box:**
   - Label: "Quote Details" (uppercase, xs, bold)
   - Order Number: `{customOrderQuote.orderNumber}`
   - Quantity: `{customOrderQuote.quantity || 1}`

2. **Pricing Breakdown:**
   - Unit Price: `₦{quotedPrice?.toLocaleString() || '0'}`
   - Discount (if > 0): `-₦{discountAmount?.toLocaleString() || '0'}` (green box)
   - VAT (7.5%): `₦{quotedVAT?.toLocaleString() || '0'}`

3. **Total Amount:**
   - Background: lime-100→green-100 gradient
   - Border: lime-400
   - Amount: `₦{quotedTotal?.toLocaleString() || '0'}` (3xl, gradient text)

4. **Status:**
   - Icon: CheckCircle2 (green)
   - Text: "✅ Ready for Payment"

#### Mode B: REGULAR SUMMARY (if NOT quote mode)
**Background:** White with purple-50→blue-50 gradient at bottom  
**Content:**
1. **Items Breakdown:**
   - For each item: 
     - Name, Price, Mode badge
     - Calculation breakdown
     - Space-y-3

2. **Subtotal:**
   - `₦{total.toLocaleString()}`

3. **Bulk Discount (if applicable):**
   - Background: green-50, border: green-200
   - Text: "🎉 Bulk Discount ({discountPercentage}%)"
   - Amount: `-₦{discountAmount.toLocaleString()}`
   - Applied on: `{totalBuyQuantity} buy items`
   - After Discount: `₦{buySubtotalAfterDiscount.toLocaleString()}`

4. **Caution Fee (if applicable):**
   - Icon: 🛡️
   - Text: "Caution Fee (50%)"
   - Amount: `₦{cautionFee.toLocaleString()}`
   - Subtext: "Applied on rental items"

5. **Shipping:**
   - `{SHIPPING_OPTIONS[shippingOption].name}`
   - Amount: `FREE` or `₦{shippingCost.toLocaleString()}`

6. **VAT (7.5%):**
   - `₦{taxEstimate.toLocaleString()}`

7. **Total Amount:**
   - Background: purple-50→blue-50 gradient
   - Amount: `₦{totalAmount.toLocaleString()}` (3xl, gradient text)

8. **Status:**
   - Icon: CheckCircle2 (green)
   - Text: "✅ Ready for Payment"

---

### SECTION 11: Security Badge (Sidebar)
**Lines:** ~1045-1055  
**Background:** Green-50→emerald-50 gradient, green border  
**Features:**
- Icon: Lock (green-600)
- Label: "Secure Payment" (uppercase, xs, bold, green)
- Message: "Your payment information is encrypted and secure. Powered by Paystack."

---

## 🔐 Payment Processing Logic

### Payment Initiation (Lines ~765-900)
**Triggers on:** "Pay" button click  
**Flow:**

1. **Validation:**
   ```typescript
   const validation = validateCheckoutRequirements(shippingOption, buyer);
   if (!validation.valid) {
     // Show validation modal with specific error type
     return;
   }
   ```

2. **Setup Payment Reference:**
   ```typescript
   const ref = `EMPI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   ```

3. **Calculate Amount:**
   ```typescript
   const shippingCost = shippingOption === "empi" ? 2500 : 0;
   const taxEstimate = subtotalForVAT * 0.075;
   const orderTotal = subtotalWithCaution + shippingCost + taxEstimate;
   const amountInKobo = Math.round(orderTotal * 100);
   ```

4. **Store Pending Payment:**
   ```typescript
   localStorage.setItem('empi_pending_payment', JSON.stringify({
     reference: ref,
     email: buyer.email,
     amount: amountInKobo,
     timestamp: Date.now()
   }));
   ```

5. **Attempt Paystack Modal:**
   ```typescript
   if ((window as any).PaystackPop) {
     const handler = (window as any).PaystackPop.setup({
       key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
       email: buyer.email,
       amount: amountInKobo,
       currency: "NGN",
       ref: ref,
       firstname: buyer.fullName.split(" ")[0] || "Customer",
       lastname: buyer.fullName.split(" ").slice(1).join(" ") || "",
       phone: buyer.phone,
       onClose: () => verifyAndProcessPayment(ref),
       onSuccess: (response) => handlePaymentSuccess(response),
     });
     if (handler?.openIframe) {
       handler.openIframe();
       pollForPayment(ref);
     }
   }
   ```

6. **Fallback to Redirect:**
   ```typescript
   const initRes = await fetch('/api/initialize-payment', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: buyer.email,
       amount: amountInKobo,
       reference: ref,
       firstname: buyer.fullName.split(" ")[0] || "Customer",
       lastname: buyer.fullName.split(" ").slice(1).join(" ") || "",
       phone: buyer.phone,
     }),
   });
   
   if (initRes.ok && initData.authorization_url) {
     window.location.href = initData.authorization_url;
   }
   ```

---

## 💾 Payment Success Handler

### Two Payment Paths:

#### Path A: Custom Order Quote (isFromQuote && customOrderQuote)
```typescript
1. Update custom order payment status:
   - POST /api/custom-orders/update-payment
   - Data: orderId, paymentStatus, paymentReference, paidAmount, paidAt

2. Generate quote invoice:
   - POST /api/invoices
   - Data includes: invoiceNumber, orderNumber, customer info, quote items, total

3. Clear sessionStorage:
   - Remove 'customOrderQuote'

4. Show success modal
```

#### Path B: Regular Cart Order
```typescript
1. Save order to database:
   - POST /api/orders
   - Data includes: items, pricing (with discounts), rental schedule, shipping info

2. Generate invoice:
   - POST /api/invoices
   - Data includes: items breakdown, pricing with discounts, VAT, shipping

3. Clear cart

4. Show success modal
```

---

## 📱 Responsive Breakpoints

| Screen | Behavior |
|--------|----------|
| **Mobile (< 768px)** | 1-column layout, all sections stack, sidebar on bottom, auth modal shown if not logged in |
| **Tablet (768px-1023px)** | Still 1-column, sections wider, sidebar still on bottom |
| **Desktop (≥ 1024px)** | 3-column grid: main (2 cols), sidebar (1 col, sticky) |

---

## 🔌 API Endpoints Used

| Endpoint | Method | Purpose | Data |
|----------|--------|---------|------|
| `/api/custom-orders/[id]` | GET | Fetch custom order details | Returns order with image, description, quantity, location, contact |
| `/api/custom-orders/update-payment` | POST | Update order payment status | orderId, paymentStatus, paymentReference, paidAmount, paidAt |
| `/api/orders` | POST | Save regular cart order | items, pricing, rental schedule, customer info |
| `/api/invoices` | POST | Generate invoice | invoice data (items, totals, customer, pricing breakdown) |
| `/api/verify-payment` | GET | Verify Paystack payment | reference parameter |
| `/api/initialize-payment` | POST | Initialize Paystack payment | email, amount, reference, name, phone |

---

## 🎯 Conditional Rendering Decision Tree

```
Page Load
├─ isHydrated = false?
│  └─ return null
│
├─ items.length === 0 && !isFromQuote?
│  └─ Show empty cart page (return early)
│
├─ isFromQuote && loadingCustomOrder?
│  └─ Show loading spinner (return early)
│
Otherwise: Show full checkout page
├─ Show all main sections (items, billing, buttons)
├─ IF isFromQuote && customOrderDetails:
│  ├─ Show custom order details card (image + info)
│  └─ Skip rental/delivery sections
├─ IF isFromQuote && customOrderQuote:
│  └─ Show custom order quote card
├─ ELSE:
│  ├─ IF rentalSchedule && items have rentals:
│  │  └─ Show rental schedule card
│  ├─ IF shippingOption === "empi" && deliveryQuote:
│  │  └─ Show delivery information card
│  └─ Show pricing breakdown for regular order
└─ IF orderError:
   └─ Show error alert
```

---

## 🎁 Key Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| **Hydration Check** | ✅ Essential | useEffect |
| **Shipping Preference Persistence** | ✅ localStorage | useEffect |
| **Quote Data from Chat** | ✅ sessionStorage | useEffect |
| **Mobile Auth Modal** | ✅ Mobile only | useEffect |
| **Custom Order Fetching** | ✅ API call | useEffect |
| **Caution Fee Calculation** | ✅ Rental items | State calculations |
| **Bulk Discount Logic** | ✅ Buy items | State calculations |
| **VAT Exclusion (Caution)** | ✅ Tax logic | State calculations |
| **Empty Cart Detection** | ✅ Guard clause | Early return |
| **Loading State** | ✅ Quote mode | Early return |
| **Item Breakdown Display** | ✅ All items | Order Items section |
| **Quote Image Display** | ✅ Quote mode | Custom Order Details |
| **Quote Pricing** | ✅ Quote mode | Custom Order Quote section |
| **Rental Schedule Display** | ✅ If rentals | Rental Schedule section |
| **Delivery Info Display** | ✅ If EMPI | Delivery Information section |
| **Billing Info Display** | ✅ Always | Billing section |
| **Sticky Sidebar** | ✅ Desktop | Sidebar with `sticky top-24` |
| **Quote vs Regular Sidebar** | ✅ Conditional | Different layouts |
| **Payment Processing** | ✅ Paystack | Pay button logic |
| **Error Handling** | ✅ Try/catch | Multiple levels |
| **Polling for Payment** | ✅ Async | pollForPayment function |
| **Success Modal** | ✅ After payment | PaymentSuccessModal |
| **Validation Modal** | ✅ Pre-payment | CheckoutValidationModal |
| **Auth Modal (Mobile)** | ✅ Mobile only | AuthModal |

---

## 🚀 Implementation Checklist for Dashboard

When implementing this on dashboard, ensure:

- [ ] **All state variables** are replicated
- [ ] **All useEffect hooks** with exact same logic
- [ ] **All calculations** match precisely (caution fee, discounts, VAT)
- [ ] **All color schemes** match (use same gradient classes)
- [ ] **All sections** render with exact same conditions
- [ ] **All API calls** use exact same endpoints
- [ ] **Responsive behavior** matches (grid layout, breakpoints)
- [ ] **Sidebar behavior** matches (sticky positioning, content)
- [ ] **Payment flow** is identical
- [ ] **Modal behaviors** are the same
- [ ] **localStorage/sessionStorage** keys are identical
- [ ] **Icons and styling** are consistent
- [ ] **Typography and spacing** match
- [ ] **Border and gradient** styles match
- [ ] **Conditional rendering** logic matches exactly

---

## 📝 Next Steps

**For Dashboard Implementation:**
1. Copy this entire structure to dashboard page
2. Replace only the header/footer imports and context usage
3. Keep all state, calculations, sections, and logic identical
4. Test side-by-side with checkout to verify 100% parity
5. Verify all responsive breakpoints work the same way

**This is your blueprint. Follow it exactly.**

