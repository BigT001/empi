# 📋 EXPECTED CONSOLE OUTPUT - Complete Sequence

## When Payment Succeeds (in order)

```
✅ Paystack loaded
🔵 Opening iframe...
[Modal appears on screen - user completes payment]
[User selects "Success"]
[Modal closes]
🔴 Modal closed - verifying payment...
📊 Verification data: {
  success: true,
  reference: "EMPI-1732012345-abc123",
  amount: 5625000,
  status: "success",
  customer: {...}
}
✅ Payment verified! Calling handlePaymentSuccess
🟢 Payment success handler called
Reference: EMPI-1732012345-abc123
📮 Saving order...
✅ Order saved
📋 Generating invoice...
✅ Invoice generated
🧹 Clearing cart and showing success modal
[Success modal appears on screen with green checkmark]
```

**Total Logs: 12 messages = Success!**

---

## When Payment Verification Fails

```
✅ Paystack loaded
🔵 Opening iframe...
[Modal appears]
🔴 Modal closed - verifying payment...
📊 Verification data: {
  success: false,
  status: "failed",
  message: "Payment not verified"
}
⚠️ Payment verification returned false
```

**Red error box shows:** "Payment not confirmed. Please check your email or try again."

---

## When Order Save Fails

```
✅ Paystack loaded
🔵 Opening iframe...
🔴 Modal closed - verifying payment...
✅ Payment verified! Calling handlePaymentSuccess
🟢 Payment success handler called
Reference: EMPI-1732012345-abc123
📮 Saving order...
❌ Order save failed
```

**Red error box shows:** "Failed to save order. Please contact support."
**Check:** MongoDB connection, Order model, API endpoint

---

## When Invoice Generation Fails

```
✅ Paystack loaded
🔵 Opening iframe...
🔴 Modal closed - verifying payment...
✅ Payment verified! Calling handlePaymentSuccess
🟢 Payment success handler called
Reference: EMPI-1732012345-abc123
📮 Saving order...
✅ Order saved
📋 Generating invoice...
❌ Invoice generation failed
🧹 Clearing cart and showing success modal
```

**Note:** Order saved but invoice failed
**Action:** Check invoice endpoint, verify required fields

---

## When Paystack SDK Fails to Load

```
⏳ Retrying Paystack load...
⏳ Retrying Paystack load...
[continues retrying]
❌ Setup error: PaystackPop is not a function
```

**Red error box shows:** "Failed to open payment modal"
**Check:** 
- Paystack public key in environment
- Script loaded in layout.tsx
- Internet connection

---

## Normal Payment Flow Output (Color Coded)

### Timeline View:
```
TIME    |  LOG                                        | STATUS
--------|---------------------------------------------|----------
0ms     | ✅ Paystack loaded                          | Ready
50ms    | 🔵 Opening iframe...                        | Opening
100ms   | [Modal on screen]                           | Waiting
500ms   | [User completes payment]                    | Processing
600ms   | 🔴 Modal closed - verifying payment...      | Checking
700ms   | 📊 Verification data: {success: true}       | Verified ✅
800ms   | ✅ Payment verified!                        | Confirmed
810ms   | 🟢 Payment success handler called           | Handler running
820ms   | 📮 Saving order...                          | DB write
900ms   | ✅ Order saved                              | Order done
910ms   | 📋 Generating invoice...                    | DB write
950ms   | ✅ Invoice generated                        | Invoice done
960ms   | 🧹 Clearing cart and showing modal          | UI update
970ms   | [Success modal appears]                     | Complete ✅
```

---

## Database State After Success

### MongoDB Orders Collection
```javascript
db.orders.findOne({status: "completed"})

{
  _id: ObjectId("..."),
  orderNumber: "EMPI-1732012345-abc123",
  customer: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+234801234567"
  },
  items: [
    {
      productId: "prod-123",
      name: "Product Name",
      quantity: 2,
      price: 25000,
      mode: "buy"
    }
  ],
  pricing: {
    subtotal: 50000,
    tax: 3750,
    shipping: 2500,
    total: 56250
  },
  status: "completed",
  createdAt: ISODate("2024-11-24T10:30:00.000Z")
}
```

### MongoDB Invoices Collection
```javascript
db.invoices.findOne({type: "automatic"})

{
  _id: ObjectId("..."),
  invoiceNumber: "INV-EMPI-1732012345-abc123",
  orderNumber: "EMPI-1732012345-abc123",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "+234801234567",
  subtotal: 50000,
  shippingCost: 2500,
  taxAmount: 3750,
  totalAmount: 56250,
  items: [...],
  invoiceDate: ISODate("2024-11-24T10:30:05.000Z"),
  type: "automatic",
  status: "paid"
}
```

---

## Success Modal Content

### Screen Display:
```
┌─────────────────────────────────────┐
│                 ✕                   │  ← Close button
├─────────────────────────────────────┤
│                                     │
│           ✓                         │  ← Green checkmark
│      Payment Successful!            │
│   Your order has been confirmed     │
│     and is being processed.         │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ Reference Number:            │   │
│  │ EMPI-1732012345-abc123       │   │
│  │                              │   │
│  │ Amount Paid:                 │   │
│  │ ₦56,250.00                   │   │
│  └──────────────────────────────┘   │
│                                     │
│  What's Next?                       │
│  ✓ Invoice has been generated       │
│  ✓ Order confirmation email sent    │
│  ✓ Track delivery status            │
│                                     │
│  [Go to Dashboard] [Continue Shop]  │
│                                     │
│  A confirmation email has been sent │
│  to your registered email address.  │
│                                     │
└─────────────────────────────────────┘
```

---

## Cart State After Success

### Before Payment:
```
Cart Items:
  - Product A (2) ............... ₦50,000
  - Product B (1) ............... ₦15,000
Subtotal: ........................ ₦65,000
Shipping: ....................... ₦2,500
Tax (7.5%): ..................... ₦4,875
Total: .......................... ₦72,375

Button: [Pay ₦72,375]
```

### After Success:
```
Cart Items: [EMPTY]

Message: "Your cart is empty"
Button: [Continue Shopping]
```

---

## Error Messages Expected

### Incomplete Profile
```
❌ Error: Please ensure your profile has complete information
   (Missing: Name, Email, or Phone)
```

### Payment Verification Failed
```
❌ Error: Payment not confirmed. Please check your email or try again.
   (Paystack couldn't verify the transaction)
```

### Order Save Failed
```
❌ Error: Failed to save order. Please contact support.
   (MongoDB connection issue or validation error)
```

### Payment Failed
```
❌ Error: Payment failed. Please try again.
   (Paystack returned error during payment)
```

### Generic Error
```
❌ Error: An error occurred. Please try again.
   (Unexpected JavaScript error)
```

---

## DevTools Inspection

### Network Tab Should Show:
```
POST /api/orders                200 OK     ← Order saved
POST /api/invoices              200 OK     ← Invoice created
GET  /api/verify-payment?ref=...  200 OK   ← Payment verified
```

### Application Tab Should Show:
```
Cart (localStorage):
  Before: {items: [{id, name, quantity, price}]}
  After:  {} (empty)

Buyer Context:
  fullName: "John Doe"
  email: "john@example.com"
  phone: "+234801234567"
```

### Console Filters:
- ✅ No errors (red messages)
- ✅ No warnings (yellow messages)
- ✅ Only info/success messages (green/blue)

---

## Quick Checklist: "All Good If..."

- [ ] 12 console logs appear in correct order
- [ ] No red error messages in console
- [ ] Success modal appears on screen
- [ ] Modal shows reference starting with "EMPI-"
- [ ] Modal shows total amount
- [ ] Cart becomes empty
- [ ] New order in MongoDB
- [ ] New invoice in MongoDB
- [ ] Network requests show 200 OK
- [ ] Can click "Go to Dashboard"
- [ ] Can click "Continue Shopping"

**All checked = SUCCESS! 🎉**

---

**Test now at http://localhost:3000/checkout**
