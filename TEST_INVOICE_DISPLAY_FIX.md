# ✅ Invoice Display Fix - Test Checklist

## Changes Applied
- ✅ `/app/api/orders/route.ts` - Added invoice linking to buyer (lines 168-236)
- ✅ `/app/dashboard/page.tsx` - Updated to fetch invoices from API (lines 227-290)

---

## Testing Steps

### Test 1: Make a Payment (Guest Checkout)
**Setup:**
- Don't log in
- Go to `/checkout`
- Add items to cart
- Fill customer info with YOUR email

**Payment:**
- Click "Pay with Paystack"
- Use test card: `4111 1111 1111 1111`
- Complete payment

**Check Console:**
```
[Orders API] 🔗 Checking for existing invoice to link to buyer...
[Orders API] ✅ Found existing invoice from payment: INV-xxx-xxx
[Orders API] ✅ Found guest buyer ID: 6954165139ded2f62b1734b5
[Orders API] ✅ Invoice linked to buyer and updated with order details:
  invoiceNumber: INV-xxx-xxx
  buyerId: 6954165139ded2f62b1734b5
  customerEmail: your-email@example.com
  totalAmount: 50000
```

**Expected:**
- ✅ No errors in console
- ✅ Order created successfully
- ✅ Success modal shows
- ✅ Email invoice received

### Test 2: View Invoices in Dashboard
**After payment completes:**

1. Go to `/dashboard`
2. Look for "Invoices" tab
3. Should show:
   - Invoice number (INV-xxx)
   - Invoice date
   - Amount
   - Status

**Check Console:**
```
[Dashboard] Fetching invoices for: your-email@example.com
[Dashboard] Fetched invoices from API: 1
```

**Expected:**
- ✅ Invoices tab shows your invoice
- ✅ Invoice details are correct
- ✅ Amount matches payment

### Test 3: Verify Database Connection
**From browser DevTools Console:**
```javascript
// This fetch should return your invoice
fetch('/api/invoices?email=your-email@example.com')
  .then(r => r.json())
  .then(data => console.log('Invoices:', data))
```

**Expected Output:**
```json
[
  {
    "_id": "...",
    "invoiceNumber": "INV-xxx-xxx",
    "orderNumber": "ref_xxx",
    "customerEmail": "your-email@example.com",
    "buyerId": "...",
    "paymentVerified": true,
    "totalAmount": 50000,
    "status": "sent"
  }
]
```

---

## Verification Checklist

### Invoice Creation
- [ ] Invoice created in database during verify-payment
- [ ] Invoice has `paymentVerified: true`
- [ ] Invoice has `orderNumber` set to Paystack reference

### Invoice Linking
- [ ] Invoice found by orderNumber during order creation
- [ ] Invoice updated with `buyerId` 
- [ ] Invoice updated with complete customer details
- [ ] Invoice updated with order items and amounts

### Dashboard Display
- [ ] Dashboard fetches from `/api/invoices?email=...`
- [ ] Invoice appears in Invoices tab
- [ ] Invoice details display correctly
- [ ] Works for guest users (no login needed)

### Email Delivery
- [ ] Customer receives invoice email
- [ ] Admin receives copy of invoice email
- [ ] Email contains invoice number and details

---

## Troubleshooting

### Issue: Invoices tab is empty
**Check 1: Are invoices in database?**
```bash
# In MongoDB, check invoices collection
db.invoices.find({ customerEmail: "your-email@example.com" })
```

**Check 2: Is API working?**
```javascript
// In browser console
fetch('/api/invoices?email=your-email@example.com')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Check 3: Check dashboard console for errors**
```
[Dashboard] Error fetching invoices: [error message]
```

### Issue: API returns empty list
**Cause:** Invoice wasn't linked with buyerId

**Fix:**
1. Check if order was created successfully
2. Check if verify-payment ran successfully
3. Look for: `[Orders API] ✅ Found existing invoice from payment:`
   - If missing: Order linking failed
   - Check console for errors

### Issue: Invoice has wrong customer info
**Cause:** Invoice wasn't updated during order creation

**Fix:**
Check logs for:
```
[Orders API] ✅ Invoice linked to buyer and updated with order details
```

If missing, linking failed. Check for error:
```
[Orders API] ⚠️ Failed to link invoice to buyer
```

---

## Success Criteria

✅ All tests pass when:

1. **Payment Flow Works**
   - Paystack payment completes
   - Invoice email sent
   - Success modal shows

2. **Invoice Linking Works**
   - `[Orders API] ✅ Invoice linked to buyer` in logs
   - Invoice has buyerId in database
   - Invoice has all order details

3. **Dashboard Shows Invoice**
   - Invoices tab displays invoice
   - Invoice number, date, amount correct
   - Works for guest users

4. **API Returns Invoice**
   - `/api/invoices?email=...` returns invoice
   - Invoice has buyerId
   - Invoice has paymentVerified: true

---

## Quick Summary

**Fixed:** Buyer can now see invoices in their dashboard after making a payment

**How It Works:**
1. Payment → Invoice created (no buyerId)
2. Order saved → Invoice found and linked with buyerId
3. Dashboard fetches → Invoice returned from API
4. User sees → Invoice in dashboard invoice tab

**Test:** Make payment as guest, go to dashboard, see invoice!
