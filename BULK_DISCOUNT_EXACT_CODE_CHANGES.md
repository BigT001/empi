# BULK DISCOUNT - EXACT CODE CHANGES

## File 1: CustomOrderCard.tsx
**Location**: `/app/admin/dashboard/components/CustomOrderCard.tsx`

### Change 1: Add Import (Line 6)
```typescript
// ADDED:
import { getDiscountPercentage } from '@/lib/discountCalculator';
```

### Change 2: Update calculateTotals Function (Lines 193-224)
```typescript
// BEFORE:
const calculateTotals = (items: typeof lineItems) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;
  return { subtotal, vat, total };
};

// AFTER:
const calculateTotals = (items: typeof lineItems) => {
  // Step 1: Calculate subtotal (before discount)
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
  // Step 2: Calculate total quantity across all items (used for discount tier)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Step 3: Get discount percentage based on TOTAL quantity
  const discountPercentage = getDiscountPercentage(totalQuantity);
  
  // Step 4: Calculate discount amount
  const discountAmount = subtotal * (discountPercentage / 100);
  
  // Step 5: Apply discount to get subtotal after discount
  const subtotalAfterDiscount = subtotal - discountAmount;
  
  // Step 6: Calculate VAT on the discounted subtotal
  const vat = subtotalAfterDiscount * VAT_RATE;
  
  // Step 7: Calculate final total
  const total = subtotalAfterDiscount + vat;
  
  return { 
    subtotal, 
    discountPercentage, 
    discountAmount,
    subtotalAfterDiscount,
    vat, 
    total,
    totalQuantity,
  };
};
```

### Change 3: Update handleSendQuote Payload (Lines 272-307)
```typescript
// BEFORE:
const quoteItemsToSend = lineItems.map(({ id, ...item }) => item);
const payload = {
  quoteItems: quoteItemsToSend,
  quotedPrice: totals.total,
};

// AFTER:
const quoteItemsToSend = lineItems.map(({ id, ...item }) => item);
const payload = {
  quoteItems: quoteItemsToSend,
  quotedPrice: totals.total,
  // 🎁 NEW: Include discount information with the quote
  discountPercentage: totals.discountPercentage,
  discountAmount: totals.discountAmount,
  subtotal: totals.subtotal,
  subtotalAfterDiscount: totals.subtotalAfterDiscount,
  requiredQuantity: totals.totalQuantity,
};
```

### Change 4: Add Discount Display in Pricing Summary (Lines 813-845)
```typescript
// BEFORE:
{lineItems.length > 0 && (
  <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg p-4 border-2 border-emerald-300 space-y-2">
    <div className="flex justify-between text-sm">
      <span className="font-semibold text-gray-700">Subtotal:</span>
      <span className="font-bold text-gray-900">₦{totals.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>
    <div className="flex justify-between text-sm border-t border-emerald-200 pt-2">
      <span className="font-semibold text-gray-700">VAT (7.5%):</span>
      <span className="font-bold text-emerald-600">₦{totals.vat.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>
    <div className="flex justify-between text-lg border-t-2 border-emerald-300 pt-2">
      <span className="font-bold text-gray-900">Total:</span>
      <span className="font-black text-emerald-600">₦{totals.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>
  </div>
)}

// AFTER:
{lineItems.length > 0 && (
  <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg p-4 border-2 border-emerald-300 space-y-2">
    <div className="flex justify-between text-sm">
      <span className="font-semibold text-gray-700">Subtotal:</span>
      <span className="font-bold text-gray-900">₦{totals.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>
    {/* 🎁 NEW: Show discount if applicable */}
    {totals.discountPercentage > 0 && (
      <div className="flex justify-between text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
        <span>🎁 Discount ({totals.discountPercentage}%)</span>
        <span>-₦{totals.discountAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
      </div>
    )}
    <div className="flex justify-between text-sm border-t border-emerald-200 pt-2">
      <span className="font-semibold text-gray-700">VAT (7.5%):</span>
      <span className="font-bold text-emerald-600">₦{totals.vat.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>
    <div className="flex justify-between text-lg border-t-2 border-emerald-300 pt-2">
      <span className="font-bold text-gray-900">Total:</span>
      <span className="font-black text-emerald-600">₦{totals.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>
  </div>
)}
```

### Change 5: Add Discount Badge in PAYMENT VERIFIED Section (Lines 950-970)
```typescript
// BEFORE:
<div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300 p-5 space-y-4">
  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">✅ Payment Verified</h4>
  
  <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-semibold text-gray-700">Total Amount</span>
      <span className="text-2xl font-black text-blue-600">₦{totals.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>
    <p className="text-xs text-gray-600 text-center">Customer has completed payment</p>
  </div>

// AFTER:
<div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300 p-5 space-y-4">
  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">✅ Payment Verified</h4>
  
  <div className="bg-white rounded-lg p-4 border-2 border-blue-200 space-y-2">
    {/* 🎁 NEW: Discount badge if applicable */}
    {totals.discountPercentage > 0 && (
      <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2 mb-2">
        <p className="text-xs font-semibold text-blue-700">
          🎁 Bulk Discount Applied: {totals.discountPercentage}% (-₦{totals.discountAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })})
        </p>
      </div>
    )}
    
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-700">Total Amount</span>
      <span className="text-2xl font-black text-blue-600">₦{totals.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
    </div>
    <p className="text-xs text-gray-600 text-center">Customer has completed payment</p>
  </div>
```

---

## File 2: UnifiedOrder.ts
**Location**: `/lib/models/UnifiedOrder.ts`

### Change 1: Add to Interface (After Line 66)
```typescript
// BEFORE:
subtotal: number;
vat: number;
discountPercentage?: number;
discountAmount?: number;
shippingCost?: number;
total: number;

// AFTER:
subtotal: number;
vat: number;
discountPercentage?: number;
discountAmount?: number;
subtotalAfterDiscount?: number;  // NEW: Subtotal after discount is applied
shippingCost?: number;
total: number;
```

### Change 2: Add to Schema (After Line 206)
```typescript
// BEFORE:
discountPercentage: Number,
discountAmount: Number,
shippingCost: Number,

// AFTER:
discountPercentage: Number,
discountAmount: Number,
subtotalAfterDiscount: Number,  // NEW
shippingCost: Number,
```

---

## File 3: checkout/page.tsx
**Location**: `/app/checkout/page.tsx`

### Change 1: Load Discount from Database (Lines 62-91)
```typescript
// BEFORE:
if (quote.orderId && !buyer?.id) {
  console.log('[Checkout] Loading customer info from custom order:', quote.orderId);
  fetch(`/api/orders/unified/${quote.orderId}`)
    .then(res => res.json())
    .then(customOrder => {
      if (customOrder && customOrder.firstName) {
        const fullName = `${customOrder.firstName} ${customOrder.lastName || ''}`.trim();
        setGuestCustomer({
          fullName: fullName || '',
          email: (customOrder.email || '').toLowerCase(),
          phone: customOrder.phone || '',
        });
        console.log('[Checkout] ✅ Loaded guest customer from unified order:', {...});
      }
    })
    .catch(err => console.error('[Checkout] Error loading custom order:', err));
}

// AFTER:
if (quote.orderId && !buyer?.id) {
  console.log('[Checkout] Loading customer info from custom order:', quote.orderId);
  fetch(`/api/orders/unified/${quote.orderId}`)
    .then(res => res.json())
    .then(customOrder => {
      if (customOrder && customOrder.firstName) {
        const fullName = `${customOrder.firstName} ${customOrder.lastName || ''}`.trim();
        setGuestCustomer({
          fullName: fullName || '',
          email: (customOrder.email || '').toLowerCase(),
          phone: customOrder.phone || '',
        });
        
        // 🎁 NEW: ALSO LOAD DISCOUNT FROM DATABASE if it was persisted
        if (customOrder.discountPercentage !== undefined || customOrder.discountAmount !== undefined) {
          console.log('[Checkout] 🎁 Loaded discount from database:', {
            discountPercentage: customOrder.discountPercentage,
            discountAmount: customOrder.discountAmount,
          });
          
          // Update the quote with database discount values
          setCustomQuote(prev => ({
            ...prev,
            discountPercentage: customOrder.discountPercentage || 0,
            discountAmount: customOrder.discountAmount || 0,
          }));
        }
        
        console.log('[Checkout] ✅ Loaded guest customer from unified order:', {...});
      }
    })
    .catch(err => console.error('[Checkout] Error loading custom order:', err));
}
```

### Change 2: Extract Discount During Calculation (Lines 462-510)
```typescript
// BEFORE:
let shippingCost, taxEstimate, totalAmount, displayItems, displayTotal, displaySubtotal, discountAmount = 0, discountPercentage = 0, displaySubtotalAfterDiscount = 0;

if (customQuote) {
  const quotedPrice = typeof customQuote.quotedPrice === 'number' ? customQuote.quotedPrice : parseFloat(customQuote.quotedPrice) || 0;
  const quotedVAT = typeof customQuote.quotedVAT === 'number' ? customQuote.quotedVAT : parseFloat(customQuote.quotedVAT) || 0;
  const quotedTotal = typeof customQuote.quotedTotal === 'number' ? customQuote.quotedTotal : parseFloat(customQuote.quotedTotal) || 0;
  
  shippingCost = 0;
  taxEstimate = quotedVAT;
  totalAmount = quotedTotal || (quotedPrice + quotedVAT);
  
  // ... items mapping ...
  
  displaySubtotal = quotedPrice;
  displayTotal = totalAmount;

// AFTER:
let shippingCost, taxEstimate, totalAmount, displayItems, displayTotal, displaySubtotal, discountAmount = 0, discountPercentage = 0, displaySubtotalAfterDiscount = 0;

if (customQuote) {
  const quotedPrice = typeof customQuote.quotedPrice === 'number' ? customQuote.quotedPrice : parseFloat(customQuote.quotedPrice) || 0;
  const quotedVAT = typeof customQuote.quotedVAT === 'number' ? customQuote.quotedVAT : parseFloat(customQuote.quotedVAT) || 0;
  const quotedTotal = typeof customQuote.quotedTotal === 'number' ? customQuote.quotedTotal : parseFloat(customQuote.quotedTotal) || 0;
  
  // 🎁 NEW: Extract discount information from custom quote
  discountPercentage = customQuote.discountPercentage || 0;
  discountAmount = customQuote.discountAmount || 0;
  
  shippingCost = 0;
  taxEstimate = quotedVAT;
  totalAmount = quotedTotal || (quotedPrice + quotedVAT);
  
  // ... items mapping ...
  
  displaySubtotal = quotedPrice;
  displayTotal = totalAmount;
```

### Change 3: Display Discount in Checkout (Lines 585-613)
```typescript
// BEFORE:
{/* Pricing */}
<div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 space-y-3">
  <div className="flex justify-between text-sm">
    <span>Subtotal</span>
    <span>₦{displaySubtotal.toLocaleString()}</span>
  </div>
  {/* Discount (if applicable for cart orders) */}
  {!customQuote && discountPercentage > 0 && (
    <div className="flex justify-between text-sm text-green-600">
      <span>Discount ({discountPercentage}%)</span>
      <span>-₦{Math.round(discountAmount).toLocaleString()}</span>
    </div>
  )}
  {/* Caution Fee (rentals) */}
  {cautionFee > 0 && (
    <div className="flex justify-between text-sm text-amber-700">
      <span>🔒 Caution Fee (50% of rentals)</span>
      <span>₦{Math.round(cautionFee).toLocaleString()}</span>
    </div>
  )}
  {customQuote && customQuote.discountAmount > 0 && (
    <div className="flex justify-between text-sm text-green-600">
      <span>Discount</span>
      <span>-₦{customQuote.discountAmount.toLocaleString()}</span>
    </div>
  )}
  {/* Shipping is handled separately and intentionally hidden on checkout */}
  <div className="flex justify-between text-sm">
    <span>Tax (7.5%)</span>
    <span>₦{Math.round(taxEstimate).toLocaleString()}</span>
  </div>
  <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-200">
    <span>Total Amount</span>
    <span className="text-purple-600">₦{displayTotal.toLocaleString()}</span>
  </div>
</div>

// AFTER:
{/* Pricing */}
<div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 space-y-3">
  <div className="flex justify-between text-sm">
    <span>Subtotal</span>
    <span>₦{displaySubtotal.toLocaleString()}</span>
  </div>
  {/* Discount (if applicable for cart orders) */}
  {!customQuote && discountPercentage > 0 && (
    <div className="flex justify-between text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
      <span>🎁 Discount ({discountPercentage}%)</span>
      <span>-₦{Math.round(discountAmount).toLocaleString()}</span>
    </div>
  )}
  {/* 🎁 NEW: Discount for custom orders */}
  {customQuote && customQuote.discountPercentage > 0 && (
    <div className="flex justify-between text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
      <span>🎁 Bulk Discount ({customQuote.discountPercentage}%)</span>
      <span>-₦{customQuote.discountAmount.toLocaleString()}</span>
    </div>
  )}
  {/* Caution Fee (rentals) */}
  {cautionFee > 0 && (
    <div className="flex justify-between text-sm text-amber-700">
      <span>🔒 Caution Fee (50% of rentals)</span>
      <span>₦{Math.round(cautionFee).toLocaleString()}</span>
    </div>
  )}
  {/* Shipping is handled separately and intentionally hidden on checkout */}
  <div className="flex justify-between text-sm">
    <span>Tax (7.5%)</span>
    <span>₦{Math.round(taxEstimate).toLocaleString()}</span>
  </div>
  <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-200">
    <span>Total Amount</span>
    <span className="text-purple-600">₦{displayTotal.toLocaleString()}</span>
  </div>
</div>
```

---

## File 4: verify-payment/unified/route.ts
**Location**: `/app/api/verify-payment/unified/route.ts`

### Change: Update Invoice Creation (Lines 54-82)
```typescript
// BEFORE:
const invoiceNumber = `INV-${Date.now()}`;
const invoice = await Invoice.create({
  orderNumber: order.orderNumber,
  invoiceNumber,
  paymentReference: reference,
  paymentVerified: true,
  customerEmail: order.email,
  items: order.items,
  subtotal: order.subtotal,
  vat: order.vat,
  total: order.total,
  createdAt: new Date(),
});

// AFTER:
const invoiceNumber = `INV-${Date.now()}`;
const invoice = await Invoice.create({
  orderNumber: order.orderNumber,
  invoiceNumber,
  paymentReference: reference,
  paymentVerified: true,
  customerEmail: order.email,
  customerName: `${order.firstName} ${order.lastName}`,
  customerPhone: order.phone,
  customerAddress: order.address,
  customerCity: order.city,
  customerState: order.state,
  customerPostalCode: order.zipCode,
  items: order.items,
  subtotal: order.subtotal,
  // 🎁 NEW: Include discount information
  bulkDiscountPercentage: order.discountPercentage || 0,
  bulkDiscountAmount: order.discountAmount || 0,
  vat: order.vat,
  taxAmount: order.vat,
  total: order.total,
  totalAmount: order.total,
  currency: 'NGN',
  currencySymbol: '₦',
  type: 'automatic',
  status: 'sent',
  invoiceDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  createdAt: new Date(),
});
```

---

## Summary of Changes

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| CustomOrderCard.tsx | Import | 1 | Add discount calculator |
| CustomOrderCard.tsx | Function | 193-224 | Calculate discount |
| CustomOrderCard.tsx | Logic | 272-307 | Send discount with quote |
| CustomOrderCard.tsx | UI | 813-845 | Display discount |
| CustomOrderCard.tsx | UI | 950-970 | Show discount badge |
| UnifiedOrder.ts | Interface | 66+ | Add schema field |
| UnifiedOrder.ts | Schema | 206+ | Define database field |
| checkout/page.tsx | Logic | 62-91 | Load discount from DB |
| checkout/page.tsx | Logic | 462-510 | Extract discount |
| checkout/page.tsx | UI | 585-613 | Display discount |
| verify-payment/route.ts | Logic | 54-82 | Include in invoice |

**Total Changes**: 11 changes across 4 files
**Lines Added**: ~150 (mostly new code, some refactored)
**Backward Compatibility**: ✅ Yes (all fields optional)

---
