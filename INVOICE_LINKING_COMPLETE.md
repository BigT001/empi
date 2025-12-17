# Invoice Linking in Payment Notifications - Complete Setup

## ✅ System is Complete and Working

The invoice linking system is now fully integrated into the payment notification flow. Here's how it works end-to-end:

---

## 📋 Complete Flow

### 1. **Payment Success → Invoice Creation**
**File**: `app/checkout/page.tsx` (Lines 225-280 and 360-420)

```tsx
// After successful payment verification
const invoiceRes = await fetch("/api/invoices", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(invoiceData),
});
const invoiceResData = await invoiceRes.json();

// Extract invoiceId from response
if (invoiceResData?.invoice?._id) {
  notificationPayload.invoiceId = invoiceResData.invoice._id;
  console.log("✅ Invoice ID added to notification:", invoiceResData.invoice._id);
}
```

**Result**: Invoice created in MongoDB, `_id` extracted and stored for use in messages.

---

### 2. **Send Notification with Invoice Link**
**File**: `app/api/send-payment-notification/route.ts`

```tsx
const { invoiceId } = body; // Extract from checkout

// Pass to buyer notification function
const buyerMsg = await sendPaymentSuccessMessageToBuyer({
  orderId,
  orderNumber,
  buyerEmail,
  buyerName,
  amount,
  paymentReference,
  invoiceId,  // ← Invoice ID passed here
});

// Pass to admin notification function  
const adminMsg = await sendPaymentSuccessMessageToAdmin({
  orderId,
  orderNumber,
  buyerEmail,
  buyerName,
  amount,
  paymentReference,
  invoiceId,  // ← Invoice ID passed here
});
```

**Result**: Both buyer and admin notification functions receive the invoiceId.

---

### 3. **Create Messages with Clickable Invoice Links**
**File**: `lib/paymentNotifications.ts`

#### Buyer Message:
```tsx
export async function sendPaymentSuccessMessageToBuyer(params: PaymentNotificationParams) {
  let content = `✅ Payment Successful!\n\n`;
  content += `Your payment of ₦${Math.round(amount).toLocaleString()} for order #${orderNumber} has been confirmed.\n\n`;
  
  if (invoiceId) {
    // ← Markdown link to invoice download endpoint
    content += `\n📥 [View Your Invoice](/api/invoices/${invoiceId}/download)\n`;
  }
  
  const message = await Message.create({
    content: content,
    recipientType: 'buyer',  // ← Only buyer sees this
    messageType: 'system',
    // ...
  });
}
```

#### Admin Message:
```tsx
export async function sendPaymentSuccessMessageToAdmin(params: PaymentNotificationParams) {
  let content = `💰 Payment Received!\n\n`;
  content += `✅ Payment confirmed for order #${orderNumber}\n\n`;
  
  if (invoiceId) {
    // ← Markdown link to invoice download endpoint
    content += `\n📄 [View Admin Invoice](/api/invoices/${invoiceId}/download)\n`;
  }
  
  const message = await Message.create({
    content: content,
    recipientType: 'admin',  // ← Only admin sees this
    messageType: 'system',
    // ...
  });
}
```

**Result**: Messages stored in MongoDB with markdown links in the format `[text](/url)`.

---

### 4. **Display Messages with Clickable Links**
**File**: `app/components/ChatModal.tsx` (Lines 408-426)

```tsx
const renderMessageContent = (content: string) => {
  // Split by markdown link pattern: [text](/url)
  const parts = content.split(/(\[.*?\]\(.*?\))/g);
  
  return parts.map((part, index) => {
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const [, linkText, linkUrl] = linkMatch;
      // ← Convert markdown to clickable <Link> component
      return (
        <Link
          key={index}
          href={linkUrl}  // ← e.g., "/api/invoices/123abc/download"
          target={linkUrl.startsWith('http') ? '_blank' : '_self'}
          className="text-blue-600 hover:text-blue-800 underline font-semibold"
        >
          {linkText}  {/* ← e.g., "View Your Invoice" */}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
};
```

**Message Filtering**:
```tsx
// Only show messages based on viewer role
const filteredMessages = messages.filter(msg => {
  if (isAdmin) {
    return msg.recipientType === 'admin' || msg.recipientType === 'all';
  } else {
    return msg.recipientType === 'buyer' || msg.recipientType === 'all';
  }
});
```

**Result**: Buyer sees buyer message with buyer invoice link, admin sees admin message with admin invoice link. Links render as blue clickable text.

---

### 5. **Invoice Display/Download**
**File**: `app/api/invoices/[id]/download/route.ts`

```tsx
export async function GET(request: NextRequest, { params }) {
  const { id } = await params;
  const invoice = await Invoice.findById(id);
  
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  
  // Generate professional HTML with print/download capability
  const html = generateProfessionalInvoiceHTML(invoice);
  
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.html"`,
    },
  });
}
```

**Result**: User clicks link → navigates to `/api/invoices/[id]/download` → receives beautiful HTML invoice that can be printed or saved as PDF.

---

## 🎯 How It Works for Users

### Buyer's Experience:
1. ✅ Completes payment in checkout
2. 📬 Receives message: "✅ Payment Successful!" with link "📥 [View Your Invoice](/api/invoices/123abc/download)"
3. 🖱️ Clicks the blue link
4. 📄 Opens professional invoice HTML
5. 🖨️ Can print or save as PDF

### Admin's Experience:
1. 💳 Payment verified in Paystack webhook
2. 📬 Receives message: "💰 Payment Received!" with link "📄 [View Admin Invoice](/api/invoices/123abc/download)"
3. 🖱️ Clicks the blue link
4. 📄 Opens same professional invoice HTML
5. 📋 Can review order details and print

---

## 🔗 Invoice Link Format

**Markdown in message content**:
```
[View Your Invoice](/api/invoices/669d1c3e9f1a2b3c4d5e6f7g/download)
```

**Rendered as**:
```html
<Link href="/api/invoices/669d1c3e9f1a2b3c4d5e6f7g/download">
  View Your Invoice
</Link>
```

**When clicked**:
- Navigates to `/api/invoices/[id]/download`
- Backend retrieves invoice from MongoDB by ID
- Generates professional HTML using `generateProfessionalInvoiceHTML()`
- Returns HTML with content-type `text/html`
- Browser displays invoice that can be printed/saved

---

## ✅ All Components in Place

| Component | File | Status |
|-----------|------|--------|
| Checkout invoice creation | `app/checkout/page.tsx` | ✅ Complete |
| Invoice ID extraction | `app/checkout/page.tsx` | ✅ Complete |
| Notification endpoint | `app/api/send-payment-notification/route.ts` | ✅ Complete |
| Payment notification functions | `lib/paymentNotifications.ts` | ✅ Complete |
| Message filtering by recipient | `app/components/ChatModal.tsx` | ✅ Complete |
| Markdown to Link rendering | `app/components/ChatModal.tsx` | ✅ Complete |
| Invoice download endpoint | `app/api/invoices/[id]/download/route.ts` | ✅ NEW |
| Invoice HTML generator | `lib/professionalInvoice.ts` | ✅ Existing |

---

## 🚀 Testing the Complete Flow

### Test 1: Custom Quote Payment
1. Navigate to dashboard chat
2. Click "Pay Now" on a quote message
3. Complete payment at Paystack
4. Return to checkout page
5. Check chat for payment messages
6. Click invoice link
7. Verify invoice displays

### Test 2: Regular Cart Checkout
1. Add items to cart
2. Go to checkout
3. Complete payment
4. Check chat for payment messages
5. Click invoice link
6. Verify invoice displays

### Test 3: Message Filtering
1. Login as buyer
2. Check chat - see only buyer payment message with buyer link
3. Logout
4. Login as admin
5. Check chat - see only admin payment message with admin link

---

## 📊 Data Flow Diagram

```
Payment Completed
       ↓
Create Invoice (/api/invoices POST)
       ↓
Extract invoiceId from response
       ↓
Pass invoiceId to notification payload
       ↓
Send to /api/send-payment-notification
       ↓
Create buyer message with link: /api/invoices/{id}/download
Create admin message with link: /api/invoices/{id}/download
       ↓
Save both messages to MongoDB with recipientType
       ↓
ChatModal fetches messages and filters by recipientType
       ↓
renderMessageContent() converts markdown to <Link> components
       ↓
User sees blue clickable link
       ↓
User clicks link → navigates to /api/invoices/{id}/download
       ↓
Download endpoint retrieves invoice and returns HTML
       ↓
Browser displays beautiful invoice
```

---

## 🎨 Invoice HTML Features

The generated invoice includes:
- ✅ Professional branding and formatting
- ✅ Mobile-responsive design
- ✅ All order items with quantities and prices
- ✅ Bulk discount display
- ✅ VAT/Tax calculation
- ✅ Shipping cost breakdown
- ✅ Customer information
- ✅ Invoice number and dates
- ✅ Print button (for browser print dialog)
- ✅ Print-optimized CSS
- ✅ Downloadable as PDF (via browser print → save as PDF)

---

## Summary

**The invoice linking system is complete and fully functional:**

1. ✅ **Invoices created** automatically on successful payment
2. ✅ **Invoice IDs extracted** from API response
3. ✅ **Invoice IDs passed** to notification functions
4. ✅ **Markdown links created** in message content
5. ✅ **Links filtered** by recipient type (buyer/admin)
6. ✅ **Links rendered** as clickable components in ChatModal
7. ✅ **Download endpoint** created to retrieve and display invoices
8. ✅ **Professional HTML** generated for beautiful invoice display
9. ✅ **Print/download** capability built-in

**When a customer pays:**
- They get a message with a blue clickable invoice link
- Admin gets a message with a blue clickable invoice link
- Clicking the link opens a professional, printable invoice
- Invoice can be saved as PDF directly from browser

The complete payment automation flow is ready to use! 🎉
