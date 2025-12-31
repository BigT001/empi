# Payment Flow - Implementation Code Reference

## 🔗 How Everything Connects

```
Checkout Page (/app/checkout/page.tsx)
    ↓
    Calls: /api/initialize-payment
    ↓
    Gets: authorization_url from Paystack
    ↓
    Opens: Paystack Modal
    ↓
    User makes payment...
    ↓
    Paystack redirects to: /checkout?reference=xyz
    ↓
    Page detects reference in URL
    ↓
    Calls: /api/verify-payment?reference=xyz
    ↓
    PAYSTACK API VERIFIES PAYMENT ⭐
    ↓
    Invoice Created ⭐
    ↓
    Admin Notified ⭐
    ↓
    Success Modal Shows ⭐
```

---

## 1️⃣  Initialize Payment (`/api/initialize-payment/route.ts`)

**What it does:** Creates payment session with Paystack

```typescript
POST /api/initialize-payment
Body: {
  email: "customer@example.com",
  amount: 5000000, // in kobo (₦50,000)
  reference: "EMPI-1767116896870-mf2b3vbvu",
  firstname: "John",
  lastname: "Doe",
  phone: "+2348012345678"
}

Returns: {
  success: true,
  authorization_url: "https://checkout.paystack.com/...",
  access_code: "...",
  reference: "EMPI-1767116896870-mf2b3vbvu"
}
```

**Key Code:**
```typescript
const initializeUrl = 'https://api.paystack.co/transaction/initialize';
const response = await fetch(initializeUrl, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email,
    amount: Math.round(Number(amount)), // Must be in kobo
    reference,
    first_name: firstname,
    last_name: lastname,
    phone: phone,
    callback_url: `https://yoursite.com/checkout?reference=${reference}`,
  }),
});
```

---

## 2️⃣  Verify Payment (`/api/verify-payment/route.ts`) ⭐ CRITICAL

**What it does:** Verifies payment with Paystack API, creates invoice, notifies admin

### 2.1: Verify with Paystack
```typescript
const reference = request.nextUrl.searchParams.get('reference');
const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;

const response = await fetch(verifyUrl, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
// data.data.status === 'success' ✅
// data.data.amount (in kobo)
// data.data.customer (email, name, phone)
```

### 2.2: Update Order Status
```typescript
if (customOrder) {
  customOrder.status = 'pending';
  await customOrder.save();
}

if (order) {
  order.status = 'pending';
  await order.save();
}
```

### 2.3: Generate Invoice ⭐
```typescript
const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
const invoiceDate = new Date();
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + 30);

const invoice = new Invoice({
  invoiceNumber,
  orderNumber: actualOrder.orderNumber,
  buyerId: actualOrder.buyerId || null,
  customerName: actualOrder.firstName || actualOrder.fullName,
  customerEmail: actualOrder.email,
  customerPhone: actualOrder.phone || '',
  customerAddress: actualOrder.address || '',
  customerCity: actualOrder.city || '',
  customerState: actualOrder.state || '',
  customerPostalCode: actualOrder.zipCode || '',
  subtotal: actualOrder.subtotal || actualOrder.quotedPrice || 0,
  shippingCost: actualOrder.shippingCost || 0,
  taxAmount: actualOrder.vat || actualOrder.quotedVAT || 0,
  totalAmount: actualOrder.total || actualOrder.quotedTotal || 0,
  items: (actualOrder.items || []).map((item: any) => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    mode: item.mode,
  })),
  invoiceDate,
  dueDate,
  currency: 'NGN',
  currencySymbol: '₦',
  taxRate: actualOrder.vatRate || 7.5,
  type: 'automatic',
  status: 'sent',
});

await invoice.save();
console.log('[verify-payment] ✅ Invoice created:', invoiceNumber);
```

### 2.4: Send Invoice Email
```typescript
const invoiceHtml = generateProfessionalInvoiceHTML({
  invoiceNumber,
  customerName: invoice.customerName,
  customerEmail: invoice.customerEmail,
  customerPhone: invoice.customerPhone,
  customerAddress: invoice.customerAddress,
  customerCity: invoice.customerCity,
  customerState: invoice.customerState,
  customerPostalCode: invoice.customerPostalCode,
  subtotal: invoice.subtotal,
  shippingCost: invoice.shippingCost,
  taxAmount: invoice.taxAmount,
  totalAmount: invoice.totalAmount,
  items: invoice.items,
  invoiceDate: invoice.invoiceDate,
  dueDate: invoice.dueDate,
  currency: 'NGN',
  currencySymbol: '₦',
  taxRate: invoice.taxRate,
});

const emailResult = await sendInvoiceEmail(
  customerEmail,
  customerName,
  invoiceNumber,
  invoiceHtml,
  reference
);

console.log('[verify-payment] ✅ Invoice email sent to:', customerEmail);
```

### 2.5: Send Buyer Confirmation Message
```typescript
const messageRes = await fetch(`${baseUrl}/api/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: orderData._id?.toString(),
    orderNumber: reference,
    senderEmail: 'system@empi.com',
    senderName: 'EMPI System',
    senderType: 'admin',
    content: `✅ Payment Confirmed!\n\nWe've received your payment of ₦${(data.data.amount / 100).toLocaleString()}.\n\nYour order is now confirmed and will be processed shortly. You'll be prompted to select your delivery method next.\n\nThank you for your order!`,
    messageType: 'system',
    recipientType: 'buyer',
  }),
});
```

### 2.6: Return Success Response
```typescript
return NextResponse.json({
  success: true,
  reference: data.data.reference,
  amount: data.data.amount,
  status: data.data.status,
  customer: data.data.customer,
});
```

---

## 3️⃣  Frontend Handles Success (`/app/checkout/page.tsx`)

### 3.1: Detect Payment Reference in URL
```typescript
useEffect(() => {
  const reference = searchParams.get('reference');
  if (reference) {
    console.log('[Checkout] 📋 Reference from URL:', reference);
    setSuccessReference(reference);
    // Verify payment with backend
    verifyPaymentWithBackend(reference);
  }
}, [searchParams]);
```

### 3.2: Verify Payment with Backend
```typescript
const verifyPaymentWithBackend = async (reference: string) => {
  try {
    setVerifyingPayment(true);
    console.log('[Checkout] 📡 Calling /api/verify-payment with reference:', reference);
    
    const verifyRes = await fetch(`/api/verify-payment?reference=${reference}`);
    const verifyData = await verifyRes.json();
    
    if (verifyData.success) {
      console.log('[Checkout] ✅ Payment verified successfully');
      console.log('[Checkout] Customer:', verifyData.customer);
      
      // Show success modal
      setPaymentSuccessful(true);
      
    } else {
      console.error('[Checkout] ❌ Payment verification failed:', verifyData);
      setOrderError('Payment verification failed. Please contact support.');
    }
  } catch (error) {
    console.error('[Checkout] ❌ Error verifying payment:', error);
    setOrderError('Error verifying payment. Please try again.');
  } finally {
    setVerifyingPayment(false);
  }
};
```

### 3.3: Show Success Modal
```typescript
{paymentSuccessful && (
  <PaymentSuccessModal
    isOpen={true}
    orderReference={successReference}
    total={totalAmount}
    onClose={() => {
      router.push('/dashboard');
    }}
  />
)}
```

---

## 4️⃣  Payment Success Modal (`/app/components/PaymentSuccessModal.tsx`)

**What it displays:**

```tsx
<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
    {/* Success Icon */}
    <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 mb-4">
      <CheckCircle className="h-10 w-10 text-white" />
    </div>

    {/* Heading */}
    <h2 className="text-2xl font-bold">Payment Successful!</h2>
    <p className="text-sm text-gray-600 mb-4">Your order has been confirmed.</p>

    {/* Order Details */}
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <p className="text-xs text-gray-500">Reference Number</p>
      <p className="font-mono font-semibold text-lime-600">{orderReference}</p>
      
      <p className="text-xs text-gray-500 mt-2">Amount Paid</p>
      <p className="text-lg font-bold">₦{total.toLocaleString()}</p>
    </div>

    {/* Message */}
    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
      <p className="text-xs text-orange-900">
        Your order is being processed. 
        <span className="font-semibold">Production will start once payment is confirmed.</span> 
        You can chat with our admin team for updates.
      </p>
    </div>

    {/* Buttons */}
    <Link href="/dashboard" className="block bg-gradient-to-r from-lime-600 to-green-600 text-white">
      Go to Dashboard
    </Link>
    <Link href="/" className="block bg-gray-200">
      Continue Shopping
    </Link>
  </div>
</div>
```

---

## 5️⃣  Admin Notification (`/lib/paymentNotifications.ts`)

### 5.1: Create Admin Message
```typescript
export async function sendPaymentSuccessMessageToAdmin(params: PaymentNotificationParams) {
  const { orderId, orderNumber, buyerEmail, buyerName, amount, paymentReference, invoiceId } = params;

  let content = `💰 Payment Received!\n\n`;
  content += `✅ Payment confirmed for order #${orderNumber}\n\n`;
  content += `👤 Customer: ${buyerName}\n`;
  content += `📧 Email: ${buyerEmail}\n`;
  content += `💵 Amount: ₦${Math.round(amount).toLocaleString()}\n`;
  content += `🔖 Payment Reference: ${paymentReference || 'N/A'}\n`;
  
  if (invoiceId) {
    content += `\n📄 [View Admin Invoice](/api/invoices/${invoiceId}/download)\n`;
  }
  
  content += `\nOrder is ready for processing. 🚀`;

  const message = await Message.create({
    orderId: orderId || null,
    orderNumber: orderNumber,
    senderEmail: 'system@empi.com',
    senderName: 'System',
    senderType: 'system',
    content: content,
    messageType: 'system',
    recipientType: 'admin', // ← Goes to admin inbox
    isRead: false,
  });

  return message;
}
```

### 5.2: Admin Sees in Inbox
```
📩 Admin Inbox

💰 Payment Received!

✅ Payment confirmed for order #EMPI-1767116896870-mf2b3vbvu

👤 Customer: John Doe
📧 Email: john@example.com
💵 Amount: ₦50,000
🔖 Payment Reference: response123456

📄 View Invoice

Order is ready for processing. 🚀
```

---

## Environment Variables Required

```
# Paystack Integration
NEXT_PUBLIC_PAYSTACK_KEY=pk_live_xxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com

# MongoDB (for saving invoices and messages)
MONGODB_URI=mongodb+srv://...

# Email Service (for invoice emails)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Complete Data Flow

```
Frontend (Checkout Page)
  ↓
  POST /api/initialize-payment
  ↓ (Gets authorization_url)
  ↓
  Opens Paystack Modal
  ↓ (User enters card)
  ↓
  Paystack processes payment
  ↓ (Redirects with reference in URL)
  ↓
  GET /api/verify-payment?reference=xyz
  ↓
  Backend verifies with Paystack API ⭐
  ↓ (If status = 'success')
  ├─ Update Order.status = 'pending'
  ├─ Generate Invoice ⭐
  ├─ Send Invoice Email ⭐
  ├─ Create Message for Admin ⭐
  ├─ Create Message for Buyer ⭐
  └─ Return success response
  ↓
  Frontend shows PaymentSuccessModal ⭐
  ↓
  Admin sees notification in inbox ⭐
  ↓
  Admin clicks "Approve"
  ↓
  Order.status = 'approved'
  ↓
  Production starts ✅
```

---

## Testing Checklist

- [ ] Test card: `4111 1111 1111 1111`
- [ ] Any future expiry date (e.g., 12/30)
- [ ] Any 3-digit CVV (e.g., 123)
- [ ] Watch success modal appear
- [ ] Check invoice in customer email
- [ ] Check admin notification in inbox
- [ ] Admin can approve order
- [ ] Order moves to "approved" status

---

**Complete Implementation Reference**  
**Last Updated:** December 30, 2025
