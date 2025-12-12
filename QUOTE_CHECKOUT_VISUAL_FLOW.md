# Custom Order Quote to Checkout - Visual Flow

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD - CUSTOM ORDERS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📋 CUSTOM-2025-00123                                            │
│  ├─ Description: Navy Blue Costume                               │
│  ├─ Status: [Chat in progress]                                  │
│  └─ [View Chat]                                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
                         Click [View Chat]
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                         CHAT MODAL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Admin: "For 5 navy costumes at ₦15,000 each"                   │
│  Admin: "With 10% bulk discount"                                │
│  Admin: "Final price: ₦67,500"                                  │
│                                                                   │
│  ┌─────────────────────────────────────┐                        │
│  │ ✓ Final Price                       │                        │
│  ├─────────────────────────────────────┤                        │
│  │ Unit Price:          ₦15,000        │                        │
│  │ Discount (10%):      -₦7,500        │                        │
│  │ VAT (7.5%):          ₦4,500         │                        │
│  │ ─────────────────────────────────── │                        │
│  │ Total:               ₦67,500        │                        │
│  ├─────────────────────────────────────┤                        │
│  │    [💵 Pay Now]  [← Back to Chat]   │  ← NEW!               │
│  └─────────────────────────────────────┘                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
                      Click [💵 Pay Now]
                                ↓
    sessionStorage.setItem('customOrderQuote', {...})
                                ↓
              router.push('/checkout?fromQuote=true')
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CHECKOUT PAGE (Quote Mode)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Order Review - Step 2 of 2]                                   │
│                                                                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓                         │
│  ┃ 📄 Custom Order Quote (NEW!)      ┃                         │
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫                         │
│  ┃ Order: CUSTOM-2025-00123          ┃                         │
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫                         │
│  ┃ Unit Price:     ₦15,000            ┃                         │
│  ┃ Discount (10%): -₦7,500            ┃                         │
│  ┃ VAT (7.5%):     ₦4,500             ┃                         │
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫                         │
│  ┃ TOTAL:          ₦67,500            ┃                         │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛                         │
│                                                                   │
│  [Billing Information]                                          │
│  [Delivery Information] (if EMPI delivery)                      │
│                                                                   │
│                                        ┌──────────────────────┐ │
│                                        │  Quote Summary       │ │
│                                        ├──────────────────────┤ │
│                                        │ Order: CUSTOM-2025.. │ │
│                                        │ Qty: 5               │ │
│                                        ├──────────────────────┤ │
│                                        │ Unit:   ₦15,000      │ │
│                                        │ Disc:   -₦7,500      │ │
│                                        │ VAT:    ₦4,500       │ │
│                                        ├──────────────────────┤ │
│                                        │ Total:  ₦67,500      │ │
│                                        ├──────────────────────┤ │
│                                        │ ✅ Ready for Pay     │ │
│                                        └──────────────────────┘ │
│                                                                   │
│  [Back to Cart]  [Pay ₦67,500 with Paystack]                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
                    Click [Pay ₦67,500 with Paystack]
                                ↓
                    Paystack Payment Gateway
                                ↓
                         Payment Successful
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│              Payment Success Modal                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                    ✅ PAYMENT SUCCESSFUL                         │
│                                                                   │
│              Reference: flw_xxxxxxxxxxxxxxx                      │
│              Amount: ₦67,500                                     │
│                                                                   │
│              Order Status Updated to "PAID"                      │
│              Invoice Generated                                   │
│                                                                   │
│                    [Continue Shopping]                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
                 sessionStorage.removeItem('customOrderQuote')
                                ↓
                   custom_order.status = "PAID"
                   custom_order.paymentReference = "flw_xxx"
                   custom_order.paidAt = ISO timestamp
                                ↓
                    Dashboard Updates Automatically
```

---

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                      ChatModal Component                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  onAdmin sends quote message (isFinalPrice = true)               │
│         ↓                                                         │
│  Display message with calculation:                              │
│    - Unit Price                                                 │
│    - Discount Amount (if any)                                  │
│    - VAT                                                        │
│    - Total                                                      │
│         ↓                                                        │
│  Render "✓ Final Price" badge                                  │
│         ↓                                                        │
│  IF customer (not admin):                                       │
│    └─ Render "Pay Now" button                                  │
│         ↓                                                        │
│  ON "Pay Now" click:                                            │
│    ├─ Extract quote data from message                          │
│    ├─ Create quote object:                                     │
│    │  {                                                         │
│    │    orderId,                                               │
│    │    orderNumber,                                           │
│    │    quotedPrice,                                           │
│    │    quantity,                                              │
│    │    discountPercentage,                                    │
│    │    discountAmount,                                        │
│    │    quotedVAT,                                             │
│    │    quotedTotal                                            │
│    │  }                                                         │
│    ├─ sessionStorage.setItem('customOrderQuote', JSON)         │
│    └─ router.push('/checkout?fromQuote=true')                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────┐
│                  Checkout Page Component                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ON MOUNT (useEffect):                                           │
│    ├─ Get 'customOrderQuote' from sessionStorage                │
│    ├─ IF data exists:                                           │
│    │  ├─ Parse JSON                                            │
│    │  ├─ setCustomOrderQuote(data)                             │
│    │  └─ setIsFromQuote(true)                                  │
│    └─ ELSE:                                                     │
│       └─ isFromQuote remains false                             │
│         ↓                                                        │
│  IF isFromQuote:                                                │
│    ├─ MAIN CONTENT:                                            │
│    │  └─ Display Custom Order Quote Card (lime themed)         │
│    │     ├─ Order number                                       │
│    │     ├─ Unit price                                         │
│    │     ├─ Discount (if applicable)                          │
│    │     ├─ VAT                                                │
│    │     └─ Total                                              │
│    │                                                            │
│    └─ SIDEBAR:                                                 │
│       ├─ Title: "Quote Summary"                               │
│       ├─ Quote Details                                        │
│       ├─ Pricing Breakdown                                    │
│       └─ Total Amount: quotedTotal                            │
│  ELSE:                                                          │
│    ├─ MAIN CONTENT:                                            │
│    │  └─ Display cart items                                    │
│    │                                                            │
│    └─ SIDEBAR:                                                 │
│       └─ Regular Order Summary                                 │
│         ↓                                                        │
│  ON PAYMENT SUCCESS:                                            │
│    IF isFromQuote && customOrderQuote:                         │
│    ├─ Send POST to /api/custom-orders/update-payment         │
│    ├─ Generate invoice with type: 'custom_order'             │
│    ├─ Link invoice to customOrderId                           │
│    ├─ Show success modal                                       │
│    └─ sessionStorage.removeItem('customOrderQuote')           │
│    ELSE:                                                        │
│    └─ Standard cart checkout flow                             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Data Persistence Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    sessionStorage Flow                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ChatModal.tsx - handlePayNow()                             │
│  ├─ Create quote object                                    │
│  └─ sessionStorage.setItem('customOrderQuote', JSON.stringify(quoteData))
│                                                              │
│  ↓ (Tab stays open, user navigates to /checkout)          │
│                                                              │
│  checkout/page.tsx - useEffect()                            │
│  ├─ const quoteData = sessionStorage.getItem('customOrderQuote')
│  ├─ Parse JSON                                             │
│  └─ setCustomOrderQuote(quoteData)                         │
│                                                              │
│  ↓ (User completes payment)                                │
│                                                              │
│  checkout/page.tsx - handlePaymentSuccess()                │
│  ├─ Process quote payment                                  │
│  └─ sessionStorage.removeItem('customOrderQuote')         │
│                                                              │
│  ↓ (sessionStorage cleared)                                │
│                                                              │
│  If user closes tab or refreshes mid-checkout:             │
│  └─ Quote data lost (safe, prevents duplicate payments)   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Color Theme Reference

### Quote Components (Lime/Green Theme)

```
Quote Card:
├─ Background: from-lime-50 to-green-50
├─ Border: lime-300
└─ Text: gray-900

Quote Total Display:
├─ Background: from-lime-100 to-green-100
├─ Border: lime-400
└─ Text: from-lime-600 to-green-600 (gradient)

Unit Price Section:
├─ Background: white/60
└─ Border: lime-200

Discount Section (if applicable):
├─ Background: green-50
└─ Border: green-200

VAT Section:
├─ Background: blue-50
└─ Border: blue-200
```

---

## State Management Summary

### ChatModal State
```tsx
const router = useRouter();           // Navigation
const buyer = useBuyer();             // User context

// No new state variables needed
// Uses existing order and message state
```

### Checkout State
```tsx
const [customOrderQuote, setCustomOrderQuote] = useState<any>(null);
const [isFromQuote, setIsFromQuote] = useState(false);

// Used to determine which UI to display
// Controls payment flow logic
```

---

## Security & Best Practices

✅ **Secure Data Passing**
- Uses sessionStorage (auto-clears on tab close)
- Not vulnerable to page refresh (user returned to checkout flow)

✅ **Error Handling**
- Try-catch for JSON parsing
- Fallback values for missing amounts
- Graceful handling of API failures

✅ **Authorization**
- "Pay Now" button only shows to customers (not admins)
- Quote linked to buyerId for tracking

✅ **Data Validation**
- Server-side validation when processing payment
- Custom order record verified before status update

✅ **Audit Trail**
- paymentReference stored for tracking
- Invoice created for accounting
- Order status updated with timestamp
