# 🎯 Offline Orders Quick Start

## How It Works

Admin can now record sales that didn't happen through the website directly in the Finance Dashboard.

### 3-Step Process

1. **Open Form**
   - Go to Finance Dashboard
   - Click "Add Offline Order" button (top-right)

2. **Fill Form**
   - Enter customer name, email, amount
   - Select payment method
   - Click "Record Order"

3. **Done!**
   - Order automatically included in VAT
   - Shows in Transaction History
   - Dashboard updates in real-time

---

## Key Features

### Auto-Calculated
- ✅ VAT amount (7.5%)
- ✅ Total amount (subtotal + VAT)
- ✅ Order number (OFF-xxxxx format)

### Data Captured
- ✅ Buyer name and email
- ✅ Sale amount and VAT
- ✅ Payment method
- ✅ Date/time
- ✅ Order status (complete)

### Integration
- ✅ Included in monthly VAT breakdown
- ✅ Shows in transaction history
- ✅ Marked as "Offline" in reports
- ✅ Counted in dashboard metrics

---

## API Usage (For Developers)

### Create Offline Order
```bash
POST /api/admin/offline-orders
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "subtotal": 50000,
  "paymentMethod": "cash"
}
```

### Response
```json
{
  "success": true,
  "orderId": "...",
  "orderNumber": "OFF-1732000000000-abc123",
  "message": "Offline order saved successfully",
  "data": { /* order details */ }
}
```

### Get Offline Orders
```bash
GET /api/admin/offline-orders?limit=50&skip=0
```

---

## Where to Find Offline Orders

1. **Transaction History** (VAT Management tab)
   - New "Type" column shows "Offline" badge
   - Filter by order type
   - Search by order number (starts with OFF-)

2. **Monthly VAT Breakdown**
   - Order counts include offline sales
   - VAT totals include offline VAT collected

3. **Finance Dashboard**
   - Dashboard metrics auto-refresh
   - Total revenue includes offline sales

---

## Order Identification

- **Online Orders**: Standard numbers (ORD-123456)
- **Offline Orders**: OFF-1732000000000-abc123

Easy to spot with OFF- prefix!

---

## VAT Calculation Example

**Input**:
- Sale Amount: ₦50,000.00

**Auto-Calculated**:
- VAT (7.5%): ₦3,750.00
- Total: ₦53,750.00

**Recorded In Database**:
- subtotal: 50000
- vat: 3750
- total: 53750
- isOffline: true
- status: completed

---

## Recent Files

- ✅ `app/admin/offline-order-form.tsx` - Form component
- ✅ `app/api/admin/offline-orders/route.ts` - API endpoint
- ✅ `lib/models/Order.ts` - Added isOffline field
- ✅ `app/admin/finance/page.tsx` - Button and modal
- ✅ `app/admin/vat-tab.tsx` - Transaction history type column

---

## Status

✅ **Fully Implemented**
✅ **Zero TypeScript Errors**
✅ **Production Ready**
✅ **All Features Tested**
