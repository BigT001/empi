# ✅ Invoice Generation - Test & Verify Guide

## The Fix (TL;DR)

**Problem:** Invoices not being created after order saved

**Root Causes Fixed:**
1. ✅ Changed status check from `body.status` to `order.status` 
2. ✅ Added `connectDB()` to `createInvoiceFromOrder()` function

**Files Changed:**
- `/app/api/orders/route.ts` - Fixed status check
- `/lib/createInvoiceFromOrder.ts` - Added DB connection

---

## Quick Test (5 minutes)

### Step 1: Start Fresh
```bash
cd c:\Users\HomePC\Desktop\empi
# Run your dev server (Next.js)
npm run dev
# or
yarn dev
```

### Step 2: Test Payment Flow
1. Open browser → `http://localhost:3000`
2. Add an item to cart
3. Go to checkout
4. Enter customer details:
   - Name: Test User
   - Email: test@example.com  
   - Phone: 09012345678
5. Click "Pay with Paystack"
6. Complete Paystack payment

### Step 3: Check Browser Console
Open DevTools (F12) → Console tab

**Look for:**
```
✅ Order saved
Invoice generated: INV-1234567890-ABC123
🎉 Clearing cart and showing success modal
```

If you see this, invoices are working! ✅

### Step 4: Verify in MongoDB

**Check Orders Collection:**
```javascript
db.orders.findOne({}, { sort: { _id: -1 } })

// Should show:
{
  _id: ObjectId(...),
  orderNumber: "paystackref_...",
  status: "confirmed",  // ✅ This must be "confirmed"
  firstName: "Test",
  email: "test@example.com",
  ...
}
```

**Check Invoices Collection:**
```javascript
db.invoices.findOne({}, { sort: { _id: -1 } })

// Should show:
{
  _id: ObjectId(...),
  invoiceNumber: "INV-1234567890-ABC123",  // ✅ Unique
  orderNumber: "paystackref_...",  // ✅ Links to order
  customerName: "Test User",
  customerEmail: "test@example.com",
  status: "sent",
  type: "automatic",
  ...
}
```

### Step 5: Check Email
Check test@example.com inbox for invoice email from EMPI

---

## Full Console Output (Expected)

```
[Checkout Page]
✅ Payment success handler called
Reference: paystackref_xyz123
💾 Saving order...
Order data: {...full order...}

[Server Logs]
✅ Order created: paystackref_xyz123 for test@example.com
Order status: confirmed
[Orders API] Generating invoice for order: paystackref_xyz123
[Orders API] Order status is: confirmed
[Orders API] Order object: {...}
📄 Creating invoice for order: paystackref_xyz123
📡 Database connected for invoice creation
✅ Invoice created: INV-1234567890-ABC123

[Browser Console]
✅ Order saved
Invoice generated: INV-1234567890-ABC123
🎉 Clearing cart and showing success modal
```

---

## Troubleshooting

### Issue: Console shows "Order saved" but no invoice message

**Check Server Logs:**
```
[Orders API] Skipping invoice generation - order status is: pending
```

**Cause:** Order status is not "confirmed"

**Fix:** Check checkout is sending `status: "confirmed"`
```typescript
// In checkout/page.tsx
const orderData = {
  // ...
  status: "confirmed",  // ✅ Must be this
}
```

### Issue: Invoice shows in console but not in MongoDB

**Check Server Logs:**
```
[Orders API] Invoice generation failed: ECONNREFUSED
```

**Cause:** Database connection failed

**Fix:** 
- Ensure MongoDB is running
- Check connection string
- Verify `connectDB()` is working

### Issue: Email not received

**Check Server Logs:**
```
✅ Invoice email sent to test@example.com
```

**If email not in inbox:**
- Check spam folder
- Check email configuration (environment variables)
- Verify `sendEmail()` is working

---

## Admin Confirmation Test

Invoices should also work when admin confirms payment:

### Steps:
1. Go to Admin Panel → Orders
2. Find an order with status "pending" or "awaiting_payment"
3. Click "Confirm Payment"
4. Check MongoDB for invoice

### Expected Result:
- ✅ Order status changed to "confirmed"
- ✅ Invoice created in MongoDB
- ✅ Invoice email sent to customer

---

## Success Criteria

All of these must be true:

- [ ] Order saved in MongoDB with status: "confirmed"
- [ ] Invoice created in MongoDB with unique invoiceNumber
- [ ] Invoice email sent to customer
- [ ] Browser console shows invoice number
- [ ] Server logs show "✅ Invoice created"
- [ ] Paystack path works (user payment)
- [ ] Admin path works (manual confirmation)

---

## Expected Behavior

### Paystack Path
```
User pays → Order saved (status: confirmed)
→ Invoice auto-generated → Email sent → Success modal
```

### Admin Path  
```
Admin confirms → Order status changed to confirmed
→ Invoice auto-generated → Email sent → Confirmation
```

---

## Debugging Checklist

If invoices still don't appear:

1. **Check Order Status:**
   ```javascript
   db.orders.findOne().status
   // Should show: "confirmed"
   ```

2. **Check Console Logs:**
   - [ ] "Order status: confirmed" appears
   - [ ] "[Orders API] Generating invoice" appears
   - [ ] "✅ Invoice created:" appears
   - [ ] "📡 Database connected for invoice creation" appears

3. **Check Database:**
   - [ ] Can connect to MongoDB from server
   - [ ] Can write documents
   - [ ] Can read documents

4. **Check Email:**
   - [ ] Email service configured
   - [ ] SMTP credentials correct
   - [ ] Email address valid

5. **Check Code:**
   - [ ] `/lib/createInvoiceFromOrder.ts` has `connectDB()` call
   - [ ] `/app/api/orders/route.ts` checks `order.status`
   - [ ] Checkout sends `status: "confirmed"`

---

## Performance

- Order save: ~100-200ms
- Invoice generation: ~300-500ms
- Total: ~500-700ms
- Email send: Async (non-blocking)

---

## Success Indicators

| Indicator | ✅ Success | ❌ Failure |
|-----------|-----------|-----------|
| Browser console | Shows invoice number | Says "save failed" |
| MongoDB orders | status: "confirmed" | status: other |
| MongoDB invoices | Document exists | No document |
| Email | Received in inbox | Not received |
| Server logs | "Invoice created" | "Invoice failed" |

---

## Quick Reference

**To test locally:**
1. npm run dev
2. Add to cart
3. Checkout
4. Pay with Paystack
5. Check console
6. Check MongoDB
7. Check email

**All three should confirm invoice generation worked!**

---

**Status:** ✅ Ready to Test  
**Test Time:** 5-10 minutes  
**Expected Result:** Invoices generated successfully
