# Invoice Generation Unified Across Payment Paths

## Overview
Invoice generation now uses the same function (`createInvoiceFromOrder`) for both payment approval paths:
1. **Admin Manual Approval** - Via `/api/admin/orders/confirm-payment` 
2. **Paystack Automatic Payment** - Via checkout → `/api/orders`

This ensures consistent invoice formatting, numbering, and email delivery regardless of how payment is approved.

## Changes Made

### 1. **`/app/api/orders/route.ts`** - Added Invoice Generation
**What Changed:**
- Imported `createInvoiceFromOrder` from `@/lib/createInvoiceFromOrder`
- Added automatic invoice generation when order status is `confirmed` or `completed`
- Returns invoice details in API response for client confirmation

**Code Addition:**
```typescript
// Generate invoice automatically (for Paystack payments and checkout orders)
let invoiceResult = null;
if (body.status === 'confirmed' || body.status === 'completed') {
  try {
    console.log('[Orders API] Generating invoice for order:', order.orderNumber);
    invoiceResult = await createInvoiceFromOrder(order);
    if (invoiceResult.success) {
      console.log('[Orders API] Invoice generated:', invoiceResult.invoiceNumber);
    }
  } catch (invoiceError) {
    console.error('[Orders API] Invoice generation failed:', invoiceError);
    // Don't fail order creation if invoice generation fails
  }
}
```

**API Response:**
```json
{
  "success": true,
  "orderId": "order_id",
  "reference": "order_number",
  "message": "Order saved successfully",
  "invoice": {
    "invoiceNumber": "INV-1234567890-ABC123",
    "invoiceId": "invoice_id"
  }
}
```

### 2. **`/app/checkout/page.tsx`** - Simplified Payment Handler
**What Changed:**
- Removed inline invoice creation code (now handled by API)
- Changed order status from `"completed"` to `"confirmed"` to trigger API-side invoice generation
- Simplified `handlePaymentSuccess` function - just saves order and shows modal
- Invoice generation is now automatic and consistent

**Before:**
```typescript
// Old: Created invoice manually in checkout
const invoiceRes = await fetch("/api/invoices", {
  method: "POST",
  body: JSON.stringify(invoiceData), // Custom invoice creation
});
```

**After:**
```typescript
// New: Order API creates invoice automatically
const res = await fetch("/api/orders", {
  method: "POST",
  body: JSON.stringify(orderData), // status: "confirmed" triggers invoice generation
});

const orderRes = await res.json();
console.log("Invoice generated:", orderRes.invoice?.invoiceNumber);
```

### 3. **Existing Function** - `/lib/createInvoiceFromOrder.ts`
**Unchanged but Now Used By:**
- Admin confirm payment route → Invoice generated with professional email
- Checkout Paystack payment → Invoice generated with professional email
- Both paths use identical logic for consistency

## Invoice Generation Flow

### Admin Manual Approval Path
```
Admin confirms payment
    ↓
POST /api/admin/orders/confirm-payment
    ↓
Order.paymentStatus = 'confirmed'
    ↓
createInvoiceFromOrder(order) [CALLED HERE]
    ↓
Invoice created + Email sent
```

### Paystack Automatic Payment Path
```
User completes Paystack payment
    ↓
handlePaymentSuccess() in checkout
    ↓
POST /api/orders (status: "confirmed")
    ↓
createInvoiceFromOrder(order) [CALLED HERE]
    ↓
Invoice created + Email sent
```

## Invoice Data Generated

When `createInvoiceFromOrder(order)` is called, it generates:

### Invoice Record (MongoDB)
- **invoiceNumber**: Unique format `INV-{timestamp}-{randomId}`
- **orderNumber**: Links to order
- **buyerId**: Customer reference
- **customerName, email, phone**: Contact information
- **Items**: Product details from order
- **Pricing**: Subtotal, shipping, tax, caution fee, total
- **Dates**: Invoice date + 30-day due date
- **Status**: "sent" (email sent to customer)
- **Type**: "automatic" (system-generated)

### Invoice Email
Professional HTML email with:
- EMPI branding
- Invoice and order details
- Item breakdown with quantities and prices
- Cost summary (subtotal, shipping, tax, total)
- Payment confirmation status
- Next steps information
- Support contact details

## Benefits

1. **Consistency**: Both payment paths generate identical invoice format
2. **No Duplicates**: Single invoice generation logic prevents double invoices
3. **Professional**: Same professional email template for all customers
4. **Simplified Code**: Checkout page no longer needs invoice logic
5. **Maintainability**: Any invoice format changes only need updating in one place
6. **Traceability**: All invoices use the same invoice numbering scheme

## Order Status Values

- **pending**: Initial state (no payment yet)
- **confirmed**: Payment confirmed → Triggers invoice generation ✅
- **completed**: Legacy/final state
- **awaiting_payment**: Payment expected
- **cancelled**: Order cancelled

## Testing Checklist

✅ **Admin Confirms Payment:**
- Order saved with status "confirmed"
- Invoice generated automatically
- Invoice email sent to customer
- Invoice number in response

✅ **User Pays via Paystack:**
- Paystack payment completed
- Order saved with status "confirmed"
- Invoice generated automatically
- Invoice email sent to customer
- Success modal shows invoice reference
- Both orders have same invoice format

✅ **Error Handling:**
- If invoice generation fails, order is still created
- Failure logs appear but don't block order processing
- Customer notified of order even if invoice email fails

## Related Files

- `/lib/createInvoiceFromOrder.ts` - Shared invoice generation function
- `/lib/models/Invoice.ts` - Invoice schema
- `/lib/email.ts` - Email sending utility
- `/app/api/admin/orders/confirm-payment/route.ts` - Admin payment confirmation
- `/app/checkout/page.tsx` - Customer checkout with Paystack
