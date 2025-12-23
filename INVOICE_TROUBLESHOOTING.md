# 🔍 Invoice Display Troubleshooting Guide

## Current Situation
Invoices are not showing in the user's invoice tab despite orders being created and invoices being generated.

## Recent Changes Made

### 1. **Database Fetching** ✅
- **File:** `/app/invoices/page.tsx`
- **Change:** Modified to fetch invoices from MongoDB via `/api/invoices` endpoint instead of just localStorage
- **Details:**
  - Uses `buyerId` for registered users
  - Falls back to `email` for guest users
  - Fetches from `/api/invoices?buyerId={id}` or `/api/invoices?email={email}`
  - Added loading state while fetching

### 2. **Email Support** ✅
- **File:** `/app/api/invoices/route.ts`
- **Change:** Added email parameter support in GET endpoint
- **Details:**
  - Can now search invoices by `customerEmail` field
  - Query: `GET /api/invoices?email=user@example.com`

### 3. **Email Sending** ✅
- **File:** `/lib/email.ts`
- **Function:** `sendInvoiceEmail()`
- **Details:**
  - Sends invoice to both customer and admin
  - Generates professional invoice HTML
  - Logs success/failure

### 4. **Order API Enhancement** ✅
- **File:** `/app/api/orders/route.ts`
- **Change:** Added invoice email sending after successful invoice creation
- **Details:**
  - Calls `/api/invoices` to create invoice
  - If successful, sends email to customer and admin
  - Non-blocking (email failures don't fail order)

### 5. **Enhanced Logging** ✅
- **File:** `/app/api/invoices/route.ts`
- **Details:**
  - Detailed logs at every step
  - Shows query parameters received
  - Shows saved invoice verification
  - Shows serialized data

## Diagnostic Checklist

### 🔧 Before Testing
- [ ] Ensure MongoDB is running
- [ ] Check database connection works
- [ ] Verify `.env` has correct MongoDB URI

### 📝 Testing Steps

#### Step 1: Create a Test Order
```bash
node test-invoice-diagnostic.js
```

Expected output:
- ✅ Order created with orderNumber
- ✅ Invoice number returned in response
- ✅ Server logs show invoice creation steps

#### Step 2: Check Server Logs
When running the diagnostic script, watch for:

**Order Creation:**
```
✅ Order created: ORD-2025-xxxxx for test@example.com
Order status: confirmed
[Orders API] Generating invoice for order: ORD-2025-xxxxx
```

**Invoice Creation:**
```
📥 Invoice request body: { invoiceNumber, customerName, ... }
📋 Extracted fields: { invoiceNumber, customerName, customerEmail, customerPhone }
🔨 Creating new invoice with data: { ... }
💾 Saving invoice to database...
📋 Verified saved invoice: { _id, invoiceNumber, customerEmail, totalAmount }
✅ Invoice saved: INV-1703-xxxxx (automatic) for buyer: guest
```

**Email Sending:**
```
[Orders API] Sending invoice emails...
[Orders API] Invoice emails sent - Customer: true Admin: true
```

#### Step 3: Query MongoDB Directly
```bash
# In MongoDB shell or client
db.invoices.find({}).sort({createdAt: -1}).limit(5)

# Look for your test invoice
db.invoices.findOne({customerEmail: "test@example.com"})
```

Expected:
- Invoice document exists
- Has `customerEmail`, `invoiceNumber`, `totalAmount` fields
- `createdAt` timestamp is recent

#### Step 4: Test API Endpoints

**Fetch all invoices:**
```bash
curl "http://localhost:3000/api/invoices"
```

Expected: Array of invoice objects

**Fetch by email:**
```bash
curl "http://localhost:3000/api/invoices?email=test@example.com"
```

Expected: Array with matching invoice

**Fetch by buyerId (if logged in):**
```bash
curl "http://localhost:3000/api/invoices?buyerId=507f1f77bcf86cd799439011"
```

Expected: Array of invoices for that buyer

#### Step 5: Test Frontend
1. Create order via checkout
2. Go to `/invoices` page (user must be logged in or email stored)
3. Check browser console for errors
4. Check for loading state → data display

## Common Issues & Solutions

### Issue: Invoice Not in Database

**Check:**
1. Is `connectDB()` being called? → Check logs for "Database connected"
2. Is `await invoice.save()` completing? → Check logs for "Invoice saved"
3. Are required fields present? → Check logs for validation errors

**Fix:**
- Verify MongoDB URI in `.env`
- Check database has `invoices` collection
- Ensure Mongoose connection is active

### Issue: Invoice API Returning Empty Array

**Check:**
1. Is query parameter correct? → Check logs for "Query object:"
2. Are invoices being saved? → Check MongoDB directly
3. Is email matching? → Case-sensitive comparison

**Fix:**
```bash
# Test with case-insensitive search
db.invoices.find({customerEmail: /^test@example.com$/i})
```

### Issue: Frontend Not Showing Invoices

**Check:**
1. Is component mounted? → Check "isHydrated" state
2. Is fetchInvoices() being called? → Check for `📥 Fetching invoices from database`
3. Is API responding? → Check network tab in DevTools
4. Are invoices being returned? → Check response in DevTools

**Fix:**
- Ensure buyer context is loaded
- Check localStorage has `guest_email` if guest user
- Verify query parameters in network request

### Issue: Email Not Sending

**Check:**
1. Is `sendInvoiceEmail()` being called? → Check logs for "Sending invoice emails"
2. Is RESEND_API_KEY set? → Check `.env`
3. Is email format valid? → Validate email addresses

**Fix:**
- Set `RESEND_API_KEY` in `.env`
- Check email addresses are correct
- Monitor Resend dashboard for delivery status

## Logs to Look For

### Successful Flow
```
✅ Order created: ORD-2025-xxxxx
[Orders API] Calling /api/invoices with: { invoiceNumber, customerName, ... }
🔨 Creating new invoice with data: { ... }
💾 Saving invoice to database...
✅ Invoice saved: INV-1703-xxxxx (automatic)
[Orders API] Sending invoice emails...
📧 Invoice email results - Customer: ✅, Admin: ✅
[Orders API] Invoice successfully created: INV-1703-xxxxx
```

### Failure Points
```
❌ CRITICAL Error in invoice endpoint:
Error: ValidationError
```
→ Check required fields are being sent

```
📋 Fetched 0 invoices with query: { customerEmail: "..." }
```
→ Check invoice was actually saved to database

```
⚠️ Email service not configured (missing RESEND_API_KEY)
```
→ Set email API key in `.env`

## Database Schema Check

```javascript
// Check Invoice collection schema
db.invoices.findOne({})

// Should have these fields:
{
  _id: ObjectId,
  invoiceNumber: String,    // Required, unique
  orderNumber: String,
  buyerId: ObjectId,        // May be null for guests
  customerEmail: String,    // Required
  customerName: String,     // Required
  customerPhone: String,    // Required
  totalAmount: Number,
  items: Array,
  invoiceDate: Date,
  createdAt: Date,
  updatedAt: Date,
  type: String,             // 'automatic' or 'manual'
  status: String            // 'sent', 'paid', etc.
}
```

## Next Steps

1. **Run the diagnostic script:**
   ```bash
   npm run dev
   # In another terminal:
   node test-invoice-diagnostic.js
   ```

2. **Check all three logs:**
   - Server console (terminal running `npm run dev`)
   - Browser console (F12 → Console tab)
   - MongoDB (via client tool or command line)

3. **Identify the failure point:**
   - Order creation ❌ → Order API issue
   - Invoice creation ❌ → /api/invoices POST issue
   - Invoice retrieval ❌ → /api/invoices GET issue
   - Frontend display ❌ → Component/query issue

4. **Report findings with:**
   - Exact error message from logs
   - Request/response data
   - Database state

## Key Files for Debugging

1. `/app/api/invoices/route.ts` - POST/GET endpoint (with detailed logs)
2. `/app/invoices/page.tsx` - Frontend display
3. `/app/dashboard/page.tsx` - Dashboard invoice section
4. `/app/api/orders/route.ts` - Order creation & invoice trigger
5. `/lib/email.ts` - Email sending
6. `/lib/models/Invoice.ts` - Schema definition

---

**Remember:** Check logs at every step! The detailed logging will show exactly where the process is breaking down.
