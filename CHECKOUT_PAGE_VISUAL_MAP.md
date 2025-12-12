# 🗺️ Checkout Page - Complete Visual Map

## Page Layout Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          HEADER COMPONENT                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║              PAGE HEADER - Order Review                        ║  │
│  ║  [💳] Order Review                  Step 2 of 2 - Review & Pay║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                        │
│  ┌──────────────────────────────────────────┐  ┌──────────────────┐ │
│  │                                          │  │                  │ │
│  │         MAIN CONTENT (lg:col-span-2)    │  │   SIDEBAR        │ │
│  │         70% width                       │  │   (lg:col-span-1)│ │
│  │         Stack vertically                │  │   30% width      │ │
│  │         space-y-6 between sections      │  │   sticky top-24  │ │
│  │                                          │  │   on desktop     │ │
│  │  ┌──────────────────────────────────┐   │  │                  │ │
│  │  │ SECTION 1: ORDER ITEMS           │   │  │ ┌──────────────┐ │ │
│  │  │ ✓ Always visible                 │   │  │ │ ORDER SUMMARY│ │ │
│  │  │                                  │   │  │ │   OR QUOTE   │ │ │
│  │  │ [🛍️] Order Items (5)             │   │  │ │   SUMMARY    │ │ │
│  │  │ ├─ Item 1: ₦X × qty             │   │  │ │              │ │ │
│  │  │ ├─ Item 2: ₦Y × qty × days      │   │  │ │ [Variant A]  │ │ │
│  │  │ └─ Item 3: ₦Z × qty             │   │  │ │ Regular Mode:│ │ │
│  │  │                                  │   │  │ │              │ │ │
│  │  └──────────────────────────────────┘   │  │ ├─ Subtotal   │ │ │
│  │                                          │  │ ├─ Discount   │ │ │
│  │  ┌──────────────────────────────────┐   │  │ ├─ Caution Fee│ │ │
│  │  │ SECTION 2: CUSTOM ORDER DETAILS  │   │  │ ├─ Shipping   │ │ │
│  │  │ ✓ Quote mode only                │   │  │ ├─ VAT        │ │ │
│  │  │ isFromQuote && customOrderDetails│   │  │ └─ TOTAL      │ │ │
│  │  │                                  │   │  │              │ │ │
│  │  │ ┌───────────────┬──────────────┐ │   │  │ [Variant B]  │ │ │
│  │  │ │    IMAGE      │  ORDER #123  │ │   │  │ Quote Mode:  │ │ │
│  │  │ │               │  Customer    │ │   │  │              │ │ │
│  │  │ │   [design]    │  Description │ │   │  │ ├─ Quote Info│ │ │
│  │  │ │    image      │  Qty: 5      │ │   │  │ ├─ Unit Price│ │ │
│  │  │ │   264px tall  │  Lagos       │ │   │  │ ├─ Discount  │ │ │
│  │  │ │               │  Email/Phone │ │   │  │ ├─ VAT       │ │ │
│  │  │ └───────────────┴──────────────┘ │   │  │ └─ TOTAL     │ │ │
│  │  │                                  │   │  │              │ │ │
│  │  └──────────────────────────────────┘   │  │ ✓ Status:   │ │ │
│  │                                          │  │ ✅ Ready    │ │ │
│  │  ┌──────────────────────────────────┐   │  └──────────────┘ │ │
│  │  │ SECTION 3: CUSTOM ORDER QUOTE    │   │                  │ │
│  │  │ ✓ Quote mode only                │   │ ┌──────────────┐ │ │
│  │  │ isFromQuote && customOrderQuote  │   │ │ SECURITY     │ │ │
│  │  │ (Lime-green gradient bg)         │   │ │ BADGE        │ │ │
│  │  │                                  │   │ │              │ │ │
│  │  │ [📄] Custom Order Quote          │   │ │ 🔒 Secure   │ │ │
│  │  │ Order: CUSTOM-2025-001           │   │ │ Payment      │ │ │
│  │  │                                  │   │ │              │ │ │
│  │  │ Unit Price:  ₦5,000              │   │ │ Encrypted &  │ │ │
│  │  │ Discount:   -₦500 (10%)          │   │ │ Powered by   │ │ │
│  │  │ VAT:        ₦357 (7.5%)          │   │ │ Paystack     │ │ │
│  │  │                                  │   │ │              │ │ │
│  │  │ 💳 TOTAL:    ₦5,357 (4xl text)   │   │ └──────────────┘ │ │
│  │  │                                  │   │                  │ │
│  │  └──────────────────────────────────┘   │                  │ │
│  │                                          │                  │ │
│  │  ┌──────────────────────────────────┐   │                  │ │
│  │  │ SECTION 4: RENTAL SCHEDULE       │   │                  │ │
│  │  │ ✓ If rentals exist               │   │                  │ │
│  │  │ (Purple-pink gradient bg)        │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  │ [🕐] Rental Schedule             │   │                  │ │
│  │  │ ┌──────────────┬──────────────┐  │   │                  │ │
│  │  │ │ Pickup       │ Return       │  │   │                  │ │
│  │  │ │ Dec 15, 2025 │ Dec 20, 2025 │  │   │                  │ │
│  │  │ │ at 2:00 PM   │ 5 days       │  │   │                  │ │
│  │  │ └──────────────┴──────────────┘  │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  └──────────────────────────────────┘   │                  │ │
│  │                                          │                  │ │
│  │  ┌──────────────────────────────────┐   │                  │ │
│  │  │ SECTION 5: DELIVERY INFORMATION  │   │                  │ │
│  │  │ ✓ If EMPI delivery selected      │   │                  │ │
│  │  │ (Green gradient bg)              │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  │ [🚚] Delivery Details            │   │                  │ │
│  │  │ Distance:  15.3 km               │   │                  │ │
│  │  │ Time:      25-30 minutes         │   │                  │ │
│  │  │ Address:   123 Main St, Lagos    │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  └──────────────────────────────────┘   │                  │ │
│  │                                          │                  │ │
│  │  ┌──────────────────────────────────┐   │                  │ │
│  │  │ SECTION 6: BILLING INFORMATION   │   │                  │ │
│  │  │ ✓ Always visible                 │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  │ [🔒] Billing Information         │   │                  │ │
│  │  │ Name:  John Doe                  │   │                  │ │
│  │  │ Email: john@example.com          │   │                  │ │
│  │  │ Phone: +234 801 234 5678         │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  └──────────────────────────────────┘   │                  │ │
│  │                                          │                  │ │
│  │  ┌──────────────────────────────────┐   │                  │ │
│  │  │ SECTION 7: ERROR MESSAGE         │   │                  │ │
│  │  │ ✓ If orderError exists           │   │                  │ │
│  │  │ (Red background)                 │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  │ ⚠️  Payment Error                │   │                  │ │
│  │  │ Failed to initialize payment     │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  └──────────────────────────────────┘   │                  │ │
│  │                                          │                  │ │
│  │  ┌──────────────────────────────────┐   │                  │ │
│  │  │ SECTION 8: ACTION BUTTONS        │   │                  │ │
│  │  │ ✓ Always visible                 │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  │ [← Back to Cart] [🔒 Pay ₦...] │   │                  │ │
│  │  │                                  │   │                  │ │
│  │  └──────────────────────────────────┘   │                  │ │
│  │                                          │                  │ │
│  └──────────────────────────────────────────┘  └──────────────┘ │
│                                                                        │
├──────────────────────────────────────────────────────────────────────┤
│                         FOOTER COMPONENT                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Section Color Scheme Reference

```
CHECKOUT PAGE - COLOR CODING

Order Items Section
├─ Card BG:        bg-white
├─ Item Card BG:   from-gray-50 to-transparent gradient
├─ Badge Rental:   bg-purple-100 text-purple-700
├─ Badge Buy:      bg-green-100 text-green-700
├─ Header Icon:    bg-blue-100 with blue-600 icon
└─ Hover Effect:   hover:shadow-md transition


Custom Order Details (Quote Mode ONLY)
├─ Card BG:        bg-white
├─ Image BG:       bg-gray-100 (h-64)
├─ Fallback Icon:  bg-gray-200 with gray-500 text
├─ Header Icon:    bg-blue-100 with blue-600 icon
└─ Border:         border-gray-100


Custom Order Quote (Quote Mode ONLY)
├─ Main BG:        from-lime-50 to-green-50 gradient
├─ Border:         border-lime-300
├─ Unit Price Box: bg-white/60 with lime-200 border
├─ Discount Box:   bg-green-50 with green-200 border
├─ VAT Box:        bg-blue-50 with blue-200 border
├─ Total Box:      from-lime-100 to-green-100 gradient
├─ Border:         border-lime-400
├─ Header Icon:    bg-lime-100 with lime-600 icon
└─ Text Color:     lime-600 / green-600 gradients


Rental Schedule (If Rentals Exist)
├─ Main BG:        from-purple-50 to-pink-50 gradient
├─ Border:         border-purple-200
├─ Card BG:        bg-white/60
├─ Header Icon:    bg-purple-100 with purple-600 icon
└─ Hover Effect:   hover:shadow-md


Delivery Information (If EMPI Selected)
├─ Main BG:        from-green-50 to-emerald-50 gradient
├─ Border:         border-green-200
├─ Card BG:        bg-white/60
├─ Header Icon:    bg-green-100 with green-600 icon
└─ Hover Effect:   hover:shadow-md


Billing Information
├─ Card BG:        bg-white
├─ Field BG:       from-gray-50 to-transparent gradient
├─ Border:         border-gray-100
├─ Header Icon:    bg-blue-100 with blue-600 icon
└─ Text:           text-gray-900


Order Summary Sidebar (Regular Mode)
├─ Card BG:        bg-white
├─ Border:         border-gray-100
├─ Total Box BG:   from-purple-50 to-blue-50 gradient
├─ Discount Box:   bg-green-50 with green-200 border
└─ Status Icon:    green-600 CheckCircle2


Order Summary Sidebar (Quote Mode)
├─ Card BG:        from-lime-50 to-green-50 gradient
├─ Border:         border-lime-300
├─ Detail Box:     bg-white rounded-lg
├─ Discount Box:   bg-green-50 with green-200 border
├─ Total Box BG:   from-lime-100 to-green-100 gradient
├─ Border:         border-lime-400
└─ Status Icon:    green-600 CheckCircle2


Security Badge
├─ Main BG:        from-green-50 to-emerald-50 gradient
├─ Border:         border-green-200
├─ Icon Color:     green-600
└─ Text Color:     green-900 / green-800


Buttons
├─ Back Button:    bg-gray-200 hover:bg-gray-300 text-gray-800
└─ Pay Button:     from-purple-600 to-blue-600 gradient
                   hover: from-purple-700 to-blue-700
                   disabled: from-gray-400 to-gray-400


Error Alert
├─ BG:             bg-red-50
├─ Border:         border-l-4 border-red-500
├─ Icon:           red-600
└─ Text:           red-900 / red-800
```

---

## State Management Flowchart

```
CHECKOUT PAGE - STATE FLOW

User Lands on Page
    ↓
useEffect 1 (Initialization)
├─ setIsHydrated(true)
├─ Load shippingOption from localStorage
├─ Load customOrderQuote from sessionStorage
├─ Check if mobile → show AuthModal
└─ Check if buyer exists

User Views Page
    ↓
Display Logic Checks:
├─ !isHydrated? → return null
├─ items.length === 0 && !isFromQuote? → return EmptyCart
├─ isFromQuote && loadingCustomOrder? → return Loading
└─ Otherwise → render full checkout

If Quote Mode:
    ↓
useEffect 2 (Fetch Custom Order)
├─ if (isFromQuote && customOrderQuote?.orderId)
├─ setLoadingCustomOrder(true)
├─ GET /api/custom-orders/{orderId}
├─ setCustomOrderDetails(data)
└─ setLoadingCustomOrder(false)

    ↓
Render Quote-Specific Sections:
├─ Custom Order Details (with image)
└─ Custom Order Quote (with pricing)

User Clicks Pay
    ↓
validateCheckoutRequirements()
├─ If invalid → show ValidationModal, return
└─ If valid → continue

setIsProcessing(true)
setOrderError(null)
    ↓
Try Paystack Modal:
├─ PaystackPop.setup({...})
├─ openIframe()
└─ pollForPayment(ref)

OR Fallback to Redirect:
├─ initialize-payment API
└─ window.location.href = authUrl

    ↓
Payment Complete
    ↓
handlePaymentSuccess(response)
├─ If Quote:
│  ├─ POST /api/custom-orders/update-payment
│  ├─ POST /api/invoices (quote)
│  ├─ sessionStorage.removeItem('customOrderQuote')
│  └─ setSuccessReference(ref)
└─ If Regular:
   ├─ POST /api/orders
   ├─ POST /api/invoices (regular)
   ├─ clearCart()
   └─ setSuccessReference(ref)

    ↓
setSuccessModalOpen(true)
    ↓
Display PaymentSuccessModal
```

---

## Responsive Layout Diagram

```
MOBILE (< 768px)
┌──────────────┐
│   HEADER     │
├──────────────┤
│              │
│ MAIN CONTENT │ (full width)
│              │
│ ┌──────────┐ │
│ │ Section 1│ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │ Section 2│ │
│ └──────────┘ │
│ ...          │
│ ┌──────────┐ │
│ │ Sidebar  │ │ (appears here, below content)
│ └──────────┘ │
│              │
├──────────────┤
│   FOOTER     │
└──────────────┘


TABLET (768px - 1023px)
┌──────────────────────┐
│      HEADER          │
├──────────────────────┤
│                      │
│   MAIN CONTENT       │ (still full width, wider padding)
│   (1 column)         │
│                      │
│   Responsive classes │
│   activate (md:)     │
│                      │
│   SIDEBAR below      │
│                      │
├──────────────────────┤
│       FOOTER         │
└──────────────────────┘


DESKTOP (≥ 1024px)
┌─────────────────────────────────────────┐
│              HEADER                     │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────┐ ┌──────┐ │
│  │   MAIN CONTENT (2/3)     │ │      │ │
│  │   ┌──────────────────┐   │ │      │ │
│  │   │ Section 1        │   │ │      │ │
│  │   └──────────────────┘   │ │ SIDE │ │
│  │   ┌──────────────────┐   │ │ BAR  │ │ sticky top-24
│  │   │ Section 2        │   │ │      │ │
│  │   └──────────────────┘   │ │ (1/3)│ │
│  │   ...                     │ │      │ │
│  └──────────────────────────┘ └──────┘ │
│                                         │
├─────────────────────────────────────────┤
│              FOOTER                     │
└─────────────────────────────────────────┘

lg:grid-cols-3 gap-8
├─ Column 1-2: lg:col-span-2 (66.67% width)
└─ Column 3:   lg:col-span-1 (33.33% width, sticky)
```

---

## Typography Hierarchy

```
ORDER REVIEW (h1)
├─ Font Size:    text-4xl
├─ Weight:       font-bold
├─ Color:        gradient from-purple-600 to-blue-600 (bg-clip-text)
├─ Clip:         bg-clip-text text-transparent
└─ Location:     Page header

Step 2 of 2 (subtitle)
├─ Font Size:    (default)
├─ Weight:       regular
├─ Color:        text-gray-600
└─ Location:     Under page title


Order Items (h2)
├─ Font Size:    text-xl
├─ Weight:       font-bold
├─ Color:        text-gray-900
├─ Item Count:   gray-900 in parentheses
└─ Location:     Section header

Item Name (value)
├─ Font Size:    (base)
├─ Weight:       font-semibold
├─ Color:        text-gray-900
└─ Description:  In item row


Unit Price / Amount (prominent value)
├─ Font Size:    text-lg
├─ Weight:       font-bold
├─ Color:        text-gray-900 or gradient
└─ Location:     In pricing breakdown


Label (small)
├─ Font Size:    text-xs
├─ Weight:       font-semibold
├─ Color:        text-gray-600
├─ Transform:    uppercase
├─ Spacing:      tracking-wide
└─ Margin:       mb-2 or mb-3


Description Text
├─ Font Size:    text-sm
├─ Weight:       regular
├─ Color:        text-gray-700
├─ Line Height:  leading-relaxed
└─ Location:     In details sections


TOTAL AMOUNT (prominent)
├─ Font Size:    text-3xl or text-4xl
├─ Weight:       font-black
├─ Color:        gradient from-purple-600 to-blue-600 OR
│                gradient from-lime-600 to-green-600
├─ Clip:         bg-clip-text text-transparent
└─ Background:   gradient box behind for regular mode,
                 lime/green gradient for quote mode
```

---

## Icon Placement Map

```
Page Header
├─ CreditCard icon (h-6 w-6, white)
└─ Inside: bg-gradient-to-br from-purple-600 to-purple-700 p-3 rounded-lg

Order Items Header
├─ ShoppingBag icon (h-5 w-5, blue-600)
└─ Inside: bg-blue-100 p-3 rounded-lg

Each Item Row
├─ Mode badge (emoji: 🛍️ or 🔄)
└─ No icon

Custom Order Details Header
├─ ShoppingBag icon (h-5 w-5, blue-600)
└─ Inside: bg-blue-100 p-3 rounded-lg

No Image Fallback
├─ ShoppingBag icon (h-12 w-12, gray-400)
├─ Centered in placeholder
└─ With "No image available" text below

Custom Order Quote Header
├─ FileText icon (h-5 w-5, lime-600)
└─ Inside: bg-lime-100 p-3 rounded-lg

Rental Schedule Header
├─ Clock icon (h-5 w-5, purple-600)
└─ Inside: bg-purple-100 p-3 rounded-lg

Delivery Information Header
├─ Truck icon (h-5 w-5, green-600)
└─ Inside: bg-green-100 p-3 rounded-lg

Billing Information Header
├─ Lock icon (h-5 w-5, blue-600)
└─ Inside: bg-blue-100 p-3 rounded-lg

Error Alert
├─ AlertCircle icon (h-5 w-5, red-600)
├─ flex-shrink-0 mt-0.5
└─ Left side of message

Back Button
├─ Text: "←"
└─ No icon

Pay Button
├─ Lock icon (h-4 w-4, white)
└─ Left of text "Pay ₦..."

Processing State
├─ Spinner (h-4 w-4, white border-2)
├─ border-white border-t-transparent
├─ rounded-full animate-spin
└─ Left of text "Processing..."

Status Indicator
├─ CheckCircle2 icon (h-4 w-4, green-600)
├─ Before: "READY FOR PAYMENT"
└─ Sidebar

Security Badge
├─ Lock icon (h-4 w-4, green-600)
└─ In small box on sidebar
```

---

## Grid Layout Reference

```
Main Page Grid
lg:grid-cols-3 gap-8
├─ Left: lg:col-span-2 (main content)
└─ Right: lg:col-span-1 (sidebar)

Sections Inside Main
space-y-6 between each section
├─ Maintains vertical spacing
└─ Consistent rhythm

Custom Order Details
md:grid-cols-3 gap-8
├─ Left (col-span-1): Image
└─ Right (col-span-2): Details

Details Inside Custom Order
space-y-4
├─ Order number section
├─ Description section
├─ Quantity & Location section
└─ Contact Info section

Quantity & Location Grid
grid-cols-2 gap-4
├─ Left: Quantity
└─ Right: Location

Rental Schedule
md:grid-cols-2 gap-6
├─ Left: Pickup
└─ Right: Return

Delivery Information
md:grid-cols-2 gap-4
with md:col-span-2 for address
├─ Distance: col-span-1
├─ Time: col-span-1
└─ Address: col-span-2 (full width)
```

---

**This visual map should help you understand the exact layout and rendering of every element on the checkout page.**

