# 📸 Checkout Flow - Visual Guide

## Complete User Journey

### 1. CART PAGE
```
┌─────────────────────────────────────────┐
│          🛒 Shopping Cart               │
├─────────────────────────────────────────┤
│                                         │
│ Item 1: Costume A        ₦5,000 x 2     │
│ Item 2: Costume B        ₦3,500 x 1     │
│                                         │
│ Subtotal:                    ₦13,500    │
│ Tax Estimate (7.5%):         ₦1,012     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Proceed to Checkout]               │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
         ↓
    (Click Checkout)
         ↓
  Is User Logged In?
      ├─ NO → Go to AUTH PROMPT
      └─ YES → Go to PAYMENT FORM
```

---

## 2. AUTH PROMPT (If Not Logged In)
```
┌─────────────────────────────────────────┐
│  Background with 50% dark overlay      │
│                                         │
│    ┌─────────────────────────────────┐ │
│    │  🔐 EMPI Auth                   │ │
│    │                                 │ │
│    │  [Register] [Login]             │ │
│    │                                 │ │
│    │  Register Tab:                  │ │
│    │  ├─ Email: [_____________]      │ │
│    │  ├─ Phone: [_____________]      │ │
│    │  ├─ Full Name: [_____________]  │ │
│    │  ├─ Password: [_____________]   │ │
│    │                                 │ │
│    │  [Register] [Continue as Guest] │ │
│    │                                 │ │
│    └─────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
    ↙              ↓              ↘
 Register      Continue        Cancel
    ↓            as Guest         ↓
  Login ←────────────→ Payment Form
    ↓                   ↓
 Payment Form       (Continue)
```

---

## 3. PAYMENT FORM (Main Flow)
```
┌──────────────────────────────────────────────────────────┐
│           💳 Complete Your Payment                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  LEFT COLUMN (2/3)        │  RIGHT COLUMN (1/3)        │
│  ─────────────────────    │  ──────────────────        │
│                           │                            │
│  📦 ORDER SUMMARY        │  Order Number              │
│  ┌─────────────────────┐ │  ORD-1234567890-ABC       │
│  │ Order ID:           │ │                            │
│  │ ORD-1234567890-ABC  │ │  📊 DETAILS               │
│  └─────────────────────┘ │  Items: 3                 │
│                           │  Type: Guest              │
│  Items List:              │  Status: Awaiting Payment │
│  • Costume A (x2)         │                            │
│    ₦5,000 × 2 = ₦10,000   │  🔒 SECURITY             │
│  • Costume B (x1)         │  ✓ SSL Encrypted         │
│    ₦3,500 × 1 = ₦3,500    │  ✓ PCI Compliant         │
│                           │  ✓ Secure Gateway        │
│  Pricing:                 │                            │
│  ├─ Subtotal: ₦13,500     │                            │
│  ├─ Shipping: ₦2,500      │                            │
│  ├─ Tax (7.5%): ₦1,200    │                            │
│  └─ TOTAL: ₦17,200        │                            │
│                           │                            │
│  Billing Information:     │                            │
│  ├─ Name: John Doe        │                            │
│  ├─ Email: john@email.com │                            │
│  ├─ Phone: +234 801 XXXX  │                            │
│  └─ Address: 123 Main St  │                            │
│                           │                            │
│  ┌─────────────────────┐  │                            │
│  │ [Pay ₦17,200]       │  │                            │
│  │ Powered by Paystack │  │                            │
│  └─────────────────────┘  │                            │
│                           │                            │
└──────────────────────────────────────────────────────────┘
              ↓
         Click Pay
              ↓
   Redirect to Paystack
```

---

## 4. PAYSTACK CHECKOUT (Hosted)
```
┌─────────────────────────────────────┐
│  Paystack Payment Gateway           │
├─────────────────────────────────────┤
│                                     │
│  Amount: ₦17,200                    │
│  Email: john@email.com              │
│                                     │
│  Payment Method:                    │
│  ┌─────────────────────────────┐   │
│  │ 💳 Card                     │   │
│  │ [Use Card]                  │   │
│  │                             │   │
│  │ Card Number: [4111 XXXX...] │   │
│  │ Exp: [12/25]                │   │
│  │ CVV: [***]                  │   │
│  │                             │   │
│  │ [Pay Now]                   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
         ↓
    Payment Processing
         ↓
    Enter OTP (if required)
         ↓
    ✓ Payment Successful
         ↓
   Redirect back to App
```

---

## 5. PROCESSING STATE (After Payment)
```
┌─────────────────────────────────────┐
│         🔒 Processing Payment...    │
├─────────────────────────────────────┤
│                                     │
│         [Animation]                 │
│         ● ● ●  (bouncing)           │
│                                     │
│  Your payment is being verified.    │
│  Your invoice will be generated     │
│  automatically.                     │
│                                     │
└─────────────────────────────────────┘
        ↓ (2-3 seconds)
   Payment Verified
        ↓
   Invoice Generated
        ↓
   Cart Cleared
        ↓
   SUCCESS SCREEN
```

---

## 6. SUCCESS SCREEN ✓
```
┌──────────────────────────────────────────────────────┐
│         ✓ Order Confirmed!                          │
├──────────────────────────────────────────────────────┤
│  Thank you for your purchase                        │
│  Invoice: INV-2024-001                             │
│  Order #: ORD-1234567890-ABC                       │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │             INVOICE PREVIEW                  │ │
│  │  ┌────────────────────────────────────────┐ │ │
│  │  │ EMPI                                   │ │ │
│  │  │ 123 Main St, Lagos, Nigeria            │ │ │
│  │  │                                        │ │ │
│  │  │ BILL TO:           SHIPPING METHOD:    │ │ │
│  │  │ John Doe           EMPI Shipping       │ │ │
│  │  │ john@email.com     Est. 3-5 days      │ │ │
│  │  │ +234 801 XXXX                         │ │ │
│  │  │ 123 Main St                           │ │ │
│  │  │                                        │ │ │
│  │  │ ITEMS:                                 │ │ │
│  │  │ Costume A (x2)  ₦5,000  ₦10,000      │ │ │
│  │  │ Costume B (x1)  ₦3,500  ₦3,500       │ │ │
│  │  │                                        │ │ │
│  │  │ Subtotal:              ₦13,500        │ │ │
│  │  │ Shipping:              ₦2,500         │ │ │
│  │  │ Tax (7.5%):            ₦1,200         │ │ │
│  │  │ ──────────────────────────────        │ │ │
│  │  │ TOTAL:                 ₦17,200        │ │ │
│  │  │                                        │ │ │
│  │  │ STATUS: ✓ PAID                        │ │ │
│  │  │ Ref: flw_pf_test_xxxxx...            │ │ │
│  │  │                                        │ │ │
│  │  └────────────────────────────────────────┘ │ │
│  │                                             │ │
│  │  [Print Invoice] [Download Invoice]        │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  What happens next?                               │
│  ✓ Confirmation email sent                       │
│  ✓ Invoice saved (can print/download anytime)   │
│  ✓ Items prepared and shipped within 24-48h     │
│  ✓ Tracking number sent via email               │
│                                                    │
│  [Continue Shopping]  [View Cart]                │
│                                                    │
└──────────────────────────────────────────────────┘
         ↓
    Order Complete
         ↓
    Invoice Stored
         ↓
    Cart Empty
```

---

## 7. ERROR HANDLING FLOW
```
Payment Form
    ↓
Click Pay Button
    ↓
Error Scenarios:
    ├─ Invalid Email
    │  └─ Error: "Please enter a valid email"
    │     └─ Stay on Form (Retry)
    │
    ├─ Missing Phone
    │  └─ Error: "Phone number is required"
    │     └─ Stay on Form (Retry)
    │
    ├─ Amount Too Low
    │  └─ Error: "Amount must be at least ₦1"
    │     └─ Stay on Form (Retry)
    │
    ├─ Network Error
    │  └─ Error: "Payment initialization failed"
    │     └─ Stay on Form (Retry)
    │
    └─ Payment Declined
       └─ Error: "Payment was not successful"
          └─ Show Paystack error
             └─ Return to Form (Retry)
```

---

## 8. MOBILE LAYOUT (< 640px)
```
┌──────────────────────┐
│   EMPI Header        │
├──────────────────────┤
│                      │
│ 💳 Complete Payment  │
│                      │
│ Order: ORD-123...    │
│                      │
│ Items:               │
│ • Costume A (x2)     │
│   ₦10,000            │
│ • Costume B (x1)     │
│   ₦3,500             │
│                      │
│ Subtotal: ₦13,500   │
│ Shipping: ₦2,500     │
│ Tax: ₦1,200          │
│ TOTAL: ₦17,200      │
│                      │
│ Billing:             │
│ John Doe             │
│ john@email.com       │
│ +234 801 XXXX        │
│ 123 Main St          │
│                      │
│ [Pay ₦17,200]        │
│                      │
│ Order Info:          │
│ Status: Awaiting ... │
│                      │
│ Security: SSL, etc   │
│                      │
│ Powered by Paystack  │
│                      │
├──────────────────────┤
│      Footer          │
└──────────────────────┘
```

---

## 9. STATE DIAGRAM
```
┌─────────────┐
│  START      │
└──────┬──────┘
       │
       ├─ Items in Cart?
       │  ├─ NO → [Empty Cart Screen]
       │  └─ YES ↓
       │
       ├─ User Logged In?
       │  ├─ NO → [Auth Prompt Modal]
       │  │       ├─ Register/Login → [Logged In]
       │  │       └─ Continue as Guest → [Payment Form]
       │  └─ YES → [Payment Form]
       │
       ├─ [Payment Form]
       │  ├─ Review Order
       │  ├─ Click Pay
       │  └─ → Paystack
       │
       ├─ [Processing State]
       │  ├─ Verify Payment
       │  ├─ Generate Invoice
       │  └─ Clear Cart
       │
       ├─ Success?
       │  ├─ NO → [Error Message]
       │  │       └─ Retry → [Payment Form]
       │  └─ YES → [Success Screen]
       │
       └─ [Success Screen]
          ├─ Invoice Details
          ├─ Print/Download
          └─ Continue Shopping

```

---

## 10. Data Flow Diagram
```
CLIENT (Browser)
    │
    ├─ Cart Items
    │   └─ [Stored in CartContext]
    │
    ├─ User Info
    │   └─ [Stored in BuyerContext]
    │
    └─ (1) Initialize Payment
        │
        └─→ SERVER
            │
            ├─ (2) Create Paystack Charge
            │   └─→ PAYSTACK API
            │       ├─ Validate Amount
            │       ├─ Create Transaction
            │       └─ Return Reference
            │
            ├─ (3) Return Authorization URL
            │
            └─→ CLIENT (Browser)
                │
                └─ (4) Redirect to Paystack
                   │
                   └─ User Completes Payment
                      │
                      └─ Paystack Webhook
                         │
                         └─→ SERVER
                             │
                             ├─ Verify Signature
                             ├─ Extract Payment Data
                             ├─ Update Order Status
                             └─ Store Transaction
                         
                         Paystack Redirects Back
                         │
                         └─ (5) Verify Payment
                            │
                            └─→ SERVER
                                │
                                ├─ Query Paystack
                                ├─ Confirm Status
                                └─ Return Success
                            
                            CLIENT (6) Creates Invoice
                            │
                            ├─ Generate Invoice #
                            ├─ Add Payment Ref
                            ├─ Save to Storage
                            └─ Clear Cart
                            
                            SUCCESS SCREEN
```

---

## Complete User Journey Summary

```
1️⃣  User adds items to cart
     ↓
2️⃣  Clicks "Proceed to Checkout"
     ↓
3️⃣  Decides to register, login, or continue as guest
     ↓
4️⃣  Reviews order on beautiful payment form
     ↓
5️⃣  Clicks "Pay ₦X" button
     ↓
6️⃣  Redirected to Paystack hosted checkout
     ↓
7️⃣  Enters card details and completes payment
     ↓
8️⃣  Redirected back to app
     ↓
9️⃣  App verifies payment with Paystack
     ↓
🔟 Invoice generated and cart cleared
     ↓
1️⃣1️⃣ Success screen with invoice displayed
     ↓
1️⃣2️⃣ User can print, download, or continue shopping
```

---

## Success Metrics

✅ **User Experience**
- Clear step-by-step flow
- Mobile responsive
- Error recovery
- Visual feedback at each stage

✅ **Data Security**
- No sensitive data stored
- Server-side verification
- HMAC webhook validation
- Secure payment reference

✅ **Reliability**
- Error handling for all scenarios
- Retry capability
- Payment verification
- Cart persistence until confirmed payment

✅ **Compliance**
- PCI DSS compliant (via Paystack)
- Data protection
- Payment reference tracking
- Secure communication (HTTPS)

---

**Status: Ready for Production** 🚀
