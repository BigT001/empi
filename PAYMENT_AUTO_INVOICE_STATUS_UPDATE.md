# Automatic Invoice Generation & Status Update on Payment Verification

## Overview
When a payment is verified successfully via Paystack, the system now:
1. ✅ Automatically updates custom order status from "pending" → "approved"
2. ✅ Automatically generates an invoice with a unique invoice number
3. ✅ Automatically sends the invoice to the customer via email
4. ✅ Admin dashboard immediately reflects the status change (pending card moves to approved tab)

---

## Changes Made

### File: `/app/api/verify-payment/route.ts`

#### 1. Added Imports
```typescript
import Invoice from '@/lib/models/Invoice';
import { sendInvoiceEmail } from '@/lib/email';
import { generateProfessionalInvoiceHTML } from '@/lib/professionalInvoice';
```

#### 2. Payment Success Handler Enhanced
When payment verification succeeds (`data.data?.status === 'success'`):

**A. Status Update**
```typescript
// Update custom order status to "approved" if it's a custom order
if (customOrder) {
  customOrder.status = 'approved';
  await customOrder.save();
}

// Update regular order status if needed
if (order) {
  order.status = 'confirmed';
  await order.save();
}
```

**B. Automatic Invoice Generation**
```typescript
const invoice = new Invoice({
  invoiceNumber,           // Unique: INV-{timestamp}-{random}
  orderNumber,
  buyerId,
  customerName,
  customerEmail,
  customerPhone,
  // ... all address and item details
  invoiceDate,
  dueDate,                 // 30 days from now
  currency: 'NGN',
  currencySymbol: '₦',
  type: 'automatic',
  status: 'sent',
});
await invoice.save();
```

**C. Email Invoice to Customer**
```typescript
const invoiceHtml = generateProfessionalInvoiceHTML({...});
const emailResult = await sendInvoiceEmail(
  customerEmail,
  customerName,
  invoiceNumber,
  invoiceHtml,
  reference
);
```

---

## Flow Diagram

```
Payment Made
    ↓
Paystack Webhook/Checkout Redirect
    ↓
/api/verify-payment called with reference
    ↓
Paystack API confirms payment status = 'success'
    ↓
📌 UPDATE STATUS
  ├─ Custom Order: pending → approved
  └─ Regular Order: confirmed
    ↓
📄 GENERATE INVOICE
  ├─ Create invoice in MongoDB
  ├─ Invoice number: INV-{timestamp}-{random}
  └─ Status: 'sent'
    ↓
📧 SEND EMAIL
  ├─ Generate HTML invoice
  └─ Send to customer
    ↓
✅ Admin Dashboard Updates
  └─ Pending card automatically moves to Approved tab
```

---

## User Experience

### For Customer
1. Makes payment via Paystack
2. Payment verified automatically
3. ✅ Receives invoice email immediately with:
   - Unique invoice number
   - Order details
   - All items and pricing
   - Payment confirmation

### For Admin
1. Pending order in dashboard
2. Payment made by customer
3. ✅ Order automatically:
   - Status changes from "pending" to "approved"
   - Invoice is created and ready to view
   - Card moves to "Approved" tab automatically
4. Admin can now start production without manual intervention

---

## Invoice Details

Each automatically generated invoice includes:
- **Invoice Number**: Unique format `INV-{timestamp}-{randomCode}`
- **Order Number**: Links to the original order
- **Customer Info**: Name, email, phone, address
- **Items**: All products/services with quantities and prices
- **Pricing**:
  - Subtotal
  - Tax/VAT (7.5%)
  - Shipping cost
  - Total amount
- **Dates**:
  - Invoice date (current)
  - Due date (30 days from invoice date)
- **Status**: 'sent' (invoice has been delivered)

---

## Error Handling

If invoice generation or email sending fails:
- ✅ Payment verification is NOT affected
- ✅ Status update still completes
- ⚠️ Warning logged to console
- ✅ Order is confirmed regardless

```typescript
try {
  // Invoice generation and email
} catch (invoiceError) {
  console.error('[verify-payment] ❌ Invoice generation failed:', invoiceError);
  // Don't fail payment verification
}
```

---

## Logging

All steps are logged with emoji prefixes for easy debugging:
- 🔍 Database lookup
- 🔗 Connection status
- 📝 Status updates
- 📄 Invoice generation
- 📧 Email sending
- ✅ Success confirmations
- ⚠️ Warnings
- ❌ Errors

Example log output:
```
✅ Payment verified as successful for reference: PAY-12345
🔗 Connecting to database...
✅ Database connected
🔍 Looking for order with reference: PAY-12345
📊 Order lookup results: { orderFound: true, customOrderFound: false }
📧 Preparing to process payment...
📝 Updating order status to confirmed
✅ Order status updated to confirmed
📄 Generating invoice for order: PAY-12345
✅ Invoice created: INV-1703343600000-A7F2B9
📧 Sending invoice email to customer
✅ Invoice email sent
```

---

## Admin Dashboard Impact

### Before This Update
- Admin must manually:
  1. View pending card
  2. Create invoice manually
  3. Update status to approved
  4. Send invoice email

### After This Update
- ✅ Everything automatic:
  1. Payment verified
  2. Status automatically updated
  3. Invoice automatically created
  4. Email automatically sent
  5. Dashboard automatically refreshes pending card → approved card

---

## Testing

To test the flow:
1. Create a custom order with chat
2. Send quote to customer
3. Customer clicks "Pay Now"
4. Customer completes payment in Paystack
5. ✅ Admin dashboard updates automatically:
   - Card moves from "Pending" to "Approved" tab
   - Invoice is generated and accessible
   - Customer receives invoice email

---

## Configuration Required

Ensure these are configured:
- `.env.local` has `PAYSTACK_SECRET_KEY`
- MongoDB collections exist:
  - `customorders` (or CustomOrder model)
  - `orders` (or Order model)
  - `invoices` (or Invoice model)
- Email service configured for `sendInvoiceEmail()`

---

## Future Enhancements

Possible additions:
- [ ] SMS notification to customer with invoice link
- [ ] Payment confirmation page redirect
- [ ] Webhook retry logic if email fails
- [ ] Invoice PDF download link
- [ ] Automatic payment receipt generation
